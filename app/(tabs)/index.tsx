import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronRight } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { hasAnyFollowUp, listFollowUps } from '../../src/db/queries';
import type { FollowUpWithPerson } from '../../src/types';
import { FollowUpCard } from '../../src/components/FollowUpCard';
import { EmptyState } from '../../src/components/EmptyState';
import { GradientBackground } from '../../src/components/GradientBackground';
import { isOverdue } from '../../src/utils/date';
import { completeFollowUp, removeFollowUp } from '../../src/services/followUpActions';
import { LateSuggestionCard } from '../../src/components/LateSuggestionCard';
import { useTheme, fontFamily, fontSize, letterSpacing, type ThemeColors } from '../../src/theme';
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
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<FollowUpWithPerson[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestion, setSuggestion] = useState<LatePersonSuggestion | null>(null);
  const [hasPendingNotification, setHasPendingNotification] = useState(false);
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
    try {
      const presented = await Notifications.getPresentedNotificationsAsync();
      setHasPendingNotification(presented.length > 0);
    } catch {
      // Android 6.0 altı ya da izin yok — zil sessizce boş kalır.
    }
  }, [db]);

  // Bildirim zili gerçek OS bildirim tepsisine bağlı: bekleyen (henüz
  // kapatılmamış) bir hatırlatma bildirimi varsa noktayla işaretleniyor,
  // dokununca hepsi kapatılıyor (görüldü sayılıyor).
  async function handleBellPress() {
    if (!hasPendingNotification) return;
    await Notifications.dismissAllNotificationsAsync();
    setHasPendingNotification(false);
  }

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
  const todayLabel = new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.dateBadge}>
                <View style={styles.dateBadgeDot} />
                <Text style={styles.dateBadgeText}>{todayLabel}</Text>
              </View>
              <Text style={styles.title}>{t('tabs.homeHeaderTitle')}</Text>
            </View>
            <Pressable
              onPress={handleBellPress}
              style={styles.bellButton}
              accessibilityRole="button"
              accessibilityLabel={t('home.notificationsA11y')}
            >
              <Bell color={colors.primaryText} size={19} strokeWidth={2} />
              {hasPendingNotification && <View style={styles.bellDot} />}
            </Pressable>
          </View>
        </View>
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
                  accessibilityLabel={t('home.quickLinkBekliyorumA11y')}
                >
                  <Text style={styles.quickLinkText}>{t('home.quickLinkBekliyorum')}</Text>
                </Pressable>
                <Pressable
                  style={styles.quickLink}
                  onPress={() => router.push('/gorunum/soz-verdim')}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.quickLinkSozVerdimA11y')}
                >
                  <Text style={styles.quickLinkText}>{t('home.quickLinkSozVerdim')}</Text>
                </Pressable>
                <Pressable
                  style={styles.quickLink}
                  onPress={() => router.push('/asistan')}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.quickLinkAsistanA11y')}
                >
                  <Text style={styles.quickLinkText}>{t('home.quickLinkAsistan')}</Text>
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
            {overdue.length > 0 && (
              <Text style={styles.sectionTitle}>{t('home.overdueSectionTitle', { count: overdue.length })}</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState icon="🎉" title={t('home.emptyTitle')} subtitle={t('home.emptySubtitle')} />
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
    </GradientBackground>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 6 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    headerLeft: { flex: 1 },
    bellButton: {
      width: 40,
      height: 40,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glassBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      marginTop: 2,
    },
    bellDot: {
      position: 'absolute',
      top: 8,
      right: 9,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.secondary,
      borderWidth: 1.5,
      borderColor: colors.bgWashTop,
    },
    dateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      marginBottom: 6,
    },
    dateBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryText },
    dateBadgeText: {
      fontSize: fontSize.caption,
      fontFamily: fontFamily.label,
      color: colors.primaryText,
      textTransform: 'uppercase',
      letterSpacing: letterSpacing.label,
    },
    title: {
      fontSize: fontSize.display,
      fontFamily: fontFamily.bodyExtraBold,
      color: colors.text,
      letterSpacing: letterSpacing.display,
    },
    listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
    quickLinksWrap: { marginBottom: 16 },
    quickLinksRow: {},
    quickLink: {
      backgroundColor: colors.glassBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginRight: 8,
      shadowColor: colors.text,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1,
    },
    quickLinkText: { fontSize: fontSize.caption, fontFamily: fontFamily.label, color: colors.text },
    sectionTitle: { fontSize: fontSize.small, fontFamily: fontFamily.displaySemiBold, color: colors.danger, marginBottom: 8 },
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
