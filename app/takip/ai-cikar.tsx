import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ImagePlus, Mic } from 'lucide-react-native';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { createFollowUp, createPerson, listPeople } from '../../src/db/queries';
import type { FollowUpSource, Recurrence } from '../../src/types';
import { recurrenceLabel } from '../../src/components/RecurrencePicker';
import { followUpTypeLabel } from '../../src/i18n/labels';
import { AIRequestError, aiProvider, isUsingMockAI, type ExtractedFollowUp } from '../../src/ai';
import { MAX_IMAGE_UPLOAD_BYTES, getFileSize, prepareImageForUpload, type PickedImage } from '../../src/utils/imageUpload';
import { applyReminderLead, formatDueDate } from '../../src/utils/date';
import { scheduleMainReminder } from '../../src/services/reminderScheduler';
import { isImportantFollowUp, scheduleExtraReminders, type ExtraReminderChoice } from '../../src/services/smartReminders';
import { SmartReminderPrompt } from '../../src/components/SmartReminderPrompt';
import { DateTimeSheet } from '../../src/components/DateTimeSheet';
import { getLatestScreenshot } from '../../src/services/screenshotSuggestion';
import { updateWidgetSummary } from '../../src/services/widget';
import {
  AI_USAGE_FREE_LIMIT,
  getAiBonus,
  getAiUsageCount,
  hasAiUsageRemaining,
  markAiUsageLimitReached,
  recordAiUsage,
} from '../../src/services/aiUsage';
import { useIsPremium } from '../../src/services/subscription';
import { recordSuccessfulExtraction } from '../../src/services/suggestionCards';
import { useTheme, hexToRgba, fontFamily, fontSize, letterSpacing, type ThemeColors } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import { GradientBackground } from '../../src/components/GradientBackground';
import { getCardSurface } from '../../src/constants/cardStyle';

interface Candidate extends ExtractedFollowUp {
  selected: boolean;
  /** Yerel zaman damgası; yalnızca tarih biliniyorsa günün başlangıcı. */
  dueAt: number | null;
  /** Saat metinden geldiyse veya kullanıcı seçtiyse true. */
  hasTime: boolean;
}

// AI "none" diyorsa veya eski sunucu alanı göndermiyorsa tekrar yok.
function toRecurrence(value: ExtractedFollowUp['recurrence']): Recurrence | null {
  return value === 'daily' || value === 'weekly' || value === 'monthly' ? value : null;
}

type Mode = 'text' | 'voice' | 'image' | 'pdf';

// Bu eşiğin altındaki adaylar varsayılan olarak seçili gelmez — kullanıcı
// kendisi gözden geçirip onaylamalı (gizlilik/doğruluk gereksinimi).
const LOW_CONFIDENCE_THRESHOLD = 0.6;

// Backend'deki MAX_BASE64_LENGTH (7MB) ile aynı — kullanıcıyı yüklemeden
// önce uyarmak için burada da kontrol ediyoruz.
const MAX_PDF_BASE64_LENGTH = 7 * 1024 * 1024;

// Saat, metinde yazdığı gibi yerel duvar saati olarak yorumlanır — ISO'daki
// ofset yok sayılıp bileşenlerden yerel bir tarih kurulur. Böylece "10:00"
// hangi saat diliminde olursa olsun 10:00 olarak kalır.
function parseLocalDue(iso: string | null): number | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(iso);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), h ? Number(h) : 0, mi ? Number(mi) : 0).getTime();
}

function toCandidates(results: ExtractedFollowUp[]): Candidate[] {
  return results.map((r) => {
    const dueAt = parseLocalDue(r.dueAtISO);
    return {
      ...r,
      selected: r.confidence >= LOW_CONFIDENCE_THRESHOLD,
      dueAt,
      hasTime: dueAt !== null && (r.timeSpecified ?? true),
    };
  });
}

function initialPickerDate(c: Candidate): Date {
  if (c.dueAt !== null) {
    const d = new Date(c.dueAt);
    if (!c.hasTime) d.setHours(9, 0, 0, 0);
    return d;
  }
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function AiCikarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const params = useLocalSearchParams<{ mode?: string; autoScreenshot?: string; assetId?: string }>();

  const [mode, setMode] = useState<Mode>('text');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [candidateSource, setCandidateSource] = useState<FollowUpSource>('text');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importantQueue, setImportantQueue] = useState<{ id: string; title: string; dueAt: number }[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState<Date>(new Date());
  const isPremium = useIsPremium();
  const [usageCount, setUsageCount] = useState(0);
  const [bonusCount, setBonusCount] = useState(0);

  useEffect(() => {
    getAiUsageCount().then(setUsageCount);
    getAiBonus().then(setBonusCount);
  }, []);

  function showAiLimitReached() {
    setError(t('aiUsage.limitReachedMessage', { limit: AI_USAGE_FREE_LIMIT }));
    Alert.alert(t('aiUsage.limitReachedTitle'), t('aiUsage.limitReachedMessage', { limit: AI_USAGE_FREE_LIMIT }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('aiUsage.goPremiumButton'), onPress: () => router.push('/premium') },
    ]);
  }

  async function checkAiUsageGate(): Promise<boolean> {
    if (isPremium) return true;
    if (await hasAiUsageRemaining()) return true;
    showAiLimitReached();
    return false;
  }

  async function consumeAiUsage() {
    if (isPremium) return;
    setUsageCount(await recordAiUsage());
    setBonusCount(await getAiBonus());
  }

  // Asıl sınır sunucuda: telefondaki sayaç hak kaldığını sansa bile (ör. uygulama
  // yeniden yüklendiyse) sunucu 402 döndürürse aynı premium penceresini gösteririz.
  function handleAiLimitError(e: unknown): boolean {
    if (!(e instanceof AIRequestError) || e.status !== 402) return false;
    void markAiUsageLimitReached().then((count) => {
      setUsageCount(count);
      setBonusCount(0);
    });
    showAiLimitReached();
    return true;
  }

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const [hasRecording, setHasRecording] = useState(false);

  const [image, setImage] = useState<PickedImage | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (params.mode === 'image') setMode('image');
  }, [params.mode]);

  useEffect(() => {
    if (params.autoScreenshot === '1') {
      void handleLoadLastScreenshot(params.assetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.autoScreenshot, params.assetId]);

  async function handleExtractText() {
    if (!text.trim() || loading) return;
    if (!(await checkAiUsageGate())) return;
    setLoading(true);
    setError(null);
    try {
      const results = await aiProvider.extractFollowUpsFromText(text.trim());
      await consumeAiUsage();
      setCandidates(toCandidates(results));
      setCandidateSource('text');
      setTranscript(null);
    } catch (e) {
      if (handleAiLimitError(e)) return;
      setError(t('aiCikar.textError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleStartRecording() {
    setError(null);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError(t('aiCikar.micPermissionError'));
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setHasRecording(false);
    setCandidates(null);
    setTranscript(null);
  }

  async function handleStopRecording() {
    await recorder.stop();
    setHasRecording(true);
  }

  async function handleExtractVoice() {
    if (!recorder.uri || loading) return;
    if (!(await checkAiUsageGate())) return;
    setLoading(true);
    setError(null);
    try {
      const result = await aiProvider.transcribeAndExtract(recorder.uri);
      await consumeAiUsage();
      setTranscript(result.transcript);
      setCandidates(toCandidates(result.candidates));
      setCandidateSource('voice');
    } catch (e) {
      if (handleAiLimitError(e)) return;
      setError(t('aiCikar.voiceError'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePickImage() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('aiCikar.galleryPermissionError'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      // HEIC fotoğrafların JPEG olarak (kaliteyle sıkıştırılmış) gelmesi için.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.uri) {
      setError(t('aiCikar.screenshotLoadError'));
      return;
    }
    setImage({ uri: asset.uri, width: asset.width, height: asset.height });
    setCandidates(null);
  }

  /** Bildirimden gelindiyse o ekran görüntüsünü, değilse en yenisini yükler. */
  async function handleLoadLastScreenshot(assetId?: string) {
    setImageLoading(true);
    setError(null);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        setError(t('aiCikar.screenshotPermissionError'));
        return;
      }
      let info: MediaLibrary.AssetInfo | null = null;
      if (assetId) {
        // Ekran görüntüsü bu arada silinmiş olabilir; o zaman en yenisine düşüyoruz.
        info = await MediaLibrary.getAssetInfoAsync(assetId).catch(() => null);
      }
      if (!info) {
        const asset = await getLatestScreenshot();
        if (!asset) {
          setError(t('aiCikar.screenshotNotFound'));
          return;
        }
        info = await MediaLibrary.getAssetInfoAsync(asset);
      }
      if (!info.localUri) {
        setError(t('aiCikar.screenshotLoadError'));
        return;
      }
      setImage({ uri: info.localUri, width: info.width, height: info.height });
      setCandidates(null);
    } catch (e) {
      setError(t('aiCikar.screenshotLoadError'));
    } finally {
      setImageLoading(false);
    }
  }

  async function handleExtractImage() {
    if (!image || loading) return;
    if (!(await checkAiUsageGate())) return;
    setLoading(true);
    setError(null);
    try {
      const uploadUri = await prepareImageForUpload(image);
      const size = await getFileSize(uploadUri);
      if (size !== null && size > MAX_IMAGE_UPLOAD_BYTES) {
        setError(t('aiCikar.imageTooLarge'));
        return;
      }
      const results = await aiProvider.extractFollowUpsFromImage(uploadUri);
      await consumeAiUsage();
      setCandidates(toCandidates(results));
      setCandidateSource('screenshot');
      setTranscript(null);
    } catch (e) {
      if (handleAiLimitError(e)) return;
      if (e instanceof AIRequestError && e.status === 413) setError(t('aiCikar.imageTooLarge'));
      else if (e instanceof AIRequestError && e.status === 415) setError(t('aiCikar.imageUnsupported'));
      else setError(t('aiCikar.imageError'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePickPdf() {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPdfLoading(true);
    setCandidates(null);
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
      if (base64.length > MAX_PDF_BASE64_LENGTH) {
        setError(t('aiCikar.pdfTooLarge'));
        setPdfName(null);
        setPdfBase64(null);
        return;
      }
      setPdfName(asset.name);
      setPdfBase64(base64);
    } catch (e) {
      setError(t('aiCikar.pdfReadError'));
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleExtractPdf() {
    if (!pdfBase64 || loading) return;
    if (!(await checkAiUsageGate())) return;
    setLoading(true);
    setError(null);
    try {
      const results = await aiProvider.extractFollowUpsFromPdf(pdfBase64);
      await consumeAiUsage();
      setCandidates(toCandidates(results));
      setCandidateSource('pdf');
      setTranscript(null);
    } catch (e) {
      if (handleAiLimitError(e)) return;
      setError(t('aiCikar.pdfError'));
    } finally {
      setLoading(false);
    }
  }

  function toggleCandidate(index: number) {
    setCandidates((prev) =>
      prev ? prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c)) : prev
    );
  }

  function openTimePicker(index: number) {
    const c = candidates?.[index];
    if (!c) return;
    setPickerValue(initialPickerDate(c));
    setEditingIndex(index);
  }

  function commitTime(index: number, date: Date) {
    setCandidates((prev) =>
      prev ? prev.map((c, i) => (i === index ? { ...c, dueAt: date.getTime(), hasTime: true, selected: true } : c)) : prev
    );
    setEditingIndex(null);
  }

  function handleSave() {
    if (!candidates || saving) return;
    const selected = candidates.filter((c) => c.selected);
    if (selected.length === 0) return;
    const missing = selected.filter((c) => !c.hasTime);
    if (missing.length > 0) {
      Alert.alert(
        t('aiCikar.timeMissingAlertTitle'),
        t('aiCikar.timeMissingAlertMessage', { items: missing.map((c) => `• ${c.title}`).join('\n') }),
        [
          { text: t('aiCikar.saveWithoutReminder'), onPress: () => void saveCandidates(selected) },
          { text: t('aiCikar.pickTime'), style: 'cancel', onPress: () => openTimePicker(candidates.indexOf(missing[0])) },
        ]
      );
      return;
    }
    void saveCandidates(selected);
  }

  async function saveCandidates(selected: Candidate[]) {
    setSaving(true);
    try {
      const people = await listPeople(db);
      const important: { id: string; title: string; dueAt: number }[] = [];
      for (const candidate of selected) {
        let personId: string | null = null;
        let reminderLeadMinutes = 0;
        const name = candidate.personName?.trim();
        if (name) {
          const existing = people.find((p) => p.name.toLowerCase() === name.toLowerCase());
          if (existing) {
            personId = existing.id;
            reminderLeadMinutes = existing.reminderLeadMinutes;
          } else {
            personId = (await createPerson(db, name)).id;
          }
        }

        const dueAt = candidate.hasTime ? candidate.dueAt : null;
        const remindAt = dueAt ? applyReminderLead(dueAt, reminderLeadMinutes) : null;
        const followUp = await createFollowUp(db, {
          title: candidate.title,
          type: candidate.type,
          personId,
          dueAt,
          remindAt,
          source: candidateSource,
          confidence: candidate.confidence,
          recurrence: dueAt ? toRecurrence(candidate.recurrence) : null,
        });

        if (remindAt) {
          await scheduleMainReminder(db, followUp.id, remindAt);
        }

        if (dueAt && isPremium) {
          const isImportant = await isImportantFollowUp(db, { type: candidate.type, dueAt, personId });
          if (isImportant) {
            important.push({ id: followUp.id, title: candidate.title, dueAt });
          }
        }
      }

      await updateWidgetSummary(db);
      await recordSuccessfulExtraction();

      if (important.length > 0) {
        setImportantQueue(important);
        return;
      }

      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), t('aiCikar.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleReminderChoice(choice: ExtraReminderChoice) {
    const [current, ...rest] = importantQueue;
    if (current) {
      await scheduleExtraReminders(db, current.id, current.title, current.dueAt, choice);
    }
    if (rest.length > 0) {
      setImportantQueue(rest);
    } else {
      setImportantQueue([]);
      router.back();
    }
  }

  const Container = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const containerProps = Platform.OS === 'ios' ? { behavior: 'padding' as const } : {};

  const extractHandlers: Record<Mode, () => void> = {
    text: handleExtractText,
    voice: handleExtractVoice,
    image: handleExtractImage,
    pdf: handleExtractPdf,
  };
  const extractDisabled: Record<Mode, boolean> = {
    text: !text.trim() || loading,
    voice: !hasRecording || loading,
    image: !image || loading,
    pdf: !pdfBase64 || loading,
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Container style={{ flex: 1 }} {...containerProps}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            hitSlop={8}
          >
            <ArrowLeft color={colors.text} size={20} strokeWidth={2.2} />
          </Pressable>
          <View style={styles.headerTitleGroup}>
            <Image source={require('../../assets/icons/tab-ai-sparkles.png')} style={styles.headerIcon} resizeMode="contain" />
            <Text style={styles.headerTitle}>{t('stackTitles.aiIleCikar')}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          Platform.OS === 'android' && { paddingBottom: 60 + insets.bottom + keyboardHeight },
        ]}
      >
        {isUsingMockAI && (
          <View style={styles.mockBanner}>
            <View style={styles.mockBannerIcon}>
              <Text style={styles.mockBannerIconText}>⚠️</Text>
            </View>
            <Text style={styles.mockBannerText}>{t('aiCikar.mockBanner')}</Text>
          </View>
        )}

        {!isPremium && usageCount >= AI_USAGE_FREE_LIMIT && bonusCount > 0 && (
          <View style={styles.usageRow}>
            <Text style={styles.usageHint}>{t('invite.bonusHint', { bonus: bonusCount })}</Text>
          </View>
        )}
        {!isPremium && usageCount >= AI_USAGE_FREE_LIMIT && bonusCount === 0 && (
          <View style={styles.usageLimitBanner}>
            <Text style={styles.usageLimitText}>{t('aiUsage.limitReachedMessage', { limit: AI_USAGE_FREE_LIMIT })}</Text>
            <Pressable
              onPress={() => router.push('/premium')}
              accessibilityRole="button"
              accessibilityLabel={t('aiUsage.goPremiumButton')}
            >
              <Text style={styles.usageLimitCta}>{t('aiUsage.goPremiumButton')}</Text>
            </Pressable>
          </View>
        )}
        {!isPremium && usageCount < AI_USAGE_FREE_LIMIT && (
          <View style={styles.usageRow}>
            <Text style={styles.usageHint}>
              {t('aiUsage.remainingHint', { used: usageCount, limit: AI_USAGE_FREE_LIMIT })}
            </Text>
            <View style={styles.usagePlanBadge}>
              <View style={styles.usagePlanDot} />
              <Text style={styles.usagePlanBadgeText}>{t('premium.freeColumn')}</Text>
            </View>
          </View>
        )}

        <View style={styles.modeRow} accessibilityRole="radiogroup">
          <Pressable
            style={[styles.modeTab, mode === 'text' && styles.modeTabActive]}
            onPress={() => setMode('text')}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === 'text' }}
            accessibilityLabel={t('aiCikar.modeTextA11y')}
          >
            <Text style={[styles.modeTabText, mode === 'text' && styles.modeTabTextActive]}>
              {t('aiCikar.modeText')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === 'voice' && styles.modeTabActive]}
            onPress={() => setMode('voice')}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === 'voice' }}
            accessibilityLabel={t('aiCikar.modeVoiceA11y')}
          >
            <Text style={[styles.modeTabText, mode === 'voice' && styles.modeTabTextActive]}>
              {t('aiCikar.modeVoice')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === 'image' && styles.modeTabActive]}
            onPress={() => setMode('image')}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === 'image' }}
            accessibilityLabel={t('aiCikar.modeImageA11y')}
          >
            <Text style={[styles.modeTabText, mode === 'image' && styles.modeTabTextActive]}>
              {t('aiCikar.modeImage')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === 'pdf' && styles.modeTabActive]}
            onPress={() => setMode('pdf')}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === 'pdf' }}
            accessibilityLabel={t('aiCikar.modePdfA11y')}
          >
            <Text style={[styles.modeTabText, mode === 'pdf' && styles.modeTabTextActive]}>
              {t('aiCikar.modePdf')}
            </Text>
          </Pressable>
        </View>

        {mode === 'text' && (
          <>
            <TextField
              label={t('aiCikar.textLabel')}
              placeholder={t('aiCikar.textPlaceholder')}
              value={text}
              onChangeText={setText}
              multiline
              editable={!loading}
              accessibilityLabel={t('aiCikar.textLabel')}
            />
            <View style={styles.textFooterBar}>
              <View style={styles.textFooterBrand}>
                <Image source={require('../../assets/icons/tab-ai-sparkles.png')} style={styles.textFooterIcon} resizeMode="contain" />
                <Text style={styles.textFooterBrandText}>{t('aiCikar.engineBrand')}</Text>
              </View>
              {!!text && (
                <Pressable
                  onPress={() => setText('')}
                  accessibilityRole="button"
                  accessibilityLabel={t('aiCikar.clearText')}
                >
                  <Text style={styles.textFooterClear}>{t('aiCikar.clearText')}</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.quickChipsRow}>
              <Pressable
                style={styles.quickChip}
                onPress={() => setMode('voice')}
                accessibilityRole="button"
                accessibilityLabel={t('aiCikar.modeVoiceA11y')}
              >
                <View style={styles.quickChipIcon}>
                  <Mic color={colors.primaryText} size={14} strokeWidth={2.2} />
                </View>
                <Text style={styles.quickChipText}>{t('aiCikar.quickVoice')}</Text>
              </Pressable>
              <Pressable
                style={styles.quickChip}
                onPress={() => {
                  setMode('image');
                  void handleLoadLastScreenshot();
                }}
                accessibilityRole="button"
                accessibilityLabel={t('aiCikar.quickScreenshot')}
              >
                <View style={styles.quickChipIcon}>
                  <ImagePlus color={colors.primaryText} size={14} strokeWidth={2.2} />
                </View>
                <Text style={styles.quickChipText}>{t('aiCikar.quickScreenshot')}</Text>
              </Pressable>
            </View>
          </>
        )}

        {mode === 'voice' && (
          <>
            <Text style={styles.label}>{t('aiCikar.voiceLabel')}</Text>
            <View style={styles.recordBox}>
              <Text
                style={styles.recordTimer}
                accessibilityLabel={t('aiCikar.recordTimerA11y', { duration: formatDuration(recorderState.durationMillis) })}
              >
                {formatDuration(recorderState.durationMillis)}
              </Text>
              {!recorderState.isRecording ? (
                <Pressable
                  style={styles.recordButton}
                  onPress={handleStartRecording}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={hasRecording ? t('aiCikar.recordAgainA11y') : t('aiCikar.recordStartA11y')}
                >
                  <Text style={styles.recordButtonText}>
                    {hasRecording ? t('aiCikar.recordAgain') : t('aiCikar.recordStart')}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.recordButton, styles.recordButtonStop]}
                  onPress={handleStopRecording}
                  accessibilityRole="button"
                  accessibilityLabel={t('aiCikar.recordStopA11y')}
                >
                  <Text style={styles.recordButtonText}>{t('aiCikar.recordStop')}</Text>
                </Pressable>
              )}
            </View>
            {transcript !== null && (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>{t('aiCikar.transcriptLabel')}</Text>
                <Text style={styles.transcriptText}>{transcript || t('aiCikar.transcriptEmpty')}</Text>
              </View>
            )}
          </>
        )}

        {mode === 'image' && (
          <>
            <Text style={styles.label}>{t('aiCikar.imageLabel')}</Text>
            {imageLoading ? (
              <View style={styles.recordBox}>
                <ActivityIndicator />
                <Text style={styles.hint}>{t('aiCikar.imageLoadingScreenshot')}</Text>
              </View>
            ) : image ? (
              <View style={styles.imagePreviewBox}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.imagePreview}
                  resizeMode="contain"
                  accessibilityLabel={t('aiCikar.imagePreviewA11y')}
                />
                <View style={styles.secondaryButtonWrap}>
                  <Button
                    variant="secondary"
                    label={t('aiCikar.pickAnotherImage')}
                    onPress={handlePickImage}
                    disabled={loading}
                    accessibilityLabel={t('aiCikar.pickAnotherImage')}
                  />
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.pickImageButton}
                onPress={handlePickImage}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={t('aiCikar.pickImageGalleryA11y')}
              >
                <Text style={styles.pickImageButtonText}>{t('aiCikar.pickImageGallery')}</Text>
              </Pressable>
            )}
          </>
        )}

        {mode === 'pdf' && (
          <>
            <Text style={styles.label}>{t('aiCikar.pdfLabel')}</Text>
            {pdfLoading ? (
              <View style={styles.recordBox}>
                <ActivityIndicator />
                <Text style={styles.hint}>{t('aiCikar.pdfLoadingText')}</Text>
              </View>
            ) : pdfName ? (
              <View style={styles.imagePreviewBox}>
                <Text style={styles.pdfNameText}>📄 {pdfName}</Text>
                <View style={styles.secondaryButtonWrap}>
                  <Button
                    variant="secondary"
                    label={t('aiCikar.pickAnotherPdf')}
                    onPress={handlePickPdf}
                    disabled={loading}
                    accessibilityLabel={t('aiCikar.pickAnotherPdf')}
                  />
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.pickImageButton}
                onPress={handlePickPdf}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={t('aiCikar.pickPdf')}
              >
                <Text style={styles.pickImageButtonText}>{t('aiCikar.pickPdf')}</Text>
              </Pressable>
            )}
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {candidates && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>
              {candidates.length === 0 ? t('aiCikar.resultsEmpty') : t('aiCikar.resultsTitle')}
            </Text>
            {candidates.map((c, i) => {
              const candidateLabel = [
                followUpTypeLabel(c.type, t),
                c.title,
                c.personName ? t('aiCikar.personLabel', { name: c.personName }) : null,
                c.hasTime && c.dueAt !== null ? t('aiCikar.dateLabel', { date: formatDueDate(c.dueAt) }) : t('aiCikar.timeMissing'),
                c.confidence < LOW_CONFIDENCE_THRESHOLD ? t('aiCikar.lowConfidenceA11y') : null,
              ]
                .filter(Boolean)
                .join('. ');
              return (
              <Pressable
                key={i}
                style={styles.candidateCard}
                onPress={() => toggleCandidate(i)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: c.selected }}
                accessibilityLabel={candidateLabel}
              >
                <View style={[styles.checkbox, c.selected && styles.checkboxChecked]}>
                  {c.selected && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.candidateType}>{followUpTypeLabel(c.type, t)}</Text>
                  <Text style={styles.candidateTitle}>{c.title}</Text>
                  {c.personName && <Text style={styles.candidateMeta}>👤 {c.personName}</Text>}
                  {toRecurrence(c.recurrence) && (
                    <Text style={styles.candidateMeta}>{recurrenceLabel(toRecurrence(c.recurrence), t)}</Text>
                  )}
                  {c.hasTime && c.dueAt !== null ? (
                    <View style={styles.timeRow}>
                      <Text style={styles.candidateMeta}>⏰ {formatDueDate(c.dueAt)}</Text>
                      <Pressable
                        onPress={() => openTimePicker(i)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={t('aiCikar.editTimeA11y', { title: c.title })}
                      >
                        <Text style={styles.timeEdit}>{t('aiCikar.editTime')}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.timeMissingBox}>
                      {c.dueAt !== null && (
                        <Text style={styles.candidateMeta}>
                          📅 {new Date(c.dueAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      )}
                      <Text style={styles.timeMissingText}>⚠️ {t('aiCikar.timeMissing')}</Text>
                      <Pressable
                        style={styles.pickTimeButton}
                        onPress={() => openTimePicker(i)}
                        accessibilityRole="button"
                        accessibilityLabel={t('aiCikar.pickTimeA11y', { title: c.title })}
                      >
                        <Text style={styles.pickTimeButtonText}>{t('aiCikar.pickTime')}</Text>
                      </Pressable>
                    </View>
                  )}
                  {c.confidence < LOW_CONFIDENCE_THRESHOLD && (
                    <Text style={styles.candidateLowConfidence}>{t('aiCikar.lowConfidenceText')}</Text>
                  )}
                  {c.note && <Text style={styles.candidateNote}>💬 {c.note}</Text>}
                </View>
              </Pressable>
              );
            })}

            {candidates.length > 0 && (
              <View style={styles.saveButtonWrap}>
                <Button
                  variant="success"
                  label={
                    saving
                      ? t('aiCikar.saving')
                      : t('aiCikar.saveSelected', { count: candidates.filter((c) => c.selected).length })
                  }
                  onPress={handleSave}
                  disabled={saving}
                  loading={saving}
                  accessibilityLabel={t('aiCikar.saveSelected', { count: candidates.filter((c) => c.selected).length })}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={t('aiCikar.extract')}
          onPress={extractHandlers[mode]}
          disabled={extractDisabled[mode]}
          loading={loading}
          icon={<Image source={require('../../assets/icons/tab-ai-sparkles.png')} style={styles.footerButtonIcon} resizeMode="contain" />}
          accessibilityLabel={t('aiCikar.extract')}
        />
      </View>
      <DateTimeSheet
        visible={editingIndex !== null}
        initialValue={pickerValue}
        title={editingIndex !== null ? candidates?.[editingIndex]?.title : undefined}
        onConfirm={(date) => editingIndex !== null && commitTime(editingIndex, date)}
        onCancel={() => setEditingIndex(null)}
      />
      <SmartReminderPrompt
        visible={importantQueue.length > 0}
        title={importantQueue[0]?.title ?? ''}
        onChoose={handleReminderChoice}
      />
      </Container>
      </SafeAreaView>
    </GradientBackground>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glassBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    headerSpacer: { width: 40, height: 40 },
    headerTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerIcon: { width: 22, height: 22 },
    headerTitle: {
      fontSize: fontSize.title,
      fontFamily: fontFamily.bodyBold,
      color: colors.text,
      letterSpacing: letterSpacing.title,
    },
    footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
    footerButtonIcon: { width: 20, height: 20 },
    content: { padding: 20, paddingBottom: 24 },
    textFooterBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingHorizontal: 2,
    },
    textFooterBrand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    textFooterIcon: { width: 14, height: 14 },
    textFooterBrandText: { fontSize: fontSize.caption, fontFamily: fontFamily.bodySemiBold, color: colors.primaryText },
    textFooterClear: { fontSize: fontSize.caption, fontFamily: fontFamily.bodySemiBold, color: colors.textMuted },
    quickChipsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    quickChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.glassBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
    },
    quickChipIcon: { backgroundColor: hexToRgba(colors.primary, 0.1), borderRadius: 6, padding: 3 },
    quickChipText: { fontSize: fontSize.caption, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    mockBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: hexToRgba(colors.tertiary, 0.1),
      borderWidth: 1,
      borderColor: hexToRgba(colors.tertiary, 0.25),
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
    },
    mockBannerIcon: {
      backgroundColor: hexToRgba(colors.tertiary, 0.18),
      borderRadius: 8,
      padding: 4,
    },
    mockBannerIconText: { fontSize: fontSize.small },
    mockBannerText: { flex: 1, color: colors.onTertiaryContainer, fontSize: fontSize.small, fontFamily: fontFamily.body, lineHeight: 18 },
    usageLimitBanner: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
      gap: 8,
    },
    usageLimitText: { color: colors.text, fontSize: fontSize.small, fontFamily: fontFamily.body, lineHeight: 19 },
    usageLimitCta: { color: colors.primary, fontSize: fontSize.small, fontFamily: fontFamily.bodyBold },
    usageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16 },
    usageHint: { flex: 1, color: colors.textMuted, fontSize: fontSize.caption, fontFamily: fontFamily.body },
    usagePlanBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: hexToRgba(colors.primary, 0.1),
      borderWidth: 1,
      borderColor: hexToRgba(colors.primary, 0.2),
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    usagePlanDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primaryText },
    usagePlanBadgeText: { fontSize: fontSize.caption, fontFamily: fontFamily.label, color: colors.primaryText },
    modeRow: { flexDirection: 'row', backgroundColor: hexToRgba(colors.surfaceAlt, 0.6), borderRadius: 16, padding: 5, marginBottom: 20 },
    modeTab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    modeTabActive: { backgroundColor: colors.surface },
    modeTabText: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.textMuted },
    modeTabTextActive: { color: colors.text },
    label: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.textMuted, marginBottom: 6 },
    error: { color: colors.danger, marginTop: 12, fontSize: fontSize.small, fontFamily: fontFamily.body },
    hint: { fontSize: fontSize.small, color: colors.textMuted, marginTop: 12, fontFamily: fontFamily.body },
    pickImageButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      paddingVertical: 32,
      alignItems: 'center',
    },
    pickImageButtonText: { fontSize: fontSize.button, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    imagePreviewBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      alignItems: 'center',
    },
    imagePreview: { width: '100%', height: 220, borderRadius: 8, backgroundColor: colors.surfaceAlt },
    pdfNameText: { fontSize: fontSize.base, fontFamily: fontFamily.bodySemiBold, color: colors.text, textAlign: 'center' },
    secondaryButtonWrap: { marginTop: 12 },
    recordBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      alignItems: 'center',
    },
    recordTimer: {
      fontSize: fontSize.display,
      fontFamily: fontFamily.bodyBold,
      color: colors.text,
      marginBottom: 16,
      fontVariant: ['tabular-nums'],
    },
    recordButton: {
      backgroundColor: colors.rose,
      borderRadius: 999,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    recordButtonStop: { backgroundColor: colors.danger },
    recordButtonText: { color: colors.onPrimary, fontSize: fontSize.base, fontFamily: fontFamily.bodyBold },
    transcriptBox: {
      marginTop: 16,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      padding: 14,
    },
    transcriptLabel: { fontSize: fontSize.caption, fontFamily: fontFamily.bodyBold, color: colors.textMuted, marginBottom: 4 },
    transcriptText: { fontSize: fontSize.small, color: colors.text, lineHeight: 20, fontFamily: fontFamily.body },
    results: { marginTop: 24 },
    resultsTitle: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.text, marginBottom: 12 },
    candidateCard: {
      ...getCardSurface(colors),
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 10,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkboxMark: { color: colors.onPrimary, fontSize: fontSize.small, fontFamily: fontFamily.bodyBold },
    candidateType: { fontSize: fontSize.caption, fontFamily: fontFamily.bodyBold, color: colors.primary, marginBottom: 2 },
    candidateTitle: { fontSize: fontSize.base, fontFamily: fontFamily.displaySemiBold, color: colors.text },
    candidateMeta: { fontSize: fontSize.small, color: colors.textMuted, marginTop: 2, fontFamily: fontFamily.body },
    candidateLowConfidence: { fontSize: fontSize.caption, color: colors.gold, marginTop: 4, fontFamily: fontFamily.bodySemiBold },
    candidateNote: { fontSize: fontSize.caption, color: colors.textMuted, marginTop: 4, fontStyle: 'italic', fontFamily: fontFamily.body },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    timeEdit: { fontSize: fontSize.small, fontFamily: fontFamily.bodyBold, color: colors.primary, marginTop: 2 },
    timeMissingBox: {
      marginTop: 8,
      padding: 10,
      borderRadius: 12,
      backgroundColor: hexToRgba(colors.gold, 0.12),
      borderWidth: 1,
      borderColor: hexToRgba(colors.gold, 0.35),
      gap: 6,
    },
    timeMissingText: { fontSize: fontSize.caption, fontFamily: fontFamily.bodySemiBold, color: colors.text, lineHeight: 18 },
    pickTimeButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    pickTimeButtonText: { fontSize: fontSize.caption, fontFamily: fontFamily.bodyBold, color: colors.onPrimary },
    saveButtonWrap: { marginTop: 8 },
  });
}
