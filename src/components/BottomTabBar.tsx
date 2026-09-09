import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus, Sparkles } from 'lucide-react-native';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

export function BottomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const [homeRoute, takiplerRoute, ayarlarRoute] = state.routes;

  function renderTabItem(route: (typeof state.routes)[number], index: number) {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const label = typeof options.title === 'string' ? options.title : route.name;
    const tintColor = isFocused ? colors.primary : colors.textMuted;
    const icon = options.tabBarIcon?.({ focused: isFocused, color: tintColor, size: 24 });

    function onPress() {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    }

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={styles.item}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={label}
      >
        {isFocused && (
          <View style={styles.activeGlowWrap} pointerEvents="none">
            <View style={styles.activeGlowOuter} />
            <View style={styles.activeGlowInner} />
          </View>
        )}
        {icon}
        <Text style={[styles.label, { color: tintColor }, isFocused && styles.labelActive]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {renderTabItem(homeRoute, 0)}
      {renderTabItem(takiplerRoute, 1)}

      <View style={styles.item}>
        <Pressable
          onPress={() => router.push('/takip/yeni')}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('bottomTabBar.addA11y')}
        >
          <Plus color={colors.onPrimary} size={26} strokeWidth={2.5} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/takip/ai-cikar')}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel={t('bottomTabBar.smartAddA11y')}
      >
        <Sparkles color={colors.textMuted} size={24} strokeWidth={2} />
        <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
          {t('bottomTabBar.smartAdd')}
        </Text>
      </Pressable>

      {renderTabItem(ayarlarRoute, 2)}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingVertical: 2,
    },
    // Layered flat-color rounded rects instead of shadow/elevation — RN's
    // Android elevation shadow ignores borderRadius cleanly in some cases
    // and was leaving a visible rectangular halo behind the rounded glow.
    activeGlowWrap: {
      position: 'absolute',
      top: -8,
      width: 64,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeGlowOuter: {
      position: 'absolute',
      width: 64,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${colors.gold}17`,
    },
    activeGlowInner: {
      position: 'absolute',
      width: 46,
      height: 34,
      borderRadius: 17,
      backgroundColor: `${colors.gold}2E`,
    },
    label: { fontSize: fontSize.caption, fontFamily: fontFamily.bodyMedium },
    labelActive: { fontFamily: fontFamily.bodyBold },
    fab: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -22,
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    fabPressed: { opacity: 0.85 },
  });
}
