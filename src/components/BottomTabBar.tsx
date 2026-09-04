import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Plus, Sparkles } from 'lucide-react-native';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

export function BottomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const router = useRouter();
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
        {isFocused && <View style={styles.activeGlow} />}
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

      <Pressable
        onPress={() => router.push('/takip/yeni')}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel="Yeni takip ekle"
      >
        <Plus color={colors.textMuted} size={24} strokeWidth={2} />
        <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
          Ekle
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/takip/ai-cikar')}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel="Yapay zeka ile takip çıkar"
      >
        <Sparkles color={colors.textMuted} size={24} strokeWidth={2} />
        <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
          Akıllı Ekle
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
    activeGlow: {
      position: 'absolute',
      top: -6,
      width: 56,
      height: 40,
      borderRadius: 16,
      backgroundColor: `${colors.primary}1F`,
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 3,
    },
    label: { fontSize: fontSize.caption, fontFamily: fontFamily.bodyMedium },
    labelActive: { fontFamily: fontFamily.bodyBold },
  });
}
