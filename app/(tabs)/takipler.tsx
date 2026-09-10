import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search } from 'lucide-react-native';
import { listFollowUps } from '../../src/db/queries';
import type { FollowUpStatus, FollowUpWithPerson } from '../../src/types';
import { FollowUpCard } from '../../src/components/FollowUpCard';
import { EmptyState } from '../../src/components/EmptyState';
import { GradientBackground } from '../../src/components/GradientBackground';
import { matchesQuery } from '../../src/utils/search';
import { completeFollowUp, removeFollowUp, removeFollowUps } from '../../src/services/followUpActions';
import { useTheme, fontFamily, fontSize, letterSpacing, hexToRgba, type ThemeColors } from '../../src/theme';

function getFilters(t: TFunction): { key: FollowUpStatus[]; label: string }[] {
  return [
    { key: ['open', 'snoozed'], label: t('takipler.filterOpen') },
    { key: ['done'], label: t('takipler.filterDone') },
    { key: ['cancelled'], label: t('takipler.filterCancelled') },
  ];
}

// Aktif olmayan pillerde durum başına tonal renk — "Tamamlanan" başarı yeşili,
// "İptal" tehlike/gül tonu, "Açık" ise nötr camsı yüzey.
function getInactivePillColors(idx: number, colors: ThemeColors) {
  switch (idx) {
    case 1:
      return { bg: hexToRgba(colors.success, 0.14), text: colors.success, border: hexToRgba(colors.success, 0.3) };
    case 2:
      return { bg: hexToRgba(colors.rose, 0.12), text: colors.rose, border: hexToRgba(colors.rose, 0.28) };
    default:
      return { bg: colors.glassBg, text: colors.text, border: colors.glassBorder };
  }
}

export default function TakiplerScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const filters = useMemo(() => getFilters(t), [t]);
  const [filterIndex, setFilterIndex] = useState(0);
  const [items, setItems] = useState<FollowUpWithPerson[]>([]);
  const [query, setQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const rows = await listFollowUps(db, filters[filterIndex].key);
    setItems(rows);
  }, [db, filterIndex, filters]);

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
      t('takipler.bulkDeleteAlertTitle'),
      t('takipler.bulkDeleteAlertMessage', { count: selected.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
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
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.takipler')}</Text>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Search color={colors.primaryText} size={16} strokeWidth={2.2} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('takipler.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            editable={!selectionMode}
            accessibilityLabel={t('takipler.searchA11y')}
          />
        </View>
        {filteredItems.length > 0 && (
          <Pressable
            style={styles.selectToggle}
            onPress={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
            accessibilityRole="button"
            accessibilityLabel={selectionMode ? t('takipler.closeSelectModeA11y') : t('takipler.openSelectModeA11y')}
          >
            <Text style={styles.selectToggleText}>
              {selectionMode ? t('takipler.selectToggleCancel') : t('takipler.selectToggleSelect')}
            </Text>
          </Pressable>
        )}
      </View>
      {selectionMode && (
        <View style={styles.selectionBar}>
          <Pressable
            onPress={toggleSelectAll}
            accessibilityRole="button"
            accessibilityLabel={selectedIds.size === filteredItems.length ? t('takipler.deselectAll') : t('takipler.selectAll')}
          >
            <Text style={styles.selectionBarLink}>
              {selectedIds.size === filteredItems.length ? t('takipler.deselectAll') : t('takipler.selectAll')}
            </Text>
          </Pressable>
          <Text style={styles.selectionBarCount} accessibilityLiveRegion="polite">
            {t('takipler.selectedCount', { count: selectedIds.size })}
          </Text>
          <Pressable
            style={[styles.selectionDeleteButton, selectedIds.size === 0 && styles.buttonDisabled]}
            onPress={handleBulkDelete}
            disabled={selectedIds.size === 0}
            accessibilityRole="button"
            accessibilityLabel={t('takipler.bulkDeleteA11y', { count: selectedIds.size })}
            accessibilityState={{ disabled: selectedIds.size === 0 }}
          >
            <Text style={styles.selectionDeleteButtonText}>{t('common.delete')}</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.filterRow} accessibilityRole="radiogroup">
        {filters.map((f, idx) => {
          const isActive = idx === filterIndex;
          const inactive = getInactivePillColors(idx, colors);
          return (
            <Pressable
              key={f.label}
              onPress={() => {
                setFilterIndex(idx);
                exitSelectionMode();
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
              accessibilityLabel={f.label}
            >
              {isActive ? (
                <LinearGradient colors={[colors.primary, colors.primaryText]} style={styles.filterChip}>
                  <View style={styles.filterDotActive} />
                  <Text style={[styles.filterText, styles.filterTextActive]}>{f.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.filterChip, { backgroundColor: inactive.bg, borderWidth: 1, borderColor: inactive.border }]}>
                  <Text style={[styles.filterText, { color: inactive.text }]}>{f.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon={query.trim() ? '🔍' : '🗒️'}
            title={query.trim() ? t('takipler.emptySearchTitle') : t('takipler.emptyFilterTitle')}
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
    </GradientBackground>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 2 },
    title: {
      fontSize: fontSize.display,
      fontFamily: fontFamily.bodyExtraBold,
      color: colors.text,
      letterSpacing: letterSpacing.display,
    },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
    searchInputWrap: { flex: 1, position: 'relative', justifyContent: 'center' },
    searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingLeft: 38,
      paddingVertical: 10,
      fontSize: fontSize.base,
      fontFamily: fontFamily.body,
      color: colors.text,
      backgroundColor: colors.glassBg,
      shadowColor: colors.primary,
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1,
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
    },
    filterDotActive: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.onPrimary },
    filterText: { fontSize: fontSize.caption, fontFamily: fontFamily.label },
    filterTextActive: { color: colors.onPrimary },
    listContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  });
}
