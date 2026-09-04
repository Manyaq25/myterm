import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
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
  const [showScrollHint, setShowScrollHint] = useState(false);
  const quickLinksContentWidth = useRef(0);
  const quickLinksContainerWidth = useRef(0);
  const hintBounce = useSharedValue(0);

  useEffect(() => {
    hintBounce.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 550, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 550, easing: Easing.in(Easing.quad) })
      ),
      -1
    );
  }, [hintBounce]);

  const hintStyle = useAnimatedStyle(() => ({ transform: [{ translateX: hintBounce.value }] }));

  function checkQuickLinksOverflow() {
    if (quickLinksContentWidth.current > quickLinksContainerWidth.current + 4) {
      setShowScrollHint(true);
    }
  }

  function handleQuickLinksScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromEnd = contentSize.width - layoutMeasurement.width - contentOffset.x;
    setShowScrollHint(distanceFromEnd > 16);
  }

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
            <View style={styles.quickLinksWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.quickLinksRow}
                onScroll={handleQuickLinksScroll}
                scrollEventThrottle={32}
                onLayout={(e) => {
                  quickLinksContainerWidth.current = e.nativeEvent.layout.width;
                  checkQuickLinksOverflow();
                }}
                onContentSizeChange={(contentWidth) => {
                  quickLinksContentWidth.current = contentWidth;
                  checkQuickLinksOverflow();
                }}
              >
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
              {showScrollHint && (
                <View style={styles.scrollHintBadge} pointerEvents="none">
                  <Animated.View style={hintStyle}>
                    <ChevronRight color={colors.rose} size={18} strokeWidth={3} />
                  </Animated.View>
                </View>
              )}
            </View>
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
    </SafeAreaView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
    quickLinksWrap: { marginBottom: 16 },
    quickLinksRow: {},
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
    scrollHintBadge: {
      position: 'absolute',
      right: 2,
      top: 8,
      bottom: 8,
      width: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      shadowColor: colors.text,
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: -1, height: 0 },
      elevation: 2,
    },
  });
}
