import type { ThemeColors } from '../theme/colors';

// "Kinetic Luster" spesifikasyonunun "Surface Glass Level 1" kartı —
// gerçek arkaplan bulanıklığı yerine (statik ekranlarda görsel fark az,
// BlurView her çağrı yerini sarmalamayı gerektirir) donuk camsı yüzey
// (glassBg/glassBorder) + spesifikasyondaki ambient gölge kullanılıyor.
export function getCardSurface(colors: ThemeColors) {
  return {
    backgroundColor: colors.glassBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  } as const;
}

export const CARD_MARGIN_BOTTOM = 12;
