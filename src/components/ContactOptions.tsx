import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { buildContactLinks } from '../services/contact';

interface Props {
  phone: string;
  message?: string;
  compact?: boolean;
}

async function openOrAlert(url: string, failureMessage: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Hata', failureMessage);
  }
}

export function ContactOptions({ phone, message, compact }: Props) {
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
        onPress={() => openOrAlert(links.tel, 'Arama başlatılamadı.')}
      >
        <Ionicons name="call" size={size} color="#2563eb" />
        {!compact && <Text style={styles.buttonText}>Ara</Text>}
      </Pressable>
      <Pressable
        style={[styles.button, compact && styles.buttonCompact]}
        onPress={() => openOrAlert(links.sms, 'Mesaj uygulaması açılamadı.')}
      >
        <Ionicons name="chatbubble-ellipses" size={size} color="#2563eb" />
        {!compact && <Text style={styles.buttonText}>Mesaj</Text>}
      </Pressable>
      {whatsappAvailable && (
        <Pressable
          style={[styles.button, styles.whatsappButton, compact && styles.buttonCompact]}
          onPress={() => openOrAlert(links.whatsapp, 'WhatsApp açılamadı.')}
        >
          <FontAwesome5 name="whatsapp" size={size} color="#25D366" />
          {!compact && <Text style={[styles.buttonText, styles.whatsappText]}>WhatsApp</Text>}
        </Pressable>
      )}
      {telegramAvailable && (
        <Pressable
          style={[styles.button, styles.telegramButton, compact && styles.buttonCompact]}
          onPress={() => openOrAlert(links.telegram, 'Telegram açılamadı.')}
        >
          <FontAwesome5 name="telegram" size={size} color="#229ED9" />
          {!compact && <Text style={[styles.buttonText, styles.telegramText]}>Telegram</Text>}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  rowCompact: { gap: 8 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  buttonCompact: { paddingHorizontal: 10, paddingVertical: 6 },
  buttonText: { color: '#2563eb', fontSize: 13, fontWeight: '700' },
  whatsappButton: { backgroundColor: '#e8faf0' },
  whatsappText: { color: '#1a9e52' },
  telegramButton: { backgroundColor: '#e8f6fd' },
  telegramText: { color: '#1a86b8' },
});
