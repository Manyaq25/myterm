import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listFollowUps } from '../../src/db/queries';
import type { FollowUpStatus, FollowUpWithPerson } from '../../src/types';
import { FollowUpCard } from '../../src/components/FollowUpCard';
import { EmptyState } from '../../src/components/EmptyState';
import { matchesQuery } from '../../src/utils/search';
import { completeFollowUp, removeFollowUp, removeFollowUps } from '../../src/services/followUpActions';
import { SCREEN_BACKGROUND } from '../../src/constants/cardStyle';

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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === filteredItems.length ? new Set() : new Set(filteredItems.map((i) => i.id))
    );
  }

  function handleBulkDelete() {
    const selected = filteredItems.filter((item) => selectedIds.has(item.id));
    if (selected.length === 0) return;
    Alert.alert(
      'Seçilenleri sil',
      `${selected.length} kayıt silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await removeFollowUps(db, selected);
            exitSelectionMode();
            await load();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Ara: kişi, başlık veya not..."
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          editable={!selectionMode}
          accessibilityLabel="Kişi, başlık veya not ara"
        />
        {filteredItems.length > 0 && (
          <Pressable
            style={styles.selectToggle}
            onPress={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
            accessibilityRole="button"
            accessibilityLabel={selectionMode ? 'Seçim modunu kapat' : 'Toplu seçim modunu aç'}
          >
            <Text style={styles.selectToggleText}>{selectionMode ? 'İptal' : 'Seç'}</Text>
          </Pressable>
        )}
      </View>
      {selectionMode && (
        <View style={styles.selectionBar}>
          <Pressable
            onPress={toggleSelectAll}
            accessibilityRole="button"
            accessibilityLabel={selectedIds.size === filteredItems.length ? 'Seçimi kaldır' : 'Tümünü seç'}
          >
            <Text style={styles.selectionBarLink}>
              {selectedIds.size === filteredItems.length ? 'Seçimi kaldır' : 'Tümünü seç'}
            </Text>
          </Pressable>
          <Text style={styles.selectionBarCount} accessibilityLiveRegion="polite">
            {selectedIds.size} seçili
          </Text>
          <Pressable
            style={[styles.selectionDeleteButton, selectedIds.size === 0 && styles.buttonDisabled]}
            onPress={handleBulkDelete}
            disabled={selectedIds.size === 0}
            accessibilityRole="button"
            accessibilityLabel={`Seçilen ${selectedIds.size} kaydı sil`}
            accessibilityState={{ disabled: selectedIds.size === 0 }}
          >
            <Text style={styles.selectionDeleteButtonText}>Sil</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.filterRow} accessibilityRole="radiogroup">
        {FILTERS.map((f, idx) => (
          <Pressable
            key={f.label}
            onPress={() => {
              setFilterIndex(idx);
              exitSelectionMode();
            }}
            style={[styles.filterChip, idx === filterIndex && styles.filterChipActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: idx === filterIndex }}
            accessibilityLabel={f.label}
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
            selectionMode={selectionMode}
            selected={selectedIds.has(item.id)}
            onToggleSelect={() => toggleSelected(item.id)}
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
  container: { flex: 1, backgroundColor: SCREEN_BACKGROUND },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  selectToggle: { paddingVertical: 8, paddingHorizontal: 4 },
  selectToggleText: { color: '#2563eb', fontSize: 15, fontWeight: '600' },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  selectionBarLink: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  selectionBarCount: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  selectionDeleteButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  selectionDeleteButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
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
