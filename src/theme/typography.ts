// Tipografi ölçeği — Stitch "Kinetic Luster" tasarım sistemine göre: Plus
// Jakarta Sans (başlık + gövde), Space Grotesk (etiket/buton/rozet/sayaç —
// spesifikasyondaki "structural, tech-forward contrast" rolü). Font adları
// @expo-google-fonts paketlerinin dışa aktardığı isimlerle birebir eşleşiyor
// (bkz. app/_layout.tsx içindeki useFonts çağrısı).

export const fontFamily = {
  displaySemiBold: 'PlusJakartaSans_700Bold', // headline-md/lg (700)
  displayMedium: 'PlusJakartaSans_600SemiBold', // headline-sm (600)
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  bodyExtraBold: 'PlusJakartaSans_800ExtraBold',
  label: 'SpaceGrotesk_600SemiBold', // label-lg/md — butonlar, rozetler, sayaçlar
  labelBold: 'SpaceGrotesk_700Bold', // label-sm — küçük metrikler/etiketler
} as const;

export const fontSize = {
  caption: 12, // body-sm / label-md
  small: 14, // label-lg / body-md üstü
  base: 15,
  button: 16,
  subtitle: 18, // headline-sm
  title: 22, // headline-md
  displaySmall: 28, // headline-lg
  display: 32, // display-lg-mobile
} as const;

// Başlıklarda negatif, etiketlerde pozitif harf aralığı — spesifikasyonun
// "tight negative letter spacing" / "wide label tracking" ilkesi.
export const letterSpacing = {
  display: -0.6, // ~ -0.02em @ 32px
  title: -0.4, // ~ -0.02em @ 22px
  subtitle: -0.2, // ~ -0.01em @ 18px
  label: 0.3, // ~ 0.02em @ 14px
  labelSmall: 0.5, // ~ 0.05em @ 10px
} as const;
