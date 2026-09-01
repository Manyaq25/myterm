import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './colors';
import { fontFamily, fontSize } from './typography';

export { getTypeColor, type ThemeColors } from './colors';
export { fontFamily, fontSize };

export type Theme = {
  colors: ThemeColors;
  isDark: boolean;
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
