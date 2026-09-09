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
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import type { FollowUpSource } from '../../src/types';
import { followUpTypeLabel } from '../../src/i18n/labels';
import { aiProvider, isUsingMockAI, type ExtractedFollowUp, type ImageMediaType } from '../../src/ai';
import { applyReminderLead } from '../../src/utils/date';
import { scheduleMainReminder } from '../../src/services/reminderScheduler';
import { isImportantFollowUp, scheduleExtraReminders, type ExtraReminderChoice } from '../../src/services/smartReminders';
import { SmartReminderPrompt } from '../../src/components/SmartReminderPrompt';
import { updateWidgetSummary } from '../../src/services/widget';
import { AI_USAGE_FREE_LIMIT, getAiUsageCount, hasAiUsageRemaining, incrementAiUsageCount } from '../../src/services/aiUsage';
import { useIsPremium } from '../../src/services/subscription';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { getCardSurface } from '../../src/constants/cardStyle';

interface Candidate extends ExtractedFollowUp {
  selected: boolean;
}

type Mode = 'text' | 'voice' | 'image' | 'pdf';

// Bu eşiğin altındaki adaylar varsayılan olarak seçili gelmez — kullanıcı
// kendisi gözden geçirip onaylamalı (gizlilik/doğruluk gereksinimi).
const LOW_CONFIDENCE_THRESHOLD = 0.6;

// Backend'deki MAX_BASE64_LENGTH (7MB) ile aynı — kullanıcıyı yüklemeden
// önce uyarmak için burada da kontrol ediyoruz.
const MAX_PDF_BASE64_LENGTH = 7 * 1024 * 1024;

function toCandidates(results: ExtractedFollowUp[]): Candidate[] {
  return results.map((r) => ({ ...r, selected: r.confidence >= LOW_CONFIDENCE_THRESHOLD }));
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function guessMediaType(filename: string | null | undefined): ImageMediaType {
  const ext = (filename ?? '').toLowerCase().split('.').pop();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

export default function AiCikarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const params = useLocalSearchParams<{ mode?: string; autoScreenshot?: string }>();

  const [mode, setMode] = useState<Mode>('text');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [candidateSource, setCandidateSource] = useState<FollowUpSource>('text');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importantQueue, setImportantQueue] = useState<{ id: string; title: string; dueAt: number }[]>([]);
  const isPremium = useIsPremium();
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    getAiUsageCount().then(setUsageCount);
  }, []);

  async function checkAiUsageGate(): Promise<boolean> {
    if (isPremium) return true;
    if (await hasAiUsageRemaining()) return true;
    setError(t('aiUsage.limitReachedMessage', { limit: AI_USAGE_FREE_LIMIT }));
    return false;
  }

  async function consumeAiUsage() {
    if (isPremium) return;
    setUsageCount(await incrementAiUsageCount());
  }

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const [hasRecording, setHasRecording] = useState(false);

  const [imagePreviewUri, setImagePreviewUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<ImageMediaType | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (params.mode === 'image') setMode('image');
  }, [params.mode]);

  useEffect(() => {
    if (params.autoScreenshot === '1') {
      void handleLoadLastScreenshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.autoScreenshot]);

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
      base64: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    setImagePreviewUri(asset.uri);
    setImageBase64(asset.base64 ?? null);
    setImageMediaType((asset.mimeType as ImageMediaType) || guessMediaType(asset.fileName));
    setCandidates(null);
  }

  async function handleLoadLastScreenshot() {
    setImageLoading(true);
    setError(null);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        setError(t('aiCikar.screenshotPermissionError'));
        return;
      }
      const page = await MediaLibrary.getAssetsAsync({
        first: 1,
        mediaType: 'photo',
        // Android'de ekran görüntülerinin creationTime'ı (kameranın EXIF
        // tarihine dayanır) genelde boş kalıyor; modificationTime güvenilir.
        sortBy: [['modificationTime', false]],
      });
      const asset = page.assets[0];
      if (!asset) {
        setError(t('aiCikar.screenshotNotFound'));
        return;
      }
      const info = await MediaLibrary.getAssetInfoAsync(asset);
      const uri = info.localUri ?? asset.uri;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      setImagePreviewUri(uri);
      setImageBase64(base64);
      setImageMediaType(guessMediaType(asset.filename));
      setCandidates(null);
    } catch (e) {
      setError(t('aiCikar.screenshotLoadError'));
    } finally {
      setImageLoading(false);
    }
  }

  async function handleExtractImage() {
    if (!imageBase64 || !imageMediaType || loading) return;
    if (!(await checkAiUsageGate())) return;
    setLoading(true);
    setError(null);
    try {
      const results = await aiProvider.extractFollowUpsFromImage(imageBase64, imageMediaType);
      await consumeAiUsage();
      setCandidates(toCandidates(results));
      setCandidateSource('screenshot');
      setTranscript(null);
    } catch (e) {
      setError(t('aiCikar.imageError'));
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

  async function handleSave() {
    if (!candidates || saving) return;
    const selected = candidates.filter((c) => c.selected);
    if (selected.length === 0) return;
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

        const dueAt = candidate.dueAtISO ? new Date(candidate.dueAtISO).getTime() : null;
        const remindAt = dueAt ? applyReminderLead(dueAt, reminderLeadMinutes) : null;
        const followUp = await createFollowUp(db, {
          title: candidate.title,
          type: candidate.type,
          personId,
          dueAt,
          remindAt,
          source: candidateSource,
          confidence: candidate.confidence,
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
  const containerProps =
    Platform.OS === 'ios' ? { behavior: 'padding' as const, keyboardVerticalOffset: headerHeight } : {};

  return (
    <Container style={{ flex: 1 }} {...containerProps}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          Platform.OS === 'android' && { paddingBottom: 60 + insets.bottom + keyboardHeight },
        ]}
      >
        {isUsingMockAI && (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>{t('aiCikar.mockBanner')}</Text>
          </View>
        )}

        {!isPremium && usageCount >= AI_USAGE_FREE_LIMIT && (
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
          <Text style={styles.usageHint}>
            {t('aiUsage.remainingHint', { used: usageCount, limit: AI_USAGE_FREE_LIMIT })}
          </Text>
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
            <Text style={styles.label}>{t('aiCikar.textLabel')}</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder={t('aiCikar.textPlaceholder')}
              value={text}
              onChangeText={setText}
              multiline
              editable={!loading}
              accessibilityLabel={t('aiCikar.textLabel')}
            />
            <View style={styles.extractButtonWrap}>
              <Button
                label={t('aiCikar.extract')}
                onPress={handleExtractText}
                disabled={!text.trim() || loading}
                loading={loading}
                accessibilityLabel={t('aiCikar.extract')}
              />
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
            <View style={styles.extractButtonWrap}>
              <Button
                label={t('aiCikar.extract')}
                onPress={handleExtractVoice}
                disabled={!hasRecording || loading}
                loading={loading}
                accessibilityLabel={t('aiCikar.extract')}
              />
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
            ) : imagePreviewUri ? (
              <View style={styles.imagePreviewBox}>
                <Image
                  source={{ uri: imagePreviewUri }}
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
            <View style={styles.extractButtonWrap}>
              <Button
                label={t('aiCikar.extract')}
                onPress={handleExtractImage}
                disabled={!imageBase64 || loading}
                loading={loading}
                accessibilityLabel={t('aiCikar.extract')}
              />
            </View>
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
            <View style={styles.extractButtonWrap}>
              <Button
                label={t('aiCikar.extract')}
                onPress={handleExtractPdf}
                disabled={!pdfBase64 || loading}
                loading={loading}
                accessibilityLabel={t('aiCikar.extract')}
              />
            </View>
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
                c.dueAtISO ? t('aiCikar.dateLabel', { date: new Date(c.dueAtISO).toLocaleString(i18n.language) }) : null,
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
                  {c.dueAtISO && (
                    <Text style={styles.candidateMeta}>⏰ {new Date(c.dueAtISO).toLocaleString(i18n.language)}</Text>
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
      <SmartReminderPrompt
        visible={importantQueue.length > 0}
        title={importantQueue[0]?.title ?? ''}
        onChoose={handleReminderChoice}
      />
    </Container>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { padding: 20, paddingBottom: 60 },
    mockBanner: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    mockBannerText: { color: colors.gold, fontSize: fontSize.small, fontFamily: fontFamily.body },
    usageLimitBanner: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      padding: 14,
      marginBottom: 16,
      gap: 8,
    },
    usageLimitText: { color: colors.text, fontSize: fontSize.small, fontFamily: fontFamily.body, lineHeight: 19 },
    usageLimitCta: { color: colors.primary, fontSize: fontSize.small, fontFamily: fontFamily.bodyBold },
    usageHint: { color: colors.textMuted, fontSize: fontSize.caption, fontFamily: fontFamily.body, marginBottom: 12 },
    modeRow: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 4, marginBottom: 20 },
    modeTab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    modeTabActive: { backgroundColor: colors.surface },
    modeTabText: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.textMuted },
    modeTabTextActive: { color: colors.text },
    label: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.textMuted, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: fontSize.base,
      fontFamily: fontFamily.body,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    multiline: { minHeight: 120, textAlignVertical: 'top' },
    extractButtonWrap: { marginTop: 16 },
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
    saveButtonWrap: { marginTop: 8 },
  });
}
