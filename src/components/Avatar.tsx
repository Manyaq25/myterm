import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, fontFamily, type ThemeColors } from '../theme';

function colorForName(name: string, palette: string[]): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const palette = useMemo(
    () => [colors.primary, colors.rose, colors.coral, colors.gold, colors.primarySoft, colors.danger, colors.success],
    [colors]
  );

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colorForName(name, palette) },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initialsForName(name)}</Text>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    circle: { alignItems: 'center', justifyContent: 'center' },
    text: { color: colors.onPrimary, fontFamily: fontFamily.bodyBold },
  });
}
