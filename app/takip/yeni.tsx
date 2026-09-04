import { useMemo, useState } from 'react';
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
import { applyReminderLead } from '../../src/utils/date';
import { scheduleMainReminder } from '../../src/services/reminderScheduler';
import { isImportantFollowUp, scheduleExtraReminders, type ExtraReminderChoice } from '../../src/services/smartReminders';
import { SmartReminderPrompt } from '../../src/components/SmartReminderPrompt';
import { updateWidgetSummary } from '../../src/services/widget';
import { Button } from '../../src/components/Button';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../../src/theme';

const TYPES = Object.keys(FOLLOW_UP_TYPE_LABELS) as FollowUpType[];

export default function YeniTakipScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [type, setType] = useState<FollowUpType>('task');
  const [personName, setPersonName] = useState('');
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingImportant, setPendingImportant] = useState<{ id: string; title: string; dueAt: number } | null>(
    null
  );

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

      if (remindAtMs) {
        await scheduleMainReminder(db, followUp.id, remindAtMs);
      }

      await updateWidgetSummary(db);

      if (dueAtMs) {
        const important = await isImportantFollowUp(db, { type, dueAt: dueAtMs, personId });
        if (important) {
          setPendingImportant({ id: followUp.id, title: title.trim(), dueAt: dueAtMs });
          return;
        }
      }

      router.back();
    } finally {
      setSaving(false);
    }
  }

  async function handleReminderChoice(choice: ExtraReminderChoice) {
    if (pendingImportant) {
      await scheduleExtraReminders(db, pendingImportant.id, pendingImportant.title, pendingImportant.dueAt, choice);
    }
    setPendingImportant(null);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label} nativeID="label-title">
          Ne takip ediyorsun?
        </Text>
        <TextInput
          style={styles.input}
          placeholder="ör. Ahmet'e teklifi gönder"
          value={title}
          onChangeText={setTitle}
          autoFocus
          accessibilityLabel="Ne takip ediyorsun?"
        />

        <Text style={styles.label} nativeID="label-type">
          Tür
        </Text>
        <View style={styles.typeRow} accessibilityRole="radiogroup" accessibilityLabelledBy="label-type">
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: type === t }}
              accessibilityLabel={FOLLOW_UP_TYPE_LABELS[t]}
            >
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                {FOLLOW_UP_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Kiminle ilgili? (opsiyonel)</Text>
        <TextInput
          style={styles.input}
          placeholder="ör. Ahmet"
          value={personName}
          onChangeText={setPersonName}
          accessibilityLabel="Kiminle ilgili? (opsiyonel)"
        />

        <Text style={styles.label}>Not (opsiyonel)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Ek detay..."
          value={detail}
          onChangeText={setDetail}
          multiline
          accessibilityLabel="Not (opsiyonel)"
        />

        <Text style={styles.label}>Hatırlatma zamanı (opsiyonel)</Text>
        <Pressable
          style={styles.input}
          onPress={() => setShowPicker(true)}
          accessibilityRole="button"
          accessibilityLabel={
            dueAt ? `Hatırlatma zamanı: ${dueAt.toLocaleString('tr-TR')}` : 'Hatırlatma zamanı seç'
          }
        >
          <Text style={{ color: dueAt ? colors.text : colors.textMuted }}>
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

        <View style={styles.saveButtonWrap}>
          <Button
            label="Kaydet"
            onPress={handleSave}
            disabled={!title.trim()}
            loading={saving}
            accessibilityLabel="Kaydet"
          />
        </View>
      </ScrollView>
      <SmartReminderPrompt
        visible={!!pendingImportant}
        title={pendingImportant?.title ?? ''}
        onChoose={handleReminderChoice}
      />
    </KeyboardAvoidingView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { padding: 20, paddingBottom: 60 },
    label: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.textMuted, marginTop: 16, marginBottom: 6 },
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
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceAlt },
    typeChipActive: { backgroundColor: colors.primary },
    typeChipText: { fontSize: fontSize.small, color: colors.text, fontFamily: fontFamily.bodySemiBold },
    typeChipTextActive: { color: colors.onPrimary },
    saveButtonWrap: { marginTop: 28 },
  });
}
