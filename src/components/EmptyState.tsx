import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, fontFamily, type ThemeColors } from '../theme';

export function EmptyState({
  title,
  subtitle,
  icon = '🗒️',
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      paddingVertical: 60,
      alignItems: 'center',
    },
    icon: {
      fontSize: 40,
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontFamily: fontFamily.bodySemiBold,
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: fontFamily.body,
      color: colors.textMuted,
      marginTop: 6,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
  });
}
