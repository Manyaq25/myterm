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
import { useSQLiteContext } from 'expo-sqlite';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { FOLLOW_UP_TYPE_LABELS, type FollowUpSource } from '../../src/types';
import { aiProvider, isUsingMockAI, type ExtractedFollowUp, type ImageMediaType } from '../../src/ai';
import { applyReminderLead } from '../../src/utils/date';
import { scheduleMainReminder } from '../../src/services/reminderScheduler';
import { isImportantFollowUp, scheduleExtraReminders, type ExtraReminderChoice } from '../../src/services/smartReminders';
import { SmartReminderPrompt } from '../../src/components/SmartReminderPrompt';
import { updateWidgetSummary } from '../../src/services/widget';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../../src/theme';

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
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
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
    setLoading(true);
    setError(null);
    try {
      const results = await aiProvider.extractFollowUpsFromText(text.trim());
      setCandidates(toCandidates(results));
      setCandidateSource('text');
      setTranscript(null);
    } catch (e) {
      setError('Çıkarım başarısız oldu. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartRecording() {
    setError(null);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('Kayıt yapmak için mikrofon izni gerekiyor.');
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
    setLoading(true);
    setError(null);
    try {
      const result = await aiProvider.transcribeAndExtract(recorder.uri);
      setTranscript(result.transcript);
      setCandidates(toCandidates(result.candidates));
      setCandidateSource('voice');
    } catch (e) {
      setError('Deşifre/çıkarım başarısız oldu. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePickImage() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Görsel seçmek için galeri izni gerekiyor.');
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
        setError('Son ekran görüntünü bulmak için galeri izni gerekiyor.');
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
        setError('Son bir ekran görüntüsü bulunamadı.');
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
      setError('Ekran görüntüsü yüklenemedi.');
    } finally {
      setImageLoading(false);
    }
  }

  async function handleExtractImage() {
    if (!imageBase64 || !imageMediaType || loading) return;
    setLoading(true);
    setError(null);
    try {
      const results = await aiProvider.extractFollowUpsFromImage(imageBase64, imageMediaType);
      setCandidates(toCandidates(results));
      setCandidateSource('screenshot');
      setTranscript(null);
    } catch (e) {
      setError('Görsel analizi başarısız oldu. Lütfen tekrar dene.');
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
        setError('Belge çok büyük. Daha küçük bir PDF dener misin?');
        setPdfName(null);
        setPdfBase64(null);
        return;
      }
      setPdfName(asset.name);
      setPdfBase64(base64);
    } catch (e) {
      setError('Belge okunamadı.');
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleExtractPdf() {
    if (!pdfBase64 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const results = await aiProvider.extractFollowUpsFromPdf(pdfBase64);
      setCandidates(toCandidates(results));
      setCandidateSource('pdf');
      setTranscript(null);
    } catch (e) {
      setError('Belge analizi başarısız oldu. Lütfen tekrar dene.');
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

        if (dueAt) {
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
      Alert.alert('Hata', 'Kaydetme sırasında bir sorun oluştu.');
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight + (Platform.OS === 'android' ? insets.bottom : 0)}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {isUsingMockAI && (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>
              Test modu: gerçek AI backend'i henüz bağlı değil, sonuçlar sahte (mock) olacak.
            </Text>
          </View>
        )}

        <View style={styles.modeRow} accessibilityRole="radiogroup">
          <Pressable
            style={[styles.modeTab, mode === 'text' && styles.modeTabActive]}
            onPress={() => setMode('text')}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === 'text' }}
            accessibilityLabel="Metin modu"
          >
            <Text style={[styles.modeTabText, mode === 'text' && styles.modeTabTextActive]}>Metin</Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === 'voice' && styles.modeTabActive]}
            onPress={() => setMode('voice')}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === 'voice' }}
            accessibilityLabel="Sesli mod"
          >
            <Text style={[styles.modeTabText, mode === 'voice' && styles.modeTabTextActive]}>Sesli</Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === 'image' && styles.modeTabActive]}
            onPress={() => setMode('image')}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === 'image' }}
            accessibilityLabel="Görsel modu"
          >
            <Text style={[styles.modeTabText, mode === 'image' && styles.modeTabTextActive]}>Görsel</Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === 'pdf' && styles.modeTabActive]}
            onPress={() => setMode('pdf')}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === 'pdf' }}
            accessibilityLabel="Belge modu"
          >
            <Text style={[styles.modeTabText, mode === 'pdf' && styles.modeTabTextActive]}>Belge</Text>
          </Pressable>
        </View>

        {mode === 'text' && (
          <>
            <Text style={styles.label}>Notunu yapıştır veya yaz</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="ör. Ahmete yarın teklifi göndereceğim, ondan da geçen haftaki raporu bekliyorum."
              value={text}
              onChangeText={setText}
              multiline
              editable={!loading}
              accessibilityLabel="Notunu yapıştır veya yaz"
            />
            <Pressable
              style={[styles.extractButton, (!text.trim() || loading) && styles.buttonDisabled]}
              onPress={handleExtractText}
              disabled={!text.trim() || loading}
              accessibilityRole="button"
              accessibilityLabel="Çıkar"
              accessibilityState={{ disabled: !text.trim() || loading, busy: loading }}
            >
              {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.extractButtonText}>Çıkar</Text>}
            </Pressable>
          </>
        )}

        {mode === 'voice' && (
          <>
            <Text style={styles.label}>Bir ses notu kaydet</Text>
            <View style={styles.recordBox}>
              <Text style={styles.recordTimer} accessibilityLabel={`Kayıt süresi ${formatDuration(recorderState.durationMillis)}`}>
                {formatDuration(recorderState.durationMillis)}
              </Text>
              {!recorderState.isRecording ? (
                <Pressable
                  style={styles.recordButton}
                  onPress={handleStartRecording}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={hasRecording ? 'Tekrar kaydet' : 'Kaydı başlat'}
                >
                  <Text style={styles.recordButtonText}>{hasRecording ? '● Tekrar kaydet' : '● Kaydı başlat'}</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.recordButton, styles.recordButtonStop]}
                  onPress={handleStopRecording}
                  accessibilityRole="button"
                  accessibilityLabel="Kaydı durdur"
                >
                  <Text style={styles.recordButtonText}>■ Kaydı durdur</Text>
                </Pressable>
              )}
            </View>
            <Pressable
              style={[styles.extractButton, (!hasRecording || loading) && styles.buttonDisabled]}
              onPress={handleExtractVoice}
              disabled={!hasRecording || loading}
              accessibilityRole="button"
              accessibilityLabel="Çıkar"
              accessibilityState={{ disabled: !hasRecording || loading, busy: loading }}
            >
              {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.extractButtonText}>Çıkar</Text>}
            </Pressable>
            {transcript !== null && (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>Duyulan:</Text>
                <Text style={styles.transcriptText}>{transcript || '(anlaşılamadı)'}</Text>
              </View>
            )}
          </>
        )}

        {mode === 'image' && (
          <>
            <Text style={styles.label}>Bir görsel seç (ekran görüntüsü, fotoğraf)</Text>
            {imageLoading ? (
              <View style={styles.recordBox}>
                <ActivityIndicator />
                <Text style={styles.hint}>Son ekran görüntün yükleniyor…</Text>
              </View>
            ) : imagePreviewUri ? (
              <View style={styles.imagePreviewBox}>
                <Image
                  source={{ uri: imagePreviewUri }}
                  style={styles.imagePreview}
                  resizeMode="contain"
                  accessibilityLabel="Seçilen görsel önizlemesi"
                />
                <Pressable
                  style={styles.secondaryButton}
                  onPress={handlePickImage}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Başka bir görsel seç"
                >
                  <Text style={styles.secondaryButtonText}>Başka bir görsel seç</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.pickImageButton}
                onPress={handlePickImage}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Galeriden görsel seç"
              >
                <Text style={styles.pickImageButtonText}>🖼️ Galeriden seç</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.extractButton, (!imageBase64 || loading) && styles.buttonDisabled]}
              onPress={handleExtractImage}
              disabled={!imageBase64 || loading}
              accessibilityRole="button"
              accessibilityLabel="Çıkar"
              accessibilityState={{ disabled: !imageBase64 || loading, busy: loading }}
            >
              {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.extractButtonText}>Çıkar</Text>}
            </Pressable>
          </>
        )}

        {mode === 'pdf' && (
          <>
            <Text style={styles.label}>Bir PDF belgesi seç</Text>
            {pdfLoading ? (
              <View style={styles.recordBox}>
                <ActivityIndicator />
                <Text style={styles.hint}>Belge yükleniyor…</Text>
              </View>
            ) : pdfName ? (
              <View style={styles.imagePreviewBox}>
                <Text style={styles.pdfNameText}>📄 {pdfName}</Text>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={handlePickPdf}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Başka bir belge seç"
                >
                  <Text style={styles.secondaryButtonText}>Başka bir belge seç</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.pickImageButton}
                onPress={handlePickPdf}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="PDF seç"
              >
                <Text style={styles.pickImageButtonText}>📄 PDF seç</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.extractButton, (!pdfBase64 || loading) && styles.buttonDisabled]}
              onPress={handleExtractPdf}
              disabled={!pdfBase64 || loading}
              accessibilityRole="button"
              accessibilityLabel="Çıkar"
              accessibilityState={{ disabled: !pdfBase64 || loading, busy: loading }}
            >
              {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.extractButtonText}>Çıkar</Text>}
            </Pressable>
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {candidates && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>
              {candidates.length === 0 ? 'Herhangi bir takip maddesi bulunamadı.' : 'Bulunanlar — kaydetmeden önce gözden geçir'}
            </Text>
            {candidates.map((c, i) => {
              const candidateLabel = [
                FOLLOW_UP_TYPE_LABELS[c.type],
                c.title,
                c.personName ? `Kişi: ${c.personName}` : null,
                c.dueAtISO ? `Tarih: ${new Date(c.dueAtISO).toLocaleString('tr-TR')}` : null,
                c.confidence < LOW_CONFIDENCE_THRESHOLD ? 'Emin değilim, gözden geçir' : null,
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
                  <Text style={styles.candidateType}>{FOLLOW_UP_TYPE_LABELS[c.type]}</Text>
                  <Text style={styles.candidateTitle}>{c.title}</Text>
                  {c.personName && <Text style={styles.candidateMeta}>👤 {c.personName}</Text>}
                  {c.dueAtISO && (
                    <Text style={styles.candidateMeta}>
                      ⏰ {new Date(c.dueAtISO).toLocaleString('tr-TR')}
                    </Text>
                  )}
                  {c.confidence < LOW_CONFIDENCE_THRESHOLD && (
                    <Text style={styles.candidateLowConfidence}>❓ Emin değilim — gözden geçir</Text>
                  )}
                  {c.note && <Text style={styles.candidateNote}>💬 {c.note}</Text>}
                </View>
              </Pressable>
              );
            })}

            {candidates.length > 0 && (
              <Pressable
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={`Seçilenleri kaydet (${candidates.filter((c) => c.selected).length})`}
                accessibilityState={{ disabled: saving, busy: saving }}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Kaydediliyor…' : `Seçilenleri kaydet (${candidates.filter((c) => c.selected).length})`}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
      <SmartReminderPrompt
        visible={importantQueue.length > 0}
        title={importantQueue[0]?.title ?? ''}
        onChoose={handleReminderChoice}
      />
    </KeyboardAvoidingView>
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
    extractButton: {
      marginTop: 16,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    extractButtonText: { color: colors.onPrimary, fontSize: fontSize.button, fontFamily: fontFamily.bodyBold },
    buttonDisabled: { opacity: 0.5 },
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
    secondaryButton: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16 },
    secondaryButtonText: { color: colors.primary, fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold },
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
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
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
    candidateTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    candidateMeta: { fontSize: fontSize.small, color: colors.textMuted, marginTop: 2, fontFamily: fontFamily.body },
    candidateLowConfidence: { fontSize: fontSize.caption, color: colors.gold, marginTop: 4, fontFamily: fontFamily.bodySemiBold },
    candidateNote: { fontSize: fontSize.caption, color: colors.textMuted, marginTop: 4, fontStyle: 'italic', fontFamily: fontFamily.body },
    saveButton: {
      marginTop: 8,
      backgroundColor: colors.success,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonText: { color: colors.onPrimary, fontSize: fontSize.button, fontFamily: fontFamily.bodyBold },
  });
}
