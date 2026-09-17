import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { LatePersonSuggestion } from '../services/proactiveSuggestions';
import { getCardSurface } from '../constants/cardStyle';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

interface Props {
  suggestion: LatePersonSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

export function LateSuggestionCard({ suggestion, onAccept, onDismiss }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const { person, lateCount } = suggestion;
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>💡</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>{t('lateSuggestionCard.message', { name: person.name, count: lateCount })}</Text>
        <View style={styles.actions}>
          <Pressable
            style={styles.acceptButton}
            onPress={onAccept}
            accessibilityRole="button"
            accessibilityLabel={t('lateSuggestionCard.accept')}
          >
            <Text style={styles.acceptButtonText}>{t('lateSuggestionCard.accept')}</Text>
          </Pressable>
          <Pressable
            style={styles.dismissButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={t('lateSuggestionCard.dismiss')}
          >
            <Text style={styles.dismissButtonText}>{t('lateSuggestionCard.dismiss')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      ...getCardSurface(colors),
      backgroundColor: colors.surfaceAlt,
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    icon: { fontSize: 20 },
    text: { fontSize: 14, fontFamily: fontFamily.body, color: colors.text, lineHeight: 20 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    acceptButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
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
