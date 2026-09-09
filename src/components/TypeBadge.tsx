import { useMemo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FollowUpType } from '../types';
import { followUpTypeLabel } from '../i18n/labels';
import { useTheme, getTypeColor, hexToRgba, fontFamily, fontSize } from '../theme';

interface BadgePalette {
  bg: string;
  dot: string;
  text: string;
  border: string;
}

// Açık mod paleti — Stitch'in bu marka rengi için ürettiği "Components"
// ekranının HTML/CSS kodundan (panoya kopyalanıp paylaşıldı) birebir alındı,
// tahmini değil. Her tür 3 ayrı tonda: soluk zemin, orta-koyu nokta, koyu
// yazı — örn. "Bekliyorum" zemini göründüğünden daha doygun çünkü Stitch
// kendi altın tonumuzla aynı yazı rengini kullanınca kontrast düşük
// kalıyordu, o yüzden daha koyu bir kahverengi yazı seçmiş.
// promise_expected için markada 4. bir renk yok (Material üçlü sistemi
// primary/secondary/tertiary ile sınırlı) — Stitch orada standart Tailwind
// "orange" paletine düşmüş, aynı değerler kullanıldı.
const LIGHT_PALETTE: Record<FollowUpType, BadgePalette> = {
  task: { bg: '#A8F0E7', dot: '#1D6A63', text: '#004843', border: '#9AE1D9' },
  waiting_on: { bg: '#F5BA3F', dot: '#7D5900', text: '#533A00', border: '#E6AC32' },
  promise_made: { bg: '#FFD9E0', dot: '#BC0057', text: '#81003A', border: '#FFC5D1' },
  promise_expected: { bg: '#FFEDD5', dot: '#EA580C', text: '#7C2D12', border: '#FED7AA' },
};

/**
 * Takip türü rozeti — Stitch'in "Components" ekranındaki üç katmanlı
 * (soluk zemin + orta-koyu nokta + koyu yazı) pill stiline göre.
 */
export function TypeBadge({ type, style }: { type: FollowUpType; style?: StyleProp<ViewStyle> }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const brandColor = getTypeColor(type, colors);
  // Karanlık modda Stitch'in açık-mod paleti geçerli değil — marka rengiyle
  // hesaplanan bir saydamlık hâlâ makul bir yaklaşım.
  const palette: BadgePalette = isDark
    ? { bg: hexToRgba(brandColor, 0.3), dot: brandColor, text: brandColor, border: 'transparent' }
    : LIGHT_PALETTE[type];
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
    text: { color: palette.text, fontSize: fontSize.caption, fontFamily: fontFamily.bodyBold },
  });
}
