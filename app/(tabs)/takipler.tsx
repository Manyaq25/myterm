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
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../../src/theme';

const FILTERS: { key: FollowUpStatus[]; label: string }[] = [
  { key: ['open', 'snoozed'], label: 'Açık' },
  { key: ['done'], label: 'Tamamlanan' },
  { key: ['cancelled'], label: 'İptal' },
];

export default function TakiplerScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
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
          placeholderTextColor={colors.textMuted}
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

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: fontSize.base,
      fontFamily: fontFamily.body,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    selectToggle: { paddingVertical: 8, paddingHorizontal: 4 },
    selectToggleText: { color: colors.primary, fontSize: fontSize.base, fontFamily: fontFamily.bodySemiBold },
    selectionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    selectionBarLink: { color: colors.primary, fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold },
    selectionBarCount: { color: colors.textMuted, fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold },
    selectionDeleteButton: {
      backgroundColor: colors.danger,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    selectionDeleteButtonText: { color: colors.onPrimary, fontSize: fontSize.small, fontFamily: fontFamily.bodyBold },
    buttonDisabled: { opacity: 0.5 },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    filterChipActive: { backgroundColor: colors.primary },
    filterText: { fontSize: fontSize.small, color: colors.text, fontFamily: fontFamily.bodySemiBold },
    filterTextActive: { color: colors.onPrimary },
    listContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  });
}
