import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import type { FollowUpWithPerson } from '../types';
import { FOLLOW_UP_TYPE_LABELS } from '../types';
import { formatDueDate, isOverdue } from '../utils/date';

const TYPE_COLORS: Record<string, string> = {
  promise_made: '#7c3aed',
  promise_expected: '#ea580c',
  task: '#2563eb',
  waiting_on: '#0d9488',
};

export function FollowUpCard({ item }: { item: FollowUpWithPerson }) {
  const overdue = isOverdue(item.dueAt) && item.status === 'open';
  return (
    <Link href={`/takip/${item.id}`} asChild>
      <Pressable style={[styles.card, overdue && styles.cardOverdue]}>
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: TYPE_COLORS[item.type] ?? '#666' }]}>
            <Text style={styles.badgeText}>{FOLLOW_UP_TYPE_LABELS[item.type]}</Text>
          </View>
          {item.dueAt !== null && (
            <Text style={[styles.due, overdue && styles.dueOverdue]}>{formatDueDate(item.dueAt)}</Text>
          )}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        {item.personName && <Text style={styles.person}>{item.personName}</Text>}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardOverdue: {
    borderColor: '#dc2626',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  due: {
    fontSize: 12,
    color: '#6b7280',
  },
  dueOverdue: {
    color: '#dc2626',
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  person: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
});
