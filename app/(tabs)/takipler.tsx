import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listFollowUps } from '../../src/db/queries';
import type { FollowUpStatus, FollowUpWithPerson } from '../../src/types';
import { FollowUpCard } from '../../src/components/FollowUpCard';
import { EmptyState } from '../../src/components/EmptyState';
import { matchesQuery } from '../../src/utils/search';
import { completeFollowUp, removeFollowUp } from '../../src/services/followUpActions';

const FILTERS: { key: FollowUpStatus[]; label: string }[] = [
  { key: ['open', 'snoozed'], label: 'Açık' },
  { key: ['done'], label: 'Tamamlanan' },
  { key: ['cancelled'], label: 'İptal' },
];

export default function TakiplerScreen() {
  const db = useSQLiteContext();
  const [filterIndex, setFilterIndex] = useState(0);
  const [items, setItems] = useState<FollowUpWithPerson[]>([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const rows = await listFollowUps(db, FILTERS[filterIndex].key);
    setItems(rows);
  }, [db, filterIndex]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filteredItems = useMemo(
    () => items.filter((item) => matchesQuery(query, item.title, item.personName, item.detail)),
    [items, query]
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Ara: kişi, başlık veya not..."
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map((f, idx) => (
          <Pressable
            key={f.label}
            onPress={() => setFilterIndex(idx)}
            style={[styles.filterChip, idx === filterIndex && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, idx === filterIndex && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon={query.trim() ? '🔍' : '🗒️'}
            title={query.trim() ? 'Aramayla eşleşen kayıt yok' : 'Bu filtrede kayıt yok'}
          />
        }
        renderItem={({ item }) => (
          <FollowUpCard
            item={item}
            onComplete={async () => {
              await completeFollowUp(db, item);
              await load();
            }}
            onDelete={async () => {
              await removeFollowUp(db, item);
              await load();
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef1f5' },
  searchRow: { paddingHorizontal: 16, paddingTop: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  listContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
});
