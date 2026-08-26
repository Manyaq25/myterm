import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExtraReminderChoice } from '../services/smartReminders';

interface Props {
  visible: boolean;
  title: string;
  onChoose: (choice: ExtraReminderChoice) => void;
}

export function SmartReminderPrompt({ visible, title, onChoose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Bu iş önemli görünüyor</Text>
          <Text style={styles.subtitle}>
            "{title}" için 1 gün önce ve/veya aynı gün sabah da hatırlatayım mı?
          </Text>
          <Pressable style={styles.option} onPress={() => onChoose('day_before')}>
            <Text style={styles.optionText}>1 gün önce</Text>
          </Pressable>
          <Pressable style={styles.option} onPress={() => onChoose('morning')}>
            <Text style={styles.optionText}>Aynı gün sabah</Text>
          </Pressable>
          <Pressable style={styles.option} onPress={() => onChoose('both')}>
            <Text style={styles.optionText}>İkisi de</Text>
          </Pressable>
          <Pressable style={styles.decline} onPress={() => onChoose('none')}>
            <Text style={styles.declineText}>Hayır, gerek yok</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 18, lineHeight: 20 },
  option: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: { color: '#2563eb', fontSize: 15, fontWeight: '600' },
  decline: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  declineText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
});
