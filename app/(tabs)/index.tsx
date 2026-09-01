import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../../src/theme';
import { isOnboardingSeen, markOnboardingSeen } from '../../src/services/onboarding';
import { updateWidgetSummary } from '../../src/services/widget';
import {
  acceptLateSuggestion,
  detectLatePersonSuggestions,
  dismissLateSuggestion,
  type LatePersonSuggestion,
} from '../../src/services/proactiveSuggestions';

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
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

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
    quickLinksRow: { marginBottom: 16 },
    quickLink: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginRight: 8,
    },
    quickLinkText: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    sectionTitle: { fontSize: fontSize.small, fontFamily: fontFamily.bodyBold, color: colors.danger, marginBottom: 8 },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    fabText: { color: colors.onPrimary, fontSize: 28, lineHeight: 30 },
    aiFab: {
      position: 'absolute',
      right: 20,
      bottom: 92,
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.rose,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: colors.rose,
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    aiFabText: { color: colors.onPrimary, fontSize: fontSize.small, fontFamily: fontFamily.bodyExtraBold },
  });
}
