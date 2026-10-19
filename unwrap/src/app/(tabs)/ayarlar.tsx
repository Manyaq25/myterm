// Ayarlar: abonelik (iki dokunuşta iptal), veri silme, değerlendirme.
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { config } from '@/lib/config';
import { isPro, managementUrl, restore } from '@/lib/purchases';
import { deleteAllAnalyses, deleteCoachHistory } from '@/lib/store';
import { colors, fonts, space, type } from '@/theme';

function Row({ title, subtitle, onPress, danger }: { title: string; subtitle?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card>
        <Text style={[type.title, { color: danger ? colors.primary : colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[type.bodySm, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </Card>
    </Pressable>
  );
}

export default function Ayarlar() {
  const [pro, setPro] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      isPro().then(setPro);
    }, []),
  );

  const manage = async () => Linking.openURL(await managementUrl());

  const restorePurchases = async () => {
    try {
      const ok = await restore();
      setPro(ok);
      Alert.alert(ok ? 'Abonelik geri yüklendi' : 'Abonelik bulunamadı', ok ? 'Unwrap Pro açık.' : 'Bu mağaza hesabında etkin bir abonelik yok.');
    } catch {
      Alert.alert('Geri yüklenemedi', 'Birazdan tekrar dener misin?');
    }
  };

  const confirmDelete = () =>
    Alert.alert('Tüm analizler silinsin mi?', 'Yüklediğin bütün sohbetler, raporlar ve Mila konuşmaları bu telefondan kalıcı olarak silinir.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteAllAnalyses() },
    ]);

  const confirmDeleteCoach = () =>
    Alert.alert('Mila konuşmaları silinsin mi?', 'Sohbetlerin ve raporların kalır; yalnız Mila ile yazışmalar silinir.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteCoachHistory() },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ayarlar</Text>

        <Text style={styles.section}>ABONELİK</Text>
        {pro ? (
          <Row title="Aboneliği yönet" subtitle="Unwrap Pro açık · İptal ve plan değişikliği mağaza ayarlarında" onPress={manage} />
        ) : (
          <Row title="Unwrap Pro’ya geç" subtitle="Ücretsiz denemeyle başla, istediğin an iptal et" onPress={() => router.push('/pro')} />
        )}
        <Row title="Satın alımları geri yükle" subtitle="Telefon değiştirdiysen aboneliğini buradan getir" onPress={restorePurchases} />

        <Text style={styles.section}>VERİ YÖNETİMİ</Text>
        <Row title="Mila konuşmalarını sil" subtitle="Koçla yaptığın tüm yazışmalar" onPress={confirmDeleteCoach} danger />
        <Row title="Tüm analizleri sil" subtitle="Yüklenen tüm WhatsApp ve Telegram dökümleri" onPress={confirmDelete} danger />
        <Card>
          <Text style={[type.bodySm, { color: colors.textMuted }]}>
            Sohbetlerin yalnız bu telefonda saklanır. Pro analizde, kişisel bilgiler (telefon, IBAN, e-posta) gizlenerek
            seçilmiş mesajlar yapay zekâya gönderilir ve orada saklanmaz.
          </Text>
        </Card>

        <Text style={styles.section}>DİĞER</Text>
        <Card>
          <Text style={[type.title, { color: colors.text }]}>Uygulamayı değerlendir</Text>
          <Text style={[type.body, { color: colors.textMuted }]}>⭐⭐⭐⭐⭐  – –</Text>
        </Card>
        {config.privacyUrl ? <Row title="Gizlilik politikası" onPress={() => WebBrowser.openBrowserAsync(config.privacyUrl)} /> : null}
        <Row title="Kullanım koşulları" onPress={() => WebBrowser.openBrowserAsync(config.termsUrl)} />

        <View style={{ alignItems: 'center', marginTop: space.lg }}>
          <Text style={[type.caption, { color: colors.textMuted }]}>Unwrap {Constants.expoConfig?.version}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text },
  section: { fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1, color: colors.primary, marginTop: space.md },
});
