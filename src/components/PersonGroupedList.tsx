import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FollowUpWithPerson } from '../types';
import { EmptyState } from './EmptyState';
import { Avatar } from './Avatar';
import type { PersonGroup } from '../utils/grouping';
import { daysLate, formatDueDate } from '../utils/date';

function FollowUpRow({ item }: { item: FollowUpWithPerson }) {
  const late = daysLate(item.dueAt);
  return (
    <Link href={`/takip/${item.id}`} asChild>
      <Pressable style={[styles.row, late !== null && styles.rowLateBorder]}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        {late !== null ? (
          <Text style={styles.rowLate}>⚠️ {late === 0 ? 'Bugün gecikti' : `${late} gündür gecikti`}</Text>
        ) : item.dueAt !== null ? (
          <Text style={styles.rowMeta}>⏰ {formatDueDate(item.dueAt)}</Text>
        ) : (
          <Text style={styles.rowMeta}>Tarih yok</Text>
        )}
      </Pressable>
    </Link>
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
  if (groups.length === 0) {
    return <EmptyState icon="🤝" title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <View>
      {groups.map((group) => (
        <View key={group.personId ?? '__none__'} style={styles.group}>
          {group.personId ? (
            <Link href={`/kisi/${group.personId}`} asChild>
              <Pressable style={styles.personHeader}>
                <Avatar name={group.personName} size={30} />
                <Text style={styles.personName}>
                  {group.personName} {group.hasOverdue && '🔴'}
                </Text>
              </Pressable>
            </Link>
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

const styles = StyleSheet.create({
  group: { marginBottom: 22 },
  personHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  personName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eef1f6',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rowLateBorder: { borderWidth: 1.5, borderColor: '#fca5a5' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowMeta: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  rowLate: { fontSize: 13, color: '#dc2626', fontWeight: '700', marginTop: 4 },
});
