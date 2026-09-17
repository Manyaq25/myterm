import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './colors';
import { fontFamily, fontSize, letterSpacing } from './typography';

export { getTypeColor, hexToRgba, type ThemeColors } from './colors';
export { fontFamily, fontSize, letterSpacing };

export type Theme = {
  colors: ThemeColors;
  isDark: boolean;
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
