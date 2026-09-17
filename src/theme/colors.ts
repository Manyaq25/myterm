// "Kinetic Luster" renk paleti — Stitch tasarım sistemi asseti
// (assets/8b310ec7048d427f923476a908866d87) MCP JSON yanıtından ve
// styleGuidelines metninden birebir alındı, tahmin edilmedi. Marka üç
// canlı tonu birleştiriyor: Hyper Teal (primary), Vibrant Coral (secondary),
// Radiant Amber (tertiary) — Deep Abyssal Ink (#132228) zemin/metin nötrü,
// Pearl Cream Base (#F4F7F6) yüzey kanvası. Cam efekti (glassBg/glassBorder)
// buton, kart ve input bileşenlerinin ortak frosted-glass yüzeyi için.
// Karanlık mod Stitch'te üretilmedi — burada aynı canlı tonlar korunarak,
// camın koyu zemin üzerinde açık-üstüne-koyu yerine soluk-beyaz-üstüne-koyu
// olacak şekilde elle türetildi.

import type { FollowUpType } from '../types';

export type ThemeColors = {
  // Marka — Hyper Teal
  primary: string; // CTA gradyanının temel tonu (#00A896)
  primaryText: string; // Açık zeminde metin/ikon için M3-güvenli koyu teal
  onPrimary: string;
  primaryContainer: string; // primary-fixed — soluk tonal dolgu
  onPrimaryContainer: string;
  // Vurgu — Vibrant Coral
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  // Vurgu — Radiant Amber
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  // Dördüncü rozet tonu — Kinetic Luster'da yok, marka sürekliliği için korunan pembe
  rose: string;
  // Geriye dönük takma adlar (mevcut kod tabanında coral/gold olarak kullanılıyordu)
  coral: string;
  gold: string;
  // Zemin / yüzeyler
  background: string;
  surface: string;
  surfaceAlt: string;
  // Gerçek ekran export'larının arkaplanı — teal tonlu, üstten alta hafif
  // koyulaşan bir "wash" (düz Pearl Cream değil). GradientBackground bunu
  // kullanıyor.
  bgWashTop: string;
  bgWashBottom: string;
  // Cam efekti (glassmorphism) — kart/buton/input ortak yüzeyi. Değerler
  // stil kılavuzunun soyut Level 1/2 rakamları (0.72/0.88) yerine gerçek
  // ekran export'larında ölçülen bg-white/90–95 değerlerine göre.
  glassBg: string; // kart, input
  glassBgStrong: string; // yüzen sheet/floating nav
  glassBorder: string;
  glassBorderStrong: string;
  // Metin / kenarlık
  text: string;
  textMuted: string;
  border: string;
  outline: string;
  // Durum
  danger: string;
  onDanger: string;
  dangerContainer: string;
  success: string;
};

export const lightColors: ThemeColors = {
  primary: '#00A896',
  primaryText: '#006B5F',
  onPrimary: '#FFFFFF',
  primaryContainer: '#79F7E3',
  onPrimaryContainer: '#00201C',
  secondary: '#FF6B4A',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFDAD2',
  onSecondaryContainer: '#3D0600',
  tertiary: '#FFB800',
  onTertiary: '#3F2B00',
  tertiaryContainer: '#FFDEA8',
  onTertiaryContainer: '#3F2B00',
  rose: '#E0246E',
  coral: '#FF6B4A',
  gold: '#FFB800',
  background: '#F4F7F6', // Pearl Cream Base
  surface: '#FFFFFF',
  surfaceAlt: '#E6F6FF',
  bgWashTop: '#F0F9FA',
  bgWashBottom: '#E8F5F5',
  glassBg: 'rgba(255, 255, 255, 0.92)',
  glassBgStrong: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(255, 255, 255, 0.8)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.95)',
  text: '#132228', // Deep Abyssal Ink
  textMuted: 'rgba(19, 34, 40, 0.62)',
  border: 'rgba(19, 34, 40, 0.08)',
  outline: '#6C7A76',
  danger: '#BA1A1A',
  onDanger: '#FFFFFF',
  dangerContainer: '#FFDAD6',
  success: '#16A34A',
};

export const darkColors: ThemeColors = {
  primary: '#59DBC7',
  primaryText: '#79F7E3',
  onPrimary: '#00201C',
  primaryContainer: '#005047',
  onPrimaryContainer: '#79F7E3',
  secondary: '#FFB4A3',
  onSecondary: '#640F00',
  secondaryContainer: '#8C1900',
  onSecondaryContainer: '#FFDAD2',
  tertiary: '#FFBA20',
  onTertiary: '#3F2B00',
  tertiaryContainer: '#5E4200',
  onTertiaryContainer: '#FFDEA8',
  rose: '#F0699B',
  coral: '#FFB4A3',
  gold: '#FFBA20',
  background: '#0B1614',
  surface: '#132228',
  surfaceAlt: '#1A2C31',
  bgWashTop: '#0E1C1A',
  bgWashBottom: '#0B1614',
  glassBg: 'rgba(255, 255, 255, 0.07)',
  glassBgStrong: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.14)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.22)',
  text: '#E3F3FC',
  textMuted: 'rgba(227, 243, 252, 0.64)',
  border: 'rgba(227, 243, 252, 0.14)',
  outline: '#8A9A97',
  danger: '#FFB4AB',
  onDanger: '#690005',
  dangerContainer: '#93000A',
  success: '#4ADE80',
};

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getTypeColor(type: FollowUpType, colors: ThemeColors): string {
  switch (type) {
    case 'promise_made':
      return colors.rose;
    case 'promise_expected':
      return colors.secondary;
    case 'task':
      return colors.primary;
    case 'waiting_on':
      return colors.tertiary;
  }
}
