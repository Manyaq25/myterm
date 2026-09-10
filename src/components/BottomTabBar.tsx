import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

const ICON_HOME = require('../../assets/icons/tab-home.png');
const ICON_TAKIPLER = require('../../assets/icons/tab-followups.png');
const ICON_AYARLAR = require('../../assets/icons/tab-settings.png');
const ICON_SPARKLE = require('../../assets/icons/tab-ai-sparkles.png');
const ICON_ADD = require('../../assets/icons/fab-add.png');

/**
 * Basılınca hafif büyüyen (spring) ölçek animasyonu — tüm menü öğeleri ve
 * FAB için ortak. Dokunmatik basılı tutulduğunda 1 → 1.12, bırakılınca
 * geri 1'e döner.
 */
function usePressScale() {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => {
    scale.value = withSpring(1.12, { damping: 10, stiffness: 300 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };
  return { animatedStyle, onPressIn, onPressOut };
}

function TabItem({
  active,
  icon,
  label,
  onPress,
  colors,
  styles,
}: {
  active: boolean;
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof getStyles>;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const tintColor = active ? colors.onPrimary : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.item}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : {}}
      accessibilityLabel={label}
    >
      <Animated.View style={animatedStyle}>
        {active ? (
          <LinearGradient colors={[colors.primary, colors.primaryText]} style={styles.jewelPill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Image source={icon} style={styles.icon3d} resizeMode="contain" />
            <Text style={[styles.label, styles.labelActive, { color: tintColor }]} numberOfLines={1}>
              {label}
            </Text>
          </LinearGradient>
        ) : (
          <View style={styles.itemInner}>
            <Image source={icon} style={styles.icon3d} resizeMode="contain" />
            <Text style={[styles.label, { color: tintColor }]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function FabButton({ onPress, accessibilityLabel, styles }: { onPress: () => void; accessibilityLabel: string; styles: ReturnType<typeof getStyles> }) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[styles.fab, animatedStyle]}>
        <Image source={ICON_ADD} style={styles.fabIcon} resizeMode="contain" />
      </Animated.View>
    </Pressable>
  );
}

/**
 * Global, kalıcı alt navigasyon — React Navigation'ın Tabs.Navigator'ına
 * bağlı değil, kök layout'ta (app/_layout.tsx) her ekranın altında sabit
 * render ediliyor. Aktif sekme React Navigation state'i yerine geçerli
 * pathname'e göre belirleniyor — böylece "Yeni Takip" / "Akıllı Ekle" gibi
 * doğrudan menüden açılan push ekranlarına girildiğinde de kaybolmuyor.
 */
export function BottomTabBar() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.island}>
        <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, styles.islandTint]} pointerEvents="none" />
        <View style={styles.row}>
          <TabItem
            active={pathname === '/'}
            icon={ICON_HOME}
            label={t('tabs.home')}
            onPress={() => router.navigate('/')}
            colors={colors}
            styles={styles}
          />
          <TabItem
            active={pathname === '/takipler'}
            icon={ICON_TAKIPLER}
            label={t('tabs.takipler')}
            onPress={() => router.navigate('/takipler')}
            colors={colors}
            styles={styles}
          />

          <View style={styles.item}>
            <FabButton onPress={() => router.push('/takip/yeni')} accessibilityLabel={t('bottomTabBar.addA11y')} styles={styles} />
          </View>

          <TabItem
            active={pathname === '/takip/ai-cikar'}
            icon={ICON_SPARKLE}
            label={t('bottomTabBar.smartAdd')}
            onPress={() => router.push('/takip/ai-cikar')}
            colors={colors}
            styles={styles}
          />

          <TabItem
            active={pathname === '/ayarlar'}
            icon={ICON_AYARLAR}
            label={t('tabs.ayarlar')}
            onPress={() => router.navigate('/ayarlar')}
            colors={colors}
            styles={styles}
          />
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
    icon3d: { width: 26, height: 26 },
    label: { fontSize: fontSize.caption, fontFamily: fontFamily.label },
    labelActive: { fontFamily: fontFamily.labelBold },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -24,
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    fabIcon: { width: 56, height: 56 },
  });
}
