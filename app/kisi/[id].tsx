import { useCallback, useState } from 'react';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { getPerson, listFollowUpsByPerson } from '../../src/db/queries';
import { FOLLOW_UP_TYPE_LABELS, FOLLOW_UP_STATUS_LABELS, type FollowUp, type Person } from '../../src/types';
import { formatDueDate, isOverdue } from '../../src/utils/date';
import { LateSuggestionCard } from '../../src/components/LateSuggestionCard';
import {
  acceptLateSuggestion,
  detectLatePersonSuggestions,
  dismissLateSuggestion,
  type LatePersonSuggestion,
} from '../../src/services/proactiveSuggestions';

function isOpenOverdue(item: FollowUp): boolean {
  return (item.status === 'open' || item.status === 'snoozed') && isOverdue(item.dueAt);
}

function FollowUpRow({ item }: { item: FollowUp }) {
  const overdue = isOpenOverdue(item);
  return (
    <Link href={`/takip/${item.id}`} asChild>
      <Pressable style={[styles.row, overdue && styles.rowOverdue]}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowType}>{FOLLOW_UP_TYPE_LABELS[item.type]}</Text>
          {(item.status === 'done' || item.status === 'cancelled') && (
            <Text style={styles.rowStatus}>{FOLLOW_UP_STATUS_LABELS[item.status]}</Text>
          )}
        </View>
        <Text style={styles.rowTitle}>{item.title}</Text>
        {item.dueAt !== null && (
          <Text style={[styles.rowMeta, overdue && styles.rowMetaOverdue]}>⏰ {formatDueDate(item.dueAt)}</Text>
        )}
      </Pressable>
    </Link>
  );
}

function Section({ title, items }: { title: string; items: FollowUp[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title} ({items.length})
      </Text>
      {items.map((item) => (
        <FollowUpRow key={item.id} item={item} />
      ))}
    </View>
  );
}

export default function KisiProfiliScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [person, setPerson] = useState<Person | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [suggestion, setSuggestion] = useState<LatePersonSuggestion | null>(null);

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
        <Text>Yükleniyor…</Text>
      </View>
    );
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

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.name}>{person.name}</Text>
      {person.note && <Text style={styles.note}>{person.note}</Text>}
      {person.reminderLeadMinutes > 0 && (
        <Text style={styles.leadBadge}>⏱️ Hatırlatmalar bu kişi için daha erken gönderiliyor</Text>
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

      <Section title="Gecikenler" items={overdue} />
      <Section title="Ondan beklediklerim" items={waitingOn} />
      <Section title="Ona verdiklerim" items={given} />
      <Section title="Geçmiş" items={history} />

      {followUps.length === 0 && <Text style={styles.empty}>Bu kişiyle ilgili henüz bir takip yok.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 60 },
  name: { fontSize: 24, fontWeight: '700', color: '#111827' },
  note: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  leadBadge: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginTop: 8 },
  empty: { fontSize: 14, color: '#9ca3af', marginTop: 24, textAlign: 'center' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase' },
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rowOverdue: { borderColor: '#dc2626' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  rowType: { fontSize: 11, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' },
  rowStatus: { fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowMeta: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  rowMetaOverdue: { color: '#dc2626', fontWeight: '600' },
});
