import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { createFollowUp, createPerson, listPeople } from '../../src/db/queries';
import { FOLLOW_UP_TYPE_LABELS } from '../../src/types';
import { aiProvider, isUsingMockAI, type ExtractedFollowUp } from '../../src/ai';
import { scheduleFollowUpReminder } from '../../src/services/notifications';

interface Candidate extends ExtractedFollowUp {
  selected: boolean;
}

export default function AiCikarScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const results = await aiProvider.extractFollowUpsFromText(text.trim());
      setCandidates(results.map((r) => ({ ...r, selected: true })));
    } catch (e) {
      setError('Çıkarım başarısız oldu. Lütfen tekrar dene.');
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
      for (const candidate of selected) {
        let personId: string | null = null;
        const name = candidate.personName?.trim();
        if (name) {
          const existing = people.find((p) => p.name.toLowerCase() === name.toLowerCase());
          personId = existing ? existing.id : (await createPerson(db, name)).id;
        }

        const dueAt = candidate.dueAtISO ? new Date(candidate.dueAtISO).getTime() : null;
        const followUp = await createFollowUp(db, {
          title: candidate.title,
          type: candidate.type,
          personId,
          dueAt,
          remindAt: dueAt,
          source: 'text',
          confidence: candidate.confidence,
        });

        if (dueAt && dueAt > Date.now()) {
          await scheduleFollowUpReminder(followUp.id, candidate.title, 'Zamanı geldi', new Date(dueAt));
        }
      }
      router.back();
    } catch (e) {
      Alert.alert('Hata', 'Kaydetme sırasında bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        {isUsingMockAI && (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>
              Test modu: gerçek AI backend'i henüz bağlı değil, sonuçlar sahte (mock) olacak.
            </Text>
          </View>
        )}

        <Text style={styles.label}>Notunu yapıştır veya yaz</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="ör. Ahmete yarın teklifi göndereceğim, ondan da geçen haftaki raporu bekliyorum."
          value={text}
          onChangeText={setText}
          multiline
          editable={!loading}
        />

        <Pressable
          style={[styles.extractButton, (!text.trim() || loading) && styles.buttonDisabled]}
          onPress={handleExtract}
          disabled={!text.trim() || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.extractButtonText}>Çıkar</Text>}
        </Pressable>

        {error && <Text style={styles.error}>{error}</Text>}

        {candidates && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>
              {candidates.length === 0 ? 'Herhangi bir takip maddesi bulunamadı.' : 'Bulunanlar — kaydetmeden önce gözden geçir'}
            </Text>
            {candidates.map((c, i) => (
              <Pressable key={i} style={styles.candidateCard} onPress={() => toggleCandidate(i)}>
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
                </View>
              </Pressable>
            ))}

            {candidates.length > 0 && (
              <Pressable
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Kaydediliyor…' : `Seçilenleri kaydet (${candidates.filter((c) => c.selected).length})`}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60 },
  mockBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  mockBannerText: { color: '#92400e', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  extractButton: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  extractButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  error: { color: '#dc2626', marginTop: 12, fontSize: 14 },
  results: { marginTop: 24 },
  resultsTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkboxMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  candidateType: { fontSize: 12, fontWeight: '700', color: '#2563eb', marginBottom: 2 },
  candidateTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  candidateMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
