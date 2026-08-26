import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { aiProvider, isUsingMockAI } from '../src/ai';
import { buildAssistantContext } from '../src/services/assistantContext';

interface Exchange {
  question: string;
  answer: string;
}

const SUGGESTIONS = ['Bugün ne yapacağım?', 'Kimlerden bir şey bekliyorum?', 'Bu hafta kaç aktif takibim var?'];

export default function AsistanScreen() {
  const db = useSQLiteContext();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Exchange[]>([]);

  async function handleAsk(q?: string) {
    const finalQuestion = (q ?? question).trim();
    if (!finalQuestion || loading) return;
    setLoading(true);
    setError(null);
    try {
      const context = await buildAssistantContext(db);
      const answer = await aiProvider.askAssistant(finalQuestion, context);
      setHistory((prev) => [...prev, { question: finalQuestion, answer }]);
      setQuestion('');
    } catch (e) {
      setError('Cevap alınamadı. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {isUsingMockAI && (
        <View style={styles.mockBanner}>
          <Text style={styles.mockBannerText}>
            Test modu: gerçek AI backend'i henüz bağlı değil, cevaplar sahte (mock) olacak.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {history.length === 0 && !loading && (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Sorabileceklerin:</Text>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} style={styles.suggestionChip} onPress={() => handleAsk(s)}>
                <Text style={styles.suggestionChipText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {history.map((exchange, i) => (
          <View key={i} style={styles.exchange}>
            <View style={styles.questionBubble}>
              <Text style={styles.questionText}>{exchange.question}</Text>
            </View>
            <View style={styles.answerBubble}>
              <Text style={styles.answerText}>{exchange.answer}</Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Takip listen taranıyor…</Text>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Bir şey sor…"
          value={question}
          onChangeText={setQuestion}
          editable={!loading}
          onSubmitEditing={() => handleAsk()}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendButton, (!question.trim() || loading) && styles.sendButtonDisabled]}
          onPress={() => handleAsk()}
          disabled={!question.trim() || loading}
        >
          <Text style={styles.sendButtonText}>Sor</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mockBanner: { backgroundColor: '#fef3c7', padding: 12 },
  mockBannerText: { color: '#92400e', fontSize: 13 },
  content: { padding: 20, paddingBottom: 20, flexGrow: 1 },
  suggestions: { marginTop: 8 },
  suggestionsTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10 },
  suggestionChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  suggestionChipText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
  exchange: { marginBottom: 18 },
  questionBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    maxWidth: '85%',
  },
  questionText: { color: '#fff', fontSize: 15 },
  answerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '90%',
  },
  answerText: { color: '#111827', fontSize: 15, lineHeight: 21 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  loadingText: { color: '#6b7280', fontSize: 13 },
  error: { color: '#dc2626', marginTop: 12, fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
