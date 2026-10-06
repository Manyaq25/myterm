import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDataLoader } from '../../src/services/dataEvents';
import { recordCompletionForReview } from '../../src/services/reviewPrompt';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { getFollowUp } from '../../src/db/queries';
import type { FollowUpWithPerson } from '../../src/types';
import { formatDueDate, isOverdue } from '../../src/utils/date';
import { completeFollowUp, removeFollowUp, rescheduleFollowUp } from '../../src/services/followUpActions';
import { DateTimeSheet } from '../../src/components/DateTimeSheet';
import { ScreenHeader, useSafeBack } from '../../src/components/ScreenHeader';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { TypeBadge } from '../../src/components/TypeBadge';
import { getCardSurface } from '../../src/constants/cardStyle';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../../src/theme';

export default function TakipDetayScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const [item, setItem] = useState<FollowUpWithPerson | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const row = await getFollowUp(db, id);
    setItem(row);
  }, [db, id]);

  useDataLoader(load);

  // Kartın "…" menüsündeki "Zamanı değiştir" bu ekranı seçici açık gelir.
  const canReschedule = item !== null && (item.status === 'open' || item.status === 'snoozed');
  useEffect(() => {
    if (edit === '1' && canReschedule) setPickerOpen(true);
  }, [edit, canReschedule]);

  const goBack = useSafeBack();
  const header = <ScreenHeader title={t('stackTitles.takipDetay')} />;

  if (!item) {
    return (
      <View style={styles.safeArea}>
        {header}
        <View style={styles.container}>
          <Text style={styles.detail}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  const overdue = isOverdue(item.dueAt) && item.status === 'open';

  async function markDone() {
    if (!item) return;
    await completeFollowUp(db, item);
    void recordCompletionForReview();
    goBack();
  }

  async function applyNewTime(date: Date) {
    setPickerOpen(false);
    if (!item) return;
    await rescheduleFollowUp(db, item, date.getTime());
    await load();
    AccessibilityInfo.announceForAccessibility(t('takipDetay.rescheduledA11y', { date: formatDueDate(date.getTime()) }));
  }

  function snoozeOneHour() {
    if (!item || item.dueAt === null) return;
    // Gecikmiş bir takipte bir saat ileri almak yine geçmişte kalırdı; o
    // durumda şimdiden itibaren bir saat sonrası.
    void applyNewTime(new Date(Math.max(item.dueAt, Date.now()) + 60 * 60 * 1000));
  }

  function snoozeToTomorrow() {
    if (!item || item.dueAt === null) return;
    const next = new Date(item.dueAt);
    if (item.dueAt < Date.now()) {
      const today = new Date();
      next.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
    }
    next.setDate(next.getDate() + 1);
    void applyNewTime(next);
  }

  function pickerStartValue(): Date {
    if (item?.dueAt != null && item.dueAt > Date.now()) return new Date(item.dueAt);
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  }

  async function handleDelete() {
    if (!item) return;
    Alert.alert(t('takipDetay.deleteAlertTitle'), t('takipDetay.deleteAlertMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await removeFollowUp(db, item);
          goBack();
        },
      },
    ]);
  }

  return (
    <View style={styles.safeArea}>
    {header}
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <TypeBadge type={item.type} style={styles.badge} />
        <Text style={styles.title}>{item.title}</Text>

        {item.personName && item.personId && (
          <Pressable
            style={styles.personRow}
            onPress={() => router.push(`/kisi/${item.personId}`)}
            accessibilityRole="button"
            accessibilityLabel={t('takipDetay.personProfileA11y', { name: item.personName })}
          >
            <Avatar name={item.personName} size={26} />
            <Text style={styles.personText}>{item.personName}</Text>
          </Pressable>
        )}

        {item.dueAt !== null ? (
          <Text style={[styles.meta, overdue && styles.metaOverdue]}>⏰ {formatDueDate(item.dueAt)}</Text>
        ) : (
          canReschedule && <Text style={styles.meta}>⏰ {t('takipDetay.noTime')}</Text>
        )}
        {canReschedule && (
          <View style={styles.timeActions}>
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={[styles.chip, styles.chipPrimary]}
              accessibilityRole="button"
              accessibilityLabel={item.dueAt !== null ? t('takipDetay.changeTime') : t('takipDetay.addTime')}
              hitSlop={4}
            >
              <Text style={[styles.chipText, styles.chipTextPrimary]}>
                {item.dueAt !== null ? t('takipDetay.changeTime') : t('takipDetay.addTime')}
              </Text>
            </Pressable>
            {item.dueAt !== null && (
              <>
                <Pressable onPress={snoozeOneHour} style={styles.chip} accessibilityRole="button" hitSlop={4}>
                  <Text style={styles.chipText}>{t('takipDetay.snoozeHour')}</Text>
                </Pressable>
                <Pressable onPress={snoozeToTomorrow} style={styles.chip} accessibilityRole="button" hitSlop={4}>
                  <Text style={styles.chipText}>{t('takipDetay.snoozeTomorrow')}</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
        {item.detail && <Text style={styles.detail}>{item.detail}</Text>}
      </View>

      {item.status === 'open' && (
        <View style={styles.doneButtonWrap}>
          <Button label={t('takipDetay.markDone')} variant="success" onPress={markDone} />
        </View>
      )}

      <Button label={t('common.delete')} variant="ghostDanger" onPress={handleDelete} />
    </ScrollView>
    <DateTimeSheet
      visible={pickerOpen}
      initialValue={pickerStartValue()}
      title={t('takipDetay.pickerTitle')}
      onConfirm={applyNewTime}
      onCancel={() => setPickerOpen(false)}
    />
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
    card: {
      ...getCardSurface(colors),
      padding: 20,
    },
    badge: { marginBottom: 10 },
    title: { fontSize: fontSize.title, fontFamily: fontFamily.displaySemiBold, color: colors.text, lineHeight: 28 },
    personRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
    personText: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    meta: { fontSize: fontSize.base, color: colors.textMuted, marginTop: 10, fontFamily: fontFamily.body },
    metaOverdue: { color: colors.danger, fontFamily: fontFamily.bodyBold },
    timeActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glassBg,
    },
    chipPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: fontSize.caption, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    chipTextPrimary: { color: colors.onPrimary, fontFamily: fontFamily.bodyBold },
    detail: { fontSize: fontSize.base, color: colors.text, marginTop: 14, lineHeight: 22, fontFamily: fontFamily.body },
    doneButtonWrap: { marginTop: 20 },
  });
}
