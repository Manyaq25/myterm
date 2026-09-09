import { useMemo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FollowUpType } from '../types';
import { followUpTypeLabel } from '../i18n/labels';
import { useTheme, getTypeColor, hexToRgba, fontFamily, fontSize } from '../theme';

// Açık mod zemin tonları — Stitch'in bu marka rengi (#0E5C56) için ürettiği
// gerçek Material "container" paletinden alındı (task=primary_container,
// promise_made=secondary_container). waiting_on/promise_expected için
// Stitch'in ürettiği eşdeğer bir 4. renk yok (Material üçlü sistemi
// primary/secondary/tertiary ile sınırlı) — onlar aynı pastel karaktere
// göre elle ayarlandı.
const LIGHT_TINTS: Record<FollowUpType, string> = {
  task: '#A8F0E7',
  promise_made: '#FFD9E0',
  waiting_on: '#FBE7B8',
  promise_expected: '#FBDCC8',
};

/**
 * Takip türü rozeti — Stitch'te tasarlanan "yumuşak ton + nokta" pill stiline
 * göre: dolgu renk yerine türün rengiyle hafif tonlanmış bir zemin, önünde
 * aynı renkte küçük bir nokta.
 */
export function TypeBadge({ type, style }: { type: FollowUpType; style?: StyleProp<ViewStyle> }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const color = getTypeColor(type, colors);
  // Karanlık modda Stitch'in açık-mod paleti geçerli değil — marka rengiyle
  // hesaplanan bir saydamlık hâlâ makul bir yaklaşım.
  const tint = isDark ? hexToRgba(color, 0.3) : LIGHT_TINTS[type];
  const styles = useMemo(() => getStyles(color, tint), [color, tint]);

  return (
    <View style={[styles.badge, style]}>
      <View style={styles.dot} />
      <Text style={styles.text}>{followUpTypeLabel(type, t)}</Text>
    </View>
  );
}

function getStyles(color: string, tint: string) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: tint,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color },
    text: { color, fontSize: fontSize.caption, fontFamily: fontFamily.bodyBold },
  });
}
