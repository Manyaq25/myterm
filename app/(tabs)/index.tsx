import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listFollowUps } from '../../src/db/queries';
import type { FollowUpWithPerson } from '../../src/types';
import { FollowUpCard } from '../../src/components/FollowUpCard';
import { EmptyState } from '../../src/components/EmptyState';
import { isOverdue } from '../../src/utils/date';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [items, setItems] = useState<FollowUpWithPerson[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await listFollowUps(db, ['open', 'snoozed']);
    setItems(rows);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const overdue = items.filter((i) => isOverdue(i.dueAt));
  const upcoming = items.filter((i) => !isOverdue(i.dueAt));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={[...overdue, ...upcoming]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListHeaderComponent={
          overdue.length > 0 ? (
            <Text style={styles.sectionTitle}>Gecikenler ({overdue.length})</Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="Şu an takip edilecek bir şey yok"
            subtitle="Bir söz, bir görev veya beklediğin bir şey ekleyerek başla."
          />
        }
        renderItem={({ item }) => <FollowUpCard item={item} />}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/takip/yeni')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#dc2626', marginBottom: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
