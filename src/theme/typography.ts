// Tipografi ölçeği — Fraunces (başlık) + Manrope (arayüz/gövde). Font adları
// @expo-google-fonts paketlerinin dışa aktardığı isimlerle birebir eşleşiyor
// (bkz. app/_layout.tsx içindeki useFonts çağrısı).

export const fontFamily = {
  displaySemiBold: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyExtraBold: 'Manrope_800ExtraBold',
} as const;

export const fontSize = {
  caption: 11,
  small: 13,
  base: 15,
  button: 16,
  subtitle: 18,
  title: 22,
  displaySmall: 26,
  display: 32,
} as const;
