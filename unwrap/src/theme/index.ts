// Stitch "Warm Pastel Storytelling" tasarımından alınan renk ve yazı kuralları
// (docs/unwrap/tasarim/DESIGN.md). Ekranlarda renk/yazı boyutu doğrudan
// yazılmaz, buradan alınır.

export const colors = {
  background: '#FFF8F8',
  surface: '#FFFFFF',
  surfaceLow: '#FBF1F2',
  surfaceMid: '#F5ECED',
  surfaceHigh: '#EFE6E7',
  text: '#1E1B1C',
  textMuted: '#584140',
  outline: '#E0BFBD',
  primary: '#AE2F34',
  coral: '#FF6B6B',
  onPrimary: '#FFFFFF',
  purple: '#674BB5',
  lilac: '#E8DDFF',
  green: '#00B35C',
  mint: '#6DFE9C',
  black: '#1A1718',
  // Hikâye kartı zeminleri
  cardPeach: '#FDE3DD',
  cardLilac: '#E9E1FF',
  cardMint: '#7DF5A4',
  cardButter: '#FFF1BF',
  cardCoral: '#FFD6D2',
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 38, lineHeight: 44, letterSpacing: -1 },
  headline: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
} as const;

export const radius = { sm: 12, md: 20, lg: 28, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
