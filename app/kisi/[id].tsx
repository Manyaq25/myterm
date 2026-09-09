import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { getPerson, listFollowUpsByPerson, updatePersonPhone } from '../../src/db/queries';
import type { FollowUp, Person } from '../../src/types';
import { followUpStatusLabel, followUpTypeLabel } from '../../src/i18n/labels';
import { formatDueDate, isOverdue } from '../../src/utils/date';
import { Avatar } from '../../src/components/Avatar';
import { ContactOptions } from '../../src/components/ContactOptions';
import { LateSuggestionCard } from '../../src/components/LateSuggestionCard';
import { Button } from '../../src/components/Button';
import { buildReminderMessage } from '../../src/services/contact';
import { buildPersonInsights, formatInsightText } from '../../src/services/personInsights';
import { useIsPremium } from '../../src/services/subscription';
import { CARD_MARGIN_BOTTOM, getCardSurface } from '../../src/constants/cardStyle';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../../src/theme';
import {
  acceptLateSuggestion,
  detectLatePersonSuggestions,
  dismissLateSuggestion,
  type LatePersonSuggestion,
} from '../../src/services/proactiveSuggestions';

function isOpenOverdue(item: FollowUp): boolean {
  return (item.status === 'open' || item.status === 'snoozed') && isOverdue(item.dueAt);
}

function FollowUpRow({ item, phone }: { item: FollowUp; phone?: string | null }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const router = useRouter();
  const { t } = useTranslation();
  const overdue = isOpenOverdue(item);
  const showContactShortcut = overdue && item.type === 'waiting_on' && !!phone;
  const accessibilityLabel = [
    followUpTypeLabel(item.type, t),
    item.title,
    item.status === 'done' || item.status === 'cancelled' ? followUpStatusLabel(item.status, t) : null,
    item.dueAt !== null
      ? overdue
        ? t('kisiProfili.rowOverdueLabel', { date: formatDueDate(item.dueAt) })
        : t('kisiProfili.rowDueLabel', { date: formatDueDate(item.dueAt) })
      : null,
  ]
    .filter(Boolean)
    .join('. ');
  return (
    <Pressable
      style={[styles.row, overdue && styles.rowOverdue]}
      onPress={() => router.push(`/takip/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t('kisiProfili.detailsHint')}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.rowType}>{followUpTypeLabel(item.type, t)}</Text>
        {(item.status === 'done' || item.status === 'cancelled') && (
          <Text style={styles.rowStatus}>{followUpStatusLabel(item.status, t)}</Text>
        )}
      </View>
      <Text style={styles.rowTitle}>{item.title}</Text>
      {item.dueAt !== null && (
        <Text style={[styles.rowMeta, overdue && styles.rowMetaOverdue]}>⏰ {formatDueDate(item.dueAt)}</Text>
      )}
      {showContactShortcut && (
        <View style={styles.contactShortcutRow}>
          <ContactOptions phone={phone!} message={buildReminderMessage(item.title)} compact />
        </View>
      )}
    </Pressable>
  );
}

function Section({ title, items, phone }: { title: string; items: FollowUp[]; phone?: string | null }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('kisiProfili.sectionCountTitle', { title, count: items.length })}</Text>
      {items.map((item) => (
        <FollowUpRow key={item.id} item={item} phone={phone} />
      ))}
    </View>
  );
}

export default function KisiProfiliScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const router = useRouter();
  const isPremium = useIsPremium();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [person, setPerson] = useState<Person | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [suggestion, setSuggestion] = useState<LatePersonSuggestion | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const [p, items, suggestions] = await Promise.all([
      getPerson(db, id),
      listFollowUpsByPerson(db, id),
      detectLatePersonSuggestions(db),
    ]);
    setPerson(p);
    setFollowUps(items);
    setSuggestion(suggestions.find((s) => s.person.id === id) ?? null);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!person) {
    return (
      <View style={styles.centered}>
        <Text style={styles.rowMeta}>{t('common.loading')}</Text>
      </View>
    );
  }

  async function savePhone() {
    if (!person) return;
    await updatePersonPhone(db, person.id, phoneInput.trim() || null);
    setEditingPhone(false);
    await load();
  }

  const overdue = followUps.filter(isOpenOverdue);
  const overdueIds = new Set(overdue.map((i) => i.id));
  const waitingOn = followUps.filter(
    (i) => (i.status === 'open' || i.status === 'snoozed') && i.type === 'waiting_on' && !overdueIds.has(i.id)
  );
  const given = followUps.filter(
    (i) => (i.status === 'open' || i.status === 'snoozed') && i.type !== 'waiting_on' && !overdueIds.has(i.id)
  );
  const history = followUps
    .filter((i) => i.status === 'done' || i.status === 'cancelled')
    .sort((a, b) => (b.completedAt ?? b.updatedAt) - (a.completedAt ?? a.updatedAt));
  const insights = buildPersonInsights(followUps);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar name={person.name} size={56} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{person.name}</Text>
          {person.note && <Text style={styles.note}>{person.note}</Text>}
        </View>
      </View>

      {editingPhone ? (
        <View style={styles.phoneEditRow}>
          <TextInput
            style={styles.phoneInput}
            placeholder={t('kisiProfili.phonePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={phoneInput}
            onChangeText={setPhoneInput}
            keyboardType="phone-pad"
            autoFocus
            accessibilityLabel={t('kisiProfili.phoneA11y')}
          />
          <Button label={t('common.save')} onPress={savePhone} />
          <Button label={t('common.cancelShort')} variant="ghostDanger" onPress={() => setEditingPhone(false)} />
        </View>
      ) : person.phone ? (
        <View style={styles.contactRow}>
          <ContactOptions phone={person.phone} />
          <Pressable
            style={styles.editPhoneIcon}
            onPress={() => {
              setPhoneInput(person.phone ?? '');
              setEditingPhone(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={t('kisiProfili.editPhoneA11y')}
          >
            <Text style={styles.editPhoneIconText}>✏️</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.addPhoneButton}
          onPress={() => {
            setPhoneInput('');
            setEditingPhone(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={t('kisiProfili.addPhoneA11y')}
        >
          <Text style={styles.addPhoneButtonText}>{t('kisiProfili.addPhoneButton')}</Text>
        </Pressable>
      )}

      {person.reminderLeadMinutes > 0 && <Text style={styles.leadBadge}>{t('kisiProfili.leadBadge')}</Text>}

      {insights.length > 0 && isPremium && (
        <View style={styles.insightsCard}>
          <Text style={styles.insightsLabel}>{t('kisiProfili.insightsLabel')}</Text>
          {insights.map((insight) => (
            <Text key={insight.type} style={styles.insightsText}>
              {formatInsightText(insight, t)}
            </Text>
          ))}
          <Text style={styles.insightsFootnote}>{t('kisiProfili.insightsFootnote')}</Text>
        </View>
      )}

      {insights.length > 0 && !isPremium && (
        <Pressable
          style={styles.insightsTeaser}
          onPress={() => router.push('/premium')}
          accessibilityRole="button"
          accessibilityLabel={t('kisiProfili.insightsTeaserCta')}
        >
          <Text style={styles.insightsLabel}>{t('kisiProfili.insightsLabel')}</Text>
          <Text style={styles.insightsTeaserText}>{t('kisiProfili.insightsTeaserText')}</Text>
          <Text style={styles.insightsTeaserCta}>{t('kisiProfili.insightsTeaserCta')}</Text>
        </Pressable>
      )}

      {suggestion && (
        <LateSuggestionCard
          suggestion={suggestion}
          onAccept={async () => {
            await acceptLateSuggestion(db, person.id);
            await load();
          }}
          onDismiss={async () => {
            await dismissLateSuggestion(db, person.id);
            await load();
          }}
        />
      )}

      <Section title={t('kisiProfili.sectionOverdue')} items={overdue} phone={person.phone} />
      <Section title={t('kisiProfili.sectionWaitingOn')} items={waitingOn} />
      <Section title={t('kisiProfili.sectionGiven')} items={given} />
      <Section title={t('kisiProfili.sectionHistory')} items={history} />

      {followUps.length === 0 && <Text style={styles.empty}>{t('kisiProfili.emptyFollowUps')}</Text>}
    </ScrollView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    screen: { backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 60 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    headerText: { flex: 1 },
    name: { fontSize: fontSize.displaySmall, fontFamily: fontFamily.displaySemiBold, color: colors.text },
    note: { fontSize: fontSize.base, color: colors.textMuted, marginTop: 4, fontFamily: fontFamily.body },
    leadBadge: { fontSize: fontSize.caption, color: colors.primary, fontFamily: fontFamily.bodySemiBold, marginTop: 14 },
    insightsCard: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      padding: 16,
      marginTop: 16,
    },
    insightsLabel: { fontSize: fontSize.caption, fontFamily: fontFamily.bodyBold, color: colors.primary, marginBottom: 8 },
    insightsText: { fontSize: fontSize.base, color: colors.text, lineHeight: 20, marginBottom: 4, fontFamily: fontFamily.body },
    insightsFootnote: { fontSize: fontSize.caption, color: colors.textMuted, marginTop: 8, lineHeight: 15, fontFamily: fontFamily.body },
    insightsTeaser: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    insightsTeaserText: { fontSize: fontSize.small, color: colors.textMuted, lineHeight: 19, fontFamily: fontFamily.body },
    insightsTeaserCta: { fontSize: fontSize.small, color: colors.primary, fontFamily: fontFamily.bodyBold, marginTop: 8 },
    empty: { fontSize: fontSize.base, color: colors.textMuted, marginTop: 24, textAlign: 'center', fontFamily: fontFamily.body },

    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' },
    editPhoneIcon: { padding: 8 },
    editPhoneIconText: { fontSize: fontSize.base },
    addPhoneButton: { marginTop: 16, alignSelf: 'flex-start' },
    addPhoneButtonText: { color: colors.primary, fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold },
    phoneEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
    phoneInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: fontSize.base,
      fontFamily: fontFamily.body,
      color: colors.text,
      backgroundColor: colors.surface,
    },

    section: { marginTop: 22 },
    sectionTitle: {
      fontSize: fontSize.small,
      fontFamily: fontFamily.bodyBold,
      color: colors.textMuted,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    row: {
      ...getCardSurface(colors),
      marginBottom: CARD_MARGIN_BOTTOM,
    },
    rowOverdue: { borderWidth: 1.5, borderColor: colors.danger },
    rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    rowType: { fontSize: fontSize.caption, fontFamily: fontFamily.bodyBold, color: colors.primary, textTransform: 'uppercase' },
    rowStatus: { fontSize: fontSize.caption, fontFamily: fontFamily.bodySemiBold, color: colors.textMuted },
    rowTitle: { fontSize: fontSize.subtitle, fontFamily: fontFamily.displaySemiBold, color: colors.text },
    rowMeta: { fontSize: fontSize.small, color: colors.textMuted, marginTop: 6, fontFamily: fontFamily.body },
    rowMetaOverdue: { color: colors.danger, fontFamily: fontFamily.bodyBold },
    contactShortcutRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  });
}
