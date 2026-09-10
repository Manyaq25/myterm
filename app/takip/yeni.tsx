import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import { GradientBackground } from '../../src/components/GradientBackground';
import { useTheme, hexToRgba, fontFamily, fontSize, letterSpacing, type ThemeColors } from '../../src/theme';

export default function YeniTakipScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const { t, i18n } = useTranslation();
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
  const containerProps = Platform.OS === 'ios' ? { behavior: 'padding' as const, keyboardVerticalOffset: insets.top } : {};

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
          <Text style={styles.headerTitle}>{t('stackTitles.yeniTakip')}</Text>
          <View style={styles.pulseDot} />
        </View>
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
          {FOLLOW_UP_TYPES.map((typeOption) => {
            const active = type === typeOption;
            return (
              <Pressable
                key={typeOption}
                onPress={() => setType(typeOption)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={followUpTypeLabel(typeOption, t)}
              >
                {active ? (
                  <LinearGradient colors={[colors.primary, colors.primaryText]} style={styles.typeChip}>
                    <View style={styles.typeChipDotActive} />
                    <Text style={[styles.typeChipText, styles.typeChipTextActive]}>
                      {followUpTypeLabel(typeOption, t)}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.typeChip, styles.typeChipInactive]}>
                    <View style={styles.typeChipDot} />
                    <Text style={styles.typeChipText}>{followUpTypeLabel(typeOption, t)}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
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
            icon={<Check color={colors.onPrimary} size={18} strokeWidth={2.5} />}
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
      gap: 12,
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
    headerTitle: {
      flex: 1,
      fontSize: fontSize.title,
      fontFamily: fontFamily.bodyBold,
      color: colors.text,
      letterSpacing: letterSpacing.title,
    },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
    content: { padding: 20, paddingBottom: 60 },
    label: {
      fontSize: fontSize.caption,
      fontFamily: fontFamily.label,
      color: hexToRgba(colors.text, 0.7),
      marginTop: 16,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: letterSpacing.label,
    },
    fieldSpacing: { marginTop: 16 },
    dateInputBox: {
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: hexToRgba(colors.surface, 0.6),
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 16,
    },
    typeChipInactive: { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder },
    typeChipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: hexToRgba(colors.primary, 0.4) },
    typeChipDotActive: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.onPrimary },
    typeChipText: { fontSize: fontSize.small, color: colors.text, fontFamily: fontFamily.label },
    typeChipTextActive: { color: colors.onPrimary },
    saveButtonWrap: { marginTop: 28 },
  });
}
