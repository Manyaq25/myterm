import { useState } from 'react';
import {
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { createFollowUp, createPerson, listPeople } from '../../src/db/queries';
import { FOLLOW_UP_TYPE_LABELS, type FollowUpType } from '../../src/types';
import { scheduleFollowUpReminder } from '../../src/services/notifications';
import { applyReminderLead } from '../../src/utils/date';

const TYPES = Object.keys(FOLLOW_UP_TYPE_LABELS) as FollowUpType[];

export default function YeniTakipScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [type, setType] = useState<FollowUpType>('task');
  const [personName, setPersonName] = useState('');
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      let personId: string | null = null;
      let reminderLeadMinutes = 0;
      const trimmedPerson = personName.trim();
      if (trimmedPerson) {
        const people = await listPeople(db);
        const existing = people.find((p) => p.name.toLowerCase() === trimmedPerson.toLowerCase());
        if (existing) {
          personId = existing.id;
          reminderLeadMinutes = existing.reminderLeadMinutes;
        } else {
          personId = (await createPerson(db, trimmedPerson)).id;
        }
      }

      const dueAtMs = dueAt ? dueAt.getTime() : null;
      const remindAtMs = dueAtMs ? applyReminderLead(dueAtMs, reminderLeadMinutes) : null;

      const followUp = await createFollowUp(db, {
        title: title.trim(),
        detail: detail.trim() || null,
        type,
        personId,
        dueAt: dueAtMs,
        remindAt: remindAtMs,
        source: 'manual',
      });

      if (remindAtMs && remindAtMs > Date.now()) {
        await scheduleFollowUpReminder(followUp.id, title.trim(), 'Zamanı geldi', new Date(remindAtMs));
      }

      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Ne takip ediyorsun?</Text>
        <TextInput
          style={styles.input}
          placeholder="ör. Ahmet'e teklifi gönder"
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        <Text style={styles.label}>Tür</Text>
        <View style={styles.typeRow}>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
            >
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                {FOLLOW_UP_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Kiminle ilgili? (opsiyonel)</Text>
        <TextInput style={styles.input} placeholder="ör. Ahmet" value={personName} onChangeText={setPersonName} />

        <Text style={styles.label}>Not (opsiyonel)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Ek detay..."
          value={detail}
          onChangeText={setDetail}
          multiline
        />

        <Text style={styles.label}>Hatırlatma zamanı (opsiyonel)</Text>
        <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
          <Text style={{ color: dueAt ? '#111827' : '#9ca3af' }}>
            {dueAt ? dueAt.toLocaleString('tr-TR') : 'Tarih ve saat seç'}
          </Text>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={dueAt ?? new Date()}
            mode="datetime"
            onChange={(_, selected) => {
              setShowPicker(Platform.OS === 'ios');
              if (selected) setDueAt(selected);
            }}
          />
        )}

        <Pressable
          style={[styles.saveButton, (!title.trim() || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!title.trim() || saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#e5e7eb' },
  typeChipActive: { backgroundColor: '#2563eb' },
  typeChipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  typeChipTextActive: { color: '#fff' },
  saveButton: {
    marginTop: 28,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#93c5fd' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
