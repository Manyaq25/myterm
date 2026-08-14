import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listFollowUps } from '../../src/db/queries';
import type { FollowUpStatus, FollowUpWithPerson } from '../../src/types';
import { FollowUpCard } from '../../src/components/FollowUpCard';
import { EmptyState } from '../../src/components/EmptyState';

const FILTERS: { key: FollowUpStatus[]; label: string }[] = [
  { key: ['open', 'snoozed'], label: 'Açık' },
  { key: ['done'], label: 'Tamamlanan' },
  { key: ['cancelled'], label: 'İptal' },
];

export default function TakiplerScreen() {
  const db = useSQLiteContext();
  const [filterIndex, setFilterIndex] = useState(0);
  const [items, setItems] = useState<FollowUpWithPerson[]>([]);

  const load = useCallback(async () => {
    const rows = await listFollowUps(db, FILTERS[filterIndex].key);
    setItems(rows);
  }, [db, filterIndex]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState title="Bu filtrede kayıt yok" />}
        renderItem={({ item }) => <FollowUpCard item={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
