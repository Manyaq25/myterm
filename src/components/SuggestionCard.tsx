import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { getCardSurface } from '../constants/cardStyle';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';
import { useFreeTrialDays } from '../services/subscription';
import type { SuggestionKind } from '../services/suggestionCards';

const INVITE_REWARD = 3;

/**
 * Tek seferlik, kapatılabilir öneri kartı (yol haritası 3a): ilk başarılı
 * çıkarımdan sonra davet + (mağazada tanımlıysa) ücretsiz deneme, 3.
 * çıkarımdan sonra premium önerisi. Reklam havası olmasın diye sade.
 */
export function SuggestionCard({ kind, onClose }: { kind: SuggestionKind; onClose: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const router = useRouter();
  const trialDays = useFreeTrialDays();

  function go(path: '/ayarlar' | '/premium') {
    onClose();
    if (path === '/ayarlar') router.navigate(path);
    else router.push(path);
  }

  const title = kind === 'first-extraction' ? t('suggestion.firstTitle') : t('suggestion.premiumTitle');

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('suggestion.closeA11y')}>
          <X color={colors.textMuted} size={18} strokeWidth={2.4} />
        </Pressable>
      </View>

      {kind === 'first-extraction' ? (
        <>
          <Text style={styles.body}>{t('suggestion.firstBody')}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.action} onPress={() => go('/ayarlar')} accessibilityRole="button">
              <Text style={styles.actionText}>{t('suggestion.inviteAction', { reward: INVITE_REWARD })}</Text>
            </Pressable>
            {trialDays ? (
              <Pressable style={styles.action} onPress={() => go('/premium')} accessibilityRole="button">
                <Text style={styles.actionText}>{t('suggestion.trialAction', { count: trialDays })}</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.note}>{t('suggestion.settingsNote')}</Text>
        </>
      ) : (
        <>
          <Text style={styles.body}>{t('suggestion.premiumBody')}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.action} onPress={() => go('/premium')} accessibilityRole="button">
              <Text style={styles.actionText}>
                {trialDays ? t('suggestion.trialAction', { count: trialDays }) : t('suggestion.premiumAction')}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { ...getCardSurface(colors), backgroundColor: colors.surfaceAlt, marginBottom: 14 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    title: { flex: 1, fontSize: fontSize.base, fontFamily: fontFamily.bodyBold, color: colors.text },
    body: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.textMuted, lineHeight: 19, marginTop: 6 },
    actions: { gap: 8, marginTop: 12 },
    action: { backgroundColor: colors.primaryContainer, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
    actionText: { color: colors.onPrimaryContainer, fontSize: fontSize.small, fontFamily: fontFamily.bodyBold },
    note: { fontSize: fontSize.caption, fontFamily: fontFamily.body, color: colors.textMuted, marginTop: 10 },
  });
}
