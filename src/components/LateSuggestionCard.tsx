import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LatePersonSuggestion } from '../services/proactiveSuggestions';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

interface Props {
  suggestion: LatePersonSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

export function LateSuggestionCard({ suggestion, onAccept, onDismiss }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { person, lateCount } = suggestion;
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>💡</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>
          <Text style={styles.bold}>{person.name}</Text>'ten beklediğin işler son {lateCount} seferdir gecikmiş.
          Daha erken hatırlatmamı ister misin?
        </Text>
        <View style={styles.actions}>
          <Pressable style={styles.acceptButton} onPress={onAccept} accessibilityRole="button" accessibilityLabel="Evet, daha erken hatırlat">
            <Text style={styles.acceptButtonText}>Evet, daha erken hatırlat</Text>
          </Pressable>
          <Pressable style={styles.dismissButton} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Hayır, teşekkürler">
            <Text style={styles.dismissButtonText}>Hayır, teşekkürler</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 14,
    },
    icon: { fontSize: 20 },
    text: { fontSize: 14, fontFamily: fontFamily.body, color: colors.text, lineHeight: 20 },
    bold: { fontFamily: fontFamily.bodyBold },
    actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    acceptButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    acceptButtonText: { color: colors.onPrimary, fontSize: fontSize.small, fontFamily: fontFamily.bodyBold },
    dismissButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    dismissButtonText: { color: colors.textMuted, fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold },
  });
}
