import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FollowUpWithPerson } from '../types';
import { EmptyState } from './EmptyState';
import type { PersonGroup } from '../utils/grouping';
import { daysLate, formatDueDate } from '../utils/date';

function FollowUpRow({ item }: { item: FollowUpWithPerson }) {
  const late = daysLate(item.dueAt);
  return (
    <Link href={`/takip/${item.id}`} asChild>
      <Pressable style={styles.row}>
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
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <View>
      {groups.map((group) => (
        <View key={group.personId ?? '__none__'} style={styles.group}>
          {group.personId ? (
            <Link href={`/kisi/${group.personId}`} asChild>
              <Pressable>
                <Text style={styles.personName}>
                  👤 {group.personName} {group.hasOverdue && '🔴'}
                </Text>
              </Pressable>
            </Link>
          ) : (
            <Text style={styles.personName}>{group.personName}</Text>
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
  group: { marginBottom: 20 },
  personName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowMeta: { fontSize: 13, color: '#6b7280', marginTop: 3 },
  rowLate: { fontSize: 13, color: '#dc2626', fontWeight: '600', marginTop: 3 },
});
