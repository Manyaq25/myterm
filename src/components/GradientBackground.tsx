import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme';

/**
 * Stitch'in gerçek ekran export'larındaki (Ana Sayfa/Takipler/Yeni Takip/
 * AI ile Çıkar) ortak arkaplan deseni: teal tonlu bir "wash" gradyanı +
 * üst-sol/alt-sağ köşelerde yumuşak, bulanık renkli lekeler ("ambient
 * mesh"). Düz `colors.background` yerine bu bileşeni kullanan ekranlar
 * export'lardaki canlı/havadar his ile eşleşir.
 */
export function GradientBackground({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.fill, style]}>
      <LinearGradient colors={[colors.bgWashTop, colors.bgWashBottom]} style={StyleSheet.absoluteFillObject} />
      <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Defs>
          <RadialGradient id="blobPrimary" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.primaryContainer} stopOpacity={isDark ? 0.18 : 0.32} />
            <Stop offset="100%" stopColor={colors.primaryContainer} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="blobSecondary" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.secondaryContainer} stopOpacity={isDark ? 0.12 : 0.18} />
            <Stop offset="100%" stopColor={colors.secondaryContainer} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="-8%" cy="-6%" r="42%" fill="url(#blobPrimary)" />
        <Circle cx="108%" cy="30%" r="38%" fill="url(#blobSecondary)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
