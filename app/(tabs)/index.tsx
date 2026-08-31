import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hasAnyFollowUp, listFollowUps } from '../../src/db/queries';
import type { FollowUpWithPerson } from '../../src/types';
import { FollowUpCard } from '../../src/components/FollowUpCard';
import { EmptyState } from '../../src/components/EmptyState';
import { isOverdue } from '../../src/utils/date';
import { completeFollowUp, removeFollowUp } from '../../src/services/followUpActions';
import { LateSuggestionCard } from '../../src/components/LateSuggestionCard';
import { SCREEN_BACKGROUND } from '../../src/constants/cardStyle';
import { isOnboardingSeen, markOnboardingSeen } from '../../src/services/onboarding';
import { updateWidgetSummary } from '../../src/services/widget';
import {
  acceptLateSuggestion,
  detectLatePersonSuggestions,
  dismissLateSuggestion,
  type LatePersonSuggestion,
} from '../../src/services/proactiveSuggestions';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [items, setItems] = useState<FollowUpWithPerson[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestion, setSuggestion] = useState<LatePersonSuggestion | null>(null);

  const load = useCallback(async () => {
    const rows = await listFollowUps(db, ['open', 'snoozed']);
    setItems(rows);
    const suggestions = await detectLatePersonSuggestions(db);
    setSuggestion(suggestions[0] ?? null);
    await updateWidgetSummary(db);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    (async () => {
      if (await isOnboardingSeen()) return;
      if (await hasAnyFollowUp(db)) {
        // Var olan kullanıcı — daha önce takip oluşturmuş, onboarding'i hiç görmesin.
        await markOnboardingSeen();
        return;
      }
      router.push('/onboarding');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickLinksRow}>
              <Pressable
                style={styles.quickLink}
                onPress={() => router.push('/gorunum/bekliyorum')}
                accessibilityRole="button"
                accessibilityLabel="Neyi Bekliyorum? görünümünü aç"
              >
                <Text style={styles.quickLinkText}>🔎 Neyi Bekliyorum?</Text>
              </Pressable>
              <Pressable
                style={styles.quickLink}
                onPress={() => router.push('/gorunum/soz-verdim')}
                accessibilityRole="button"
                accessibilityLabel="Kime Söz Verdim? görünümünü aç"
              >
                <Text style={styles.quickLinkText}>🤝 Kime Söz Verdim?</Text>
              </Pressable>
              <Pressable
                style={styles.quickLink}
                onPress={() => router.push('/asistan')}
                accessibilityRole="button"
                accessibilityLabel="AI Asistan'ı aç"
              >
                <Text style={styles.quickLinkText}>💬 AI Asistan</Text>
              </Pressable>
            </ScrollView>
            {suggestion && (
              <LateSuggestionCard
                suggestion={suggestion}
                onAccept={async () => {
                  await acceptLateSuggestion(db, suggestion.person.id);
                  await load();
                }}
                onDismiss={async () => {
                  await dismissLateSuggestion(db, suggestion.person.id);
                  await load();
                }}
              />
            )}
            {overdue.length > 0 && <Text style={styles.sectionTitle}>Gecikenler ({overdue.length})</Text>}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="🎉"
            title="Şu an takip edilecek bir şey yok"
            subtitle="Bir söz, bir görev veya beklediğin bir şey ekleyerek başla."
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
      <Pressable
        style={styles.aiFab}
        onPress={() => router.push('/takip/ai-cikar')}
        accessibilityRole="button"
        accessibilityLabel="AI ile takip çıkar"
        accessibilityHint="Metin, ses veya görselden otomatik takip maddesi çıkarır"
      >
        <Text style={styles.aiFabText}>AI</Text>
      </Pressable>
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/takip/yeni')}
        accessibilityRole="button"
        accessibilityLabel="Yeni takip ekle"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SCREEN_BACKGROUND },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  quickLinksRow: { marginBottom: 16 },
  quickLink: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  quickLinkText: { fontSize: 13, fontWeight: '600', color: '#374151' },
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
  aiFab: {
    position: 'absolute',
    right: 20,
    bottom: 92,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  aiFabText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
