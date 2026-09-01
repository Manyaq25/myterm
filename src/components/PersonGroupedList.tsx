import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FollowUpWithPerson } from '../types';
import { EmptyState } from './EmptyState';
import { Avatar } from './Avatar';
import type { PersonGroup } from '../utils/grouping';
import { daysLate, formatDueDate } from '../utils/date';
import { CARD_MARGIN_BOTTOM, getCardSurface } from '../constants/cardStyle';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

function FollowUpRow({ item }: { item: FollowUpWithPerson }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const router = useRouter();
  const late = daysLate(item.dueAt);
  return (
    <Pressable
      style={[styles.row, late !== null && styles.rowLateBorder]}
      onPress={() => router.push(`/takip/${item.id}`)}
    >
      <Text style={styles.rowTitle}>{item.title}</Text>
      {late !== null ? (
        <Text style={styles.rowLate}>⚠️ {late === 0 ? 'Bugün gecikti' : `${late} gündür gecikti`}</Text>
      ) : item.dueAt !== null ? (
        <Text style={styles.rowMeta}>⏰ {formatDueDate(item.dueAt)}</Text>
      ) : (
        <Text style={styles.rowMeta}>Tarih yok</Text>
      )}
    </Pressable>
  );
}

export function PersonGroupedList({
  groups,
  emptyTitle,
  emptySubtitle,
}: {
  groups: PersonGroup[];
  emptyTitle: string;
  emptySubtitle?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const router = useRouter();

  if (groups.length === 0) {
    return <EmptyState icon="🤝" title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <View>
      {groups.map((group) => (
        <View key={group.personId ?? '__none__'} style={styles.group}>
          {group.personId ? (
            <Pressable
              style={styles.personHeader}
              onPress={() => router.push(`/kisi/${group.personId}`)}
            >
              <Avatar name={group.personName} size={30} />
              <Text style={styles.personName}>
                {group.personName} {group.hasOverdue && '🔴'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.personHeader}>
              <Avatar name={group.personName} size={30} />
              <Text style={styles.personName}>{group.personName}</Text>
            </View>
          )}
          {group.items.map((item) => (
            <FollowUpRow key={item.id} item={item} />
          ))}
        </View>
      ))}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    group: { marginBottom: 22 },
    personHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    personName: { fontSize: fontSize.subtitle, fontFamily: fontFamily.bodyBold, color: colors.text },
    row: {
      ...getCardSurface(colors),
      marginBottom: CARD_MARGIN_BOTTOM,
    },
    rowLateBorder: { borderWidth: 1.5, borderColor: colors.danger },
    rowTitle: { fontSize: fontSize.base, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    rowMeta: { fontSize: fontSize.small, color: colors.textMuted, marginTop: 4, fontFamily: fontFamily.body },
    rowLate: { fontSize: fontSize.small, color: colors.danger, fontFamily: fontFamily.bodyBold, marginTop: 4 },
  });
}
