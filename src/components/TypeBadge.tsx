import { useMemo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FollowUpType } from '../types';
import { followUpTypeLabel } from '../i18n/labels';
import { useTheme, getTypeColor, hexToRgba, fontFamily, fontSize, type ThemeColors } from '../theme';

interface BadgePalette {
  bg: string;
  dot: string;
  text: string;
  border: string;
}

function lightPaletteFor(type: FollowUpType, colors: ThemeColors): BadgePalette {
  switch (type) {
    case 'task':
      return { bg: colors.primaryContainer, dot: colors.primary, text: colors.onPrimaryContainer, border: hexToRgba(colors.primary, 0.35) };
    case 'waiting_on':
      return { bg: colors.tertiaryContainer, dot: colors.tertiary, text: colors.onTertiaryContainer, border: hexToRgba(colors.tertiary, 0.35) };
    case 'promise_expected':
      return { bg: colors.secondaryContainer, dot: colors.secondary, text: colors.onSecondaryContainer, border: hexToRgba(colors.secondary, 0.35) };
    case 'promise_made':
      return { bg: hexToRgba(colors.rose, 0.16), dot: colors.rose, text: '#81003A', border: hexToRgba(colors.rose, 0.35) };
  }
}

/**
 * Takip türü rozeti — Kinetic Luster'ın M3 tonal "container" ikilisine göre:
 * soluk container zemini + tam doygun nokta + on-container yazı rengi. Dört
 * takip türü, tasarım sisteminin üç markalı tonuna (primary/tertiary/
 * secondary) artı marka sürekliliği için korunan 4. bir pembe tona (rose)
 * eşleniyor — Kinetic Luster'da ayrı bir 4. hue tanımlı değil.
 */
export function TypeBadge({ type, style }: { type: FollowUpType; style?: StyleProp<ViewStyle> }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const brandColor = getTypeColor(type, colors);
  const palette: BadgePalette = isDark
    ? { bg: hexToRgba(brandColor, 0.3), dot: brandColor, text: brandColor, border: 'transparent' }
    : lightPaletteFor(type, colors);
  const styles = useMemo(() => getStyles(palette), [palette]);

  return (
    <View style={[styles.badge, style]}>
      <View style={styles.dot} />
      <Text style={styles.text}>{followUpTypeLabel(type, t)}</Text>
    </View>
  );
}

function getStyles(palette: BadgePalette) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: palette.bg,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.dot },
    text: { color: palette.text, fontSize: fontSize.caption, fontFamily: fontFamily.label },
  });
}
