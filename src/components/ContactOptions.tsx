import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { buildContactLinks } from '../services/contact';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../theme';

interface Props {
  phone: string;
  message?: string;
  compact?: boolean;
}

async function openOrAlert(url: string, failureMessage: string, errorTitle: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(errorTitle, failureMessage);
  }
}

export function ContactOptions({ phone, message, compact }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const [whatsappAvailable, setWhatsappAvailable] = useState(false);
  const [telegramAvailable, setTelegramAvailable] = useState(false);
  const links = buildContactLinks(phone, message);

  useEffect(() => {
    let cancelled = false;
    Linking.canOpenURL(links.whatsappProbe)
      .then((ok) => !cancelled && setWhatsappAvailable(ok))
      .catch(() => !cancelled && setWhatsappAvailable(false));
    Linking.canOpenURL(links.telegramProbe)
      .then((ok) => !cancelled && setTelegramAvailable(ok))
      .catch(() => !cancelled && setTelegramAvailable(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const size = compact ? 13 : 15;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Pressable
        style={[styles.button, compact && styles.buttonCompact]}
        onPress={() => openOrAlert(links.tel, t('contactOptions.callError'), t('common.error'))}
        accessibilityRole="button"
        accessibilityLabel={t('contactOptions.call')}
      >
        <Ionicons name="call" size={size} color={colors.primary} />
        {!compact && <Text style={styles.buttonText}>{t('contactOptions.call')}</Text>}
      </Pressable>
      <Pressable
        style={[styles.button, compact && styles.buttonCompact]}
        onPress={() => openOrAlert(links.sms, t('contactOptions.messageError'), t('common.error'))}
        accessibilityRole="button"
        accessibilityLabel={t('contactOptions.message')}
      >
        <Ionicons name="chatbubble-ellipses" size={size} color={colors.primary} />
        {!compact && <Text style={styles.buttonText}>{t('contactOptions.message')}</Text>}
      </Pressable>
      {whatsappAvailable && (
        <Pressable
          style={[styles.button, styles.whatsappButton, compact && styles.buttonCompact]}
          onPress={() => openOrAlert(links.whatsapp, t('contactOptions.whatsappError'), t('common.error'))}
          accessibilityRole="button"
          accessibilityLabel={t('contactOptions.whatsappA11y')}
        >
          {/* WhatsApp brand green — official brand color, left untheme'd on purpose */}
          <FontAwesome5 name="whatsapp" size={size} color="#25D366" />
          {!compact && <Text style={[styles.buttonText, styles.whatsappText]}>WhatsApp</Text>}
        </Pressable>
      )}
      {telegramAvailable && (
        <Pressable
          style={[styles.button, styles.telegramButton, compact && styles.buttonCompact]}
          onPress={() => openOrAlert(links.telegram, t('contactOptions.telegramError'), t('common.error'))}
          accessibilityRole="button"
          accessibilityLabel={t('contactOptions.telegramA11y')}
        >
          {/* Telegram brand blue — official brand color, left untheme'd on purpose */}
          <FontAwesome5 name="telegram" size={size} color="#229ED9" />
          {!compact && <Text style={[styles.buttonText, styles.telegramText]}>Telegram</Text>}
        </Pressable>
      )}
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
    rowCompact: { gap: 8 },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    buttonCompact: { paddingHorizontal: 10, paddingVertical: 6 },
    buttonText: { color: colors.primary, fontSize: fontSize.small, fontFamily: fontFamily.bodyBold },
    whatsappButton: { backgroundColor: colors.surfaceAlt },
    whatsappText: { color: colors.success },
    telegramButton: { backgroundColor: colors.surfaceAlt },
    telegramText: { color: colors.primary },
  });
}
