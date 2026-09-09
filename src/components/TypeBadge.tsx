import { useMemo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FollowUpType } from '../types';
import { followUpTypeLabel } from '../i18n/labels';
import { useTheme, getTypeColor, hexToRgba, fontFamily, fontSize } from '../theme';

/**
 * Takip türü rozeti — Stitch'te tasarlanan "yumuşak ton + nokta" pill stiline
 * göre: dolgu renk yerine türün rengiyle hafif tonlanmış bir zemin, önünde
 * aynı renkte küçük bir nokta.
 */
export function TypeBadge({ type, style }: { type: FollowUpType; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const color = getTypeColor(type, colors);
  const styles = useMemo(() => getStyles(color), [color]);

  return (
    <View style={[styles.badge, style]}>
      <View style={styles.dot} />
      <Text style={styles.text}>{followUpTypeLabel(type, t)}</Text>
    </View>
  );
}

function getStyles(color: string) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: hexToRgba(color, 0.35),
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color },
    text: { color, fontSize: fontSize.caption, fontFamily: fontFamily.bodyBold },
  });
}
