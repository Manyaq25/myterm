import { useCallback, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import { Button } from './Button';
import { TextField } from './TextField';
import { getCardSurface } from '../constants/cardStyle';
import { useTheme, fontFamily, fontSize, letterSpacing, type ThemeColors } from '../theme';
import { useIsPremium } from '../services/subscription';
import {
  fetchReferralStatus,
  inviteLink,
  redeemReferralCode,
  type RedeemError,
  type ReferralStatus,
} from '../services/referral';

const REDEEM_ERROR_KEYS: Record<RedeemError, string> = {
  invalid_code: 'invite.errorInvalid',
  own_code: 'invite.errorOwn',
  already_redeemed: 'invite.errorAlready',
  network: 'invite.errorNetwork',
};

/**
 * Ayarlar'daki "Arkadaşını davet et" bölümü. Davet ödülü yalnızca ücretsiz
 * kullanıcıya fayda sağladığı için kod paylaşma kısmı premium kullanıcılara
 * gösterilmez; başkasının kodunu girme satırı ise herkese açıktır.
 */
export function InviteSection() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t, i18n } = useTranslation();
  const isPremium = useIsPremium();
  const [status, setStatus] = useState<ReferralStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchReferralStatus().then((next) => {
        if (cancelled) return;
        setStatus(next);
        setLoadFailed(next === null);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const showInviter = !isPremium;
  const showRedeem = !status?.redeemed;
  if (!showInviter && (!showRedeem || loadFailed)) return null;

  async function handleShare() {
    if (!status) return;
    await Share.share({
      message: t('invite.shareMessage', { code: status.code, reward: status.reward, link: inviteLink(i18n.language) }),
    });
  }

  function closeModal() {
    setModalVisible(false);
    setCode('');
    setError(null);
  }

  async function handleSubmit() {
    const trimmed = code.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await redeemReferralCode(trimmed);
    setSubmitting(false);
    if (!result.ok) {
      setError(t(REDEEM_ERROR_KEYS[result.error]));
      if (result.error === 'already_redeemed') setStatus((prev) => (prev ? { ...prev, redeemed: true } : prev));
      return;
    }
    closeModal();
    setStatus((prev) => (prev ? { ...prev, redeemed: true } : prev));
    Alert.alert(t('invite.successTitle'), t('invite.successMessage', { reward: status?.reward ?? 3 }));
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('invite.sectionTitle')}</Text>

      {showInviter &&
        (status ? (
          <>
            <Text style={styles.description}>{t('invite.description', { reward: status.reward })}</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>{t('invite.yourCode')}</Text>
              <Text style={styles.code} selectable accessibilityLabel={status.code.split('').join(' ')}>
                {status.code}
              </Text>
            </View>
            <Text style={styles.meta}>
              {t('invite.progress', { count: status.rewardedInvites, max: status.maxRewardedInvites })}
              {status.bonus > 0 ? `  ·  ${t('invite.bonus', { bonus: status.bonus })}` : ''}
            </Text>
            <View style={styles.buttonWrap}>
              <Button label={t('invite.shareButton')} onPress={handleShare} accessibilityLabel={t('invite.shareButton')} />
            </View>
          </>
        ) : (
          loadFailed && <Text style={styles.description}>{t('invite.loadError')}</Text>
        ))}

      {showRedeem && status && (
        <Pressable
          style={[styles.row, showInviter && styles.rowDivider]}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('invite.enterCodeRow')}
        >
          <Text style={styles.rowLabel}>{t('invite.enterCodeRow')}</Text>
          <ChevronRight color={colors.textMuted} size={16} strokeWidth={2.2} />
        </Pressable>
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={closeModal}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>{t('invite.enterCodeTitle')}</Text>
              <Text style={styles.description}>{t('invite.enterCodeHint', { reward: status?.reward ?? 3 })}</Text>
              <TextField
                value={code}
                onChangeText={(value) => setCode(value.toUpperCase())}
                placeholder={t('invite.enterCodePlaceholder')}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                containerStyle={styles.inputWrap}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <View style={styles.modalButtons}>
                <View style={styles.flex}>
                  <Button variant="secondary" label={t('common.cancel')} onPress={closeModal} />
                </View>
                <View style={styles.flex}>
                  <Button
                    label={t('invite.submit')}
                    onPress={handleSubmit}
                    loading={submitting}
                    disabled={submitting || code.trim().length === 0}
                  />
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    section: { ...getCardSurface(colors), borderRadius: 24, padding: 18, marginBottom: 16 },
    sectionTitle: {
      fontSize: fontSize.caption,
      fontFamily: fontFamily.label,
      color: colors.primaryText,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: letterSpacing.label,
    },
    description: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.textMuted, lineHeight: 19 },
    codeBox: {
      marginTop: 14,
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
      backgroundColor: colors.primaryContainer,
    },
    codeLabel: { fontSize: fontSize.caption, fontFamily: fontFamily.bodyMedium, color: colors.onPrimaryContainer },
    code: {
      fontSize: fontSize.displaySmall,
      fontFamily: fontFamily.displaySemiBold,
      color: colors.onPrimaryContainer,
      letterSpacing: 4,
      marginTop: 2,
    },
    meta: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.textMuted, marginTop: 10, textAlign: 'center' },
    buttonWrap: { marginTop: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowDivider: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
    rowLabel: { fontSize: fontSize.base, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { width: '100%', backgroundColor: colors.surface, borderRadius: 20, padding: 20 },
    modalTitle: { fontSize: fontSize.subtitle, fontFamily: fontFamily.bodyBold, color: colors.text, marginBottom: 8 },
    inputWrap: { marginTop: 14 },
    error: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.danger, marginTop: 8 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  });
}
