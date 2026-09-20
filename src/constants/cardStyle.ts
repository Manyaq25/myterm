import { Platform } from 'react-native';
import type { ThemeColors } from '../theme/colors';

// "Kinetic Luster" spesifikasyonunun "Surface Glass Level 1" kartı —
// gerçek arkaplan bulanıklığı yerine (statik ekranlarda görsel fark az,
// BlurView her çağrı yerini sarmalamayı gerektirir) donuk camsı yüzey
// (glassBg/glassBorder) + spesifikasyondaki ambient gölge kullanılıyor.
//
// Android'in `elevation` gölgesi `shadowColor`'ı yok sayıp kendi sert,
// köşeleri yuvarlamayan gri kutusunu çiziyor — koyu temada bu, kartın
// üzerindeki metinlerle çakışan görünür bir dikdörtgen olarak ortaya
// çıkıyordu. Android'de gölgeyi tamamen kapatıp sadece kenarlıkla
// bırakıyoruz; iOS'ta yumuşak gölge kalıyor.
export function getCardSurface(colors: ThemeColors) {
  return {
    backgroundColor: colors.glassBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...Platform.select({
      ios: {
        shadowColor: colors.text,
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      default: { elevation: 0 },
    }),
  } as const;
}

export const CARD_MARGIN_BOTTOM = 12;
