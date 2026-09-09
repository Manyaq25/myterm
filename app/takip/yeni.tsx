import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';
import { createFollowUp, createPerson, listPeople } from '../../src/db/queries';
import { FOLLOW_UP_TYPES, type FollowUpType } from '../../src/types';
import { followUpTypeLabel } from '../../src/i18n/labels';
import { applyReminderLead } from '../../src/utils/date';
import { scheduleMainReminder } from '../../src/services/reminderScheduler';
import { isImportantFollowUp, scheduleExtraReminders, type ExtraReminderChoice } from '../../src/services/smartReminders';
import { SmartReminderPrompt } from '../../src/components/SmartReminderPrompt';
import { updateWidgetSummary } from '../../src/services/widget';
import { useIsPremium } from '../../src/services/subscription';
import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../../src/theme';

export default function YeniTakipScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const isPremium = useIsPremium();

  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [type, setType] = useState<FollowUpType>('task');
  const [personName, setPersonName] = useState('');
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [androidPickerStage, setAndroidPickerStage] = useState<'date' | 'time' | null>(null);
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

      if (dueAtMs && isPremium) {
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
        <TextField
          label={t('yeni.labelTitle')}
          placeholder={t('yeni.titlePlaceholder')}
          value={title}
          onChangeText={setTitle}
          autoFocus
          accessibilityLabel={t('yeni.labelTitle')}
        />

        <Text style={styles.label} nativeID="label-type">
          {t('yeni.labelType')}
        </Text>
        <View style={styles.typeRow} accessibilityRole="radiogroup" accessibilityLabelledBy="label-type">
          {FOLLOW_UP_TYPES.map((typeOption) => (
            <Pressable
              key={typeOption}
              onPress={() => setType(typeOption)}
              style={[styles.typeChip, type === typeOption && styles.typeChipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: type === typeOption }}
              accessibilityLabel={followUpTypeLabel(typeOption, t)}
            >
              <Text style={[styles.typeChipText, type === typeOption && styles.typeChipTextActive]}>
                {followUpTypeLabel(typeOption, t)}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextField
          containerStyle={styles.fieldSpacing}
          label={t('yeni.labelPerson')}
          placeholder={t('yeni.personPlaceholder')}
          value={personName}
          onChangeText={setPersonName}
          accessibilityLabel={t('yeni.labelPerson')}
        />

        <TextField
          containerStyle={styles.fieldSpacing}
          label={t('yeni.labelNote')}
          placeholder={t('yeni.notePlaceholder')}
          value={detail}
          onChangeText={setDetail}
          multiline
          accessibilityLabel={t('yeni.labelNote')}
        />

        <Text style={styles.label}>{t('yeni.labelDueAt')}</Text>
        <Pressable
          style={styles.dateInputBox}
          onPress={() => (Platform.OS === 'android' ? setAndroidPickerStage('date') : setShowPicker(true))}
          accessibilityRole="button"
          accessibilityLabel={
            dueAt
              ? t('yeni.dueAtSetA11y', { date: dueAt.toLocaleString(i18n.language) })
              : t('yeni.dueAtUnsetA11y')
          }
        >
          <Text style={{ color: dueAt ? colors.text : colors.textMuted }}>
            {dueAt ? dueAt.toLocaleString(i18n.language) : t('yeni.dueAtPlaceholder')}
          </Text>
        </Pressable>
        {Platform.OS === 'ios' && showPicker && (
          <DateTimePicker
            value={dueAt ?? new Date()}
            mode="datetime"
            onChange={(_, selected) => {
              setShowPicker(false);
              if (selected) setDueAt(selected);
            }}
          />
        )}
        {Platform.OS === 'android' && androidPickerStage === 'date' && (
          <DateTimePicker
            value={dueAt ?? new Date()}
            mode="date"
            onChange={(event, selected) => {
              setAndroidPickerStage(null);
              if (event.type !== 'set' || !selected) return;
              const base = dueAt ?? new Date();
              const combined = new Date(selected);
              combined.setHours(base.getHours(), base.getMinutes(), 0, 0);
              setDueAt(combined);
              setAndroidPickerStage('time');
            }}
          />
        )}
        {Platform.OS === 'android' && androidPickerStage === 'time' && (
          <DateTimePicker
            value={dueAt ?? new Date()}
            mode="time"
            onChange={(event, selected) => {
              setAndroidPickerStage(null);
              if (event.type !== 'set' || !selected) return;
              setDueAt((prev) => {
                const combined = new Date(prev ?? new Date());
                combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                return combined;
              });
            }}
          />
        )}

        <View style={styles.saveButtonWrap}>
          <Button
            label={t('common.save')}
            onPress={handleSave}
            disabled={!title.trim()}
            loading={saving}
            accessibilityLabel={t('common.save')}
          />
        </View>
      </ScrollView>
      <SmartReminderPrompt
        visible={!!pendingImportant}
        title={pendingImportant?.title ?? ''}
        onChoose={handleReminderChoice}
      />
    </Container>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { padding: 20, paddingBottom: 60 },
    label: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.textMuted, marginTop: 16, marginBottom: 6 },
    fieldSpacing: { marginTop: 16 },
    dateInputBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceAlt },
    typeChipActive: { backgroundColor: colors.primary },
    typeChipText: { fontSize: fontSize.small, color: colors.text, fontFamily: fontFamily.bodySemiBold },
    typeChipTextActive: { color: colors.onPrimary },
    saveButtonWrap: { marginTop: 28 },
  });
}
