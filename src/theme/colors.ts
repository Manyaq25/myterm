// "Düğüm Kimlik Sistemi" — onaylanan renk paleti. Sistem mavisi yerine çini
// esintili bir teal ana renk, sıcak gül kurusu/mercan vurguları ve altın bir
// aksan kullanıyor. Her iki mod da burada tanımlı; ekranlar doğrudan hex
// yazmak yerine useTheme() üzerinden bu tokenlara erişmeli.

import type { FollowUpType } from '../types';

export type ThemeColors = {
  primary: string;
  primarySoft: string;
  onPrimary: string;
  rose: string;
  coral: string;
  gold: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  success: string;
};

export const lightColors: ThemeColors = {
  primary: '#0E5C56', // Çini
  primarySoft: '#3E8C82', // Çini Açık
  onPrimary: '#FDFDFC',
  rose: '#A63D5D', // Gül Kurusu
  coral: '#CE7A4E', // Mercan
  gold: '#B3891F', // Bakır Altın
  background: '#EEF2F0', // Kâğıt
  surface: '#FFFFFF',
  surfaceAlt: '#E3E9E6',
  text: '#122421', // Mürekkep
  textMuted: 'rgba(18, 36, 33, 0.62)',
  border: 'rgba(18, 36, 33, 0.13)',
  danger: '#DC2626',
  success: '#16A34A',
};

export const darkColors: ThemeColors = {
  primary: '#57AB9F',
  primarySoft: '#2E5F58',
  onPrimary: '#0E1A18',
  rose: '#DD8BA1',
  coral: '#E59A71',
  gold: '#DCB245',
  background: '#0E1A18',
  surface: '#15302B',
  surfaceAlt: '#1C3B35',
  text: '#F2F5F3',
  textMuted: 'rgba(242, 245, 243, 0.64)',
  border: 'rgba(242, 245, 243, 0.14)',
  danger: '#F87171',
  success: '#4ADE80',
};

export function getTypeColor(type: FollowUpType, colors: ThemeColors): string {
  switch (type) {
    case 'promise_made':
      return colors.rose;
    case 'promise_expected':
      return colors.coral;
    case 'task':
      return colors.primary;
    case 'waiting_on':
      return colors.gold;
  }
}
