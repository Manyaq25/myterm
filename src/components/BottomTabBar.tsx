import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus, Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

/**
 * "Kinetic Luster" spesifikasyonundaki "Floating Bottom Navigation" —
 * kenarlardan ayrık, camsı (frosted) bir ada; aktif sekmenin arkasında
 * renkli bir "jewel pill" beliriyor. Ekran içeriğiyle çakışma riskini
 * azaltmak için gerçek `position: absolute` yerine normal akışta kalan,
 * yuvarlatılmış kenarlı bir ada görünümü kullanılıyor.
 */
export function BottomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const [homeRoute, takiplerRoute, ayarlarRoute] = state.routes;

  function renderTabItem(route: (typeof state.routes)[number], index: number) {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const label = typeof options.title === 'string' ? options.title : route.name;
    const tintColor = isFocused ? colors.onPrimary : colors.textMuted;
    const icon = options.tabBarIcon?.({ focused: isFocused, color: isFocused ? colors.onPrimary : colors.textMuted, size: 22 });

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
        {isFocused ? (
          <LinearGradient
            colors={[colors.primary, colors.primaryText]}
            style={styles.jewelPill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {icon}
            <Text style={[styles.label, styles.labelActive, { color: tintColor }]} numberOfLines={1}>
              {label}
            </Text>
          </LinearGradient>
        ) : (
          <View style={styles.itemInner}>
            {icon}
            <Text style={[styles.label, { color: tintColor }]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.island}>
        <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, styles.islandTint]} pointerEvents="none" />
        <View style={styles.row}>
          {renderTabItem(homeRoute, 0)}
          {renderTabItem(takiplerRoute, 1)}

          <View style={styles.item}>
            <Pressable
              onPress={() => router.push('/takip/yeni')}
              style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('bottomTabBar.addA11y')}
            >
              <LinearGradient
                colors={[colors.primaryText, colors.primary]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <Plus color={colors.onPrimary} size={26} strokeWidth={2.5} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push('/takip/ai-cikar')}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={t('bottomTabBar.smartAddA11y')}
          >
            <View style={styles.itemInner}>
              <Sparkles color={colors.textMuted} size={22} strokeWidth={2} />
              <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
                {t('bottomTabBar.smartAdd')}
              </Text>
            </View>
          </Pressable>

          {renderTabItem(ayarlarRoute, 2)}
        </View>
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingTop: 10,
      backgroundColor: 'transparent',
    },
    island: {
      borderRadius: 28,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.glassBorderStrong,
      shadowColor: colors.text,
      shadowOpacity: 0.1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    islandTint: {
      backgroundColor: colors.glassBgStrong,
    },
    row: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemInner: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    jewelPill: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 18,
    },
    label: { fontSize: fontSize.caption, fontFamily: fontFamily.label },
    labelActive: { fontFamily: fontFamily.labelBold },
    fab: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -22,
      overflow: 'hidden',
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    fabPressed: { opacity: 0.85 },
  });
}
