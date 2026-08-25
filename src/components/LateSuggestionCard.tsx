import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LatePersonSuggestion } from '../services/proactiveSuggestions';

interface Props {
  suggestion: LatePersonSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

export function LateSuggestionCard({ suggestion, onAccept, onDismiss }: Props) {
  const { person, lateCount } = suggestion;
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>💡</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>
          <Text style={styles.bold}>{person.name}</Text>'ten beklediğin işler son {lateCount} seferdir gecikmiş.
          Daha erken hatırlatmamı ister misin?
        </Text>
        <View style={styles.actions}>
          <Pressable style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptButtonText}>Evet, daha erken hatırlat</Text>
          </Pressable>
          <Pressable style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Hayır, teşekkürler</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 14,
    marginBottom: 14,
  },
  icon: { fontSize: 20 },
  text: { fontSize: 14, color: '#1e3a8a', lineHeight: 20 },
  bold: { fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  acceptButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  acceptButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dismissButtonText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
});
