// Ayarlar: veri silme şimdiden çalışır; abonelik ve dil sonraki adımda.
import Constants from 'expo-constants';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { deleteAllAnalyses } from '@/lib/store';
import { colors, fonts, space, type } from '@/theme';

export default function Ayarlar() {
  const confirmDelete = () =>
    Alert.alert('Tüm analizler silinsin mi?', 'Yüklediğin bütün sohbetler ve kartlar bu telefondan kalıcı olarak silinir.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteAllAnalyses() },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ayarlar</Text>
        <Card>
          <Text style={[type.title, { color: colors.text }]}>Uygulamayı değerlendir</Text>
          <Text style={[type.body, { color: colors.textMuted }]}>⭐⭐⭐⭐⭐  – –</Text>
        </Card>
        <Text style={styles.section}>VERİ YÖNETİMİ</Text>
        <Pressable onPress={confirmDelete}>
          <Card>
            <Text style={[type.title, { color: colors.primary }]}>Tüm analizleri sil</Text>
            <Text style={[type.bodySm, { color: colors.textMuted }]}>Yüklenen tüm WhatsApp ve Telegram dökümleri</Text>
          </Card>
        </Pressable>
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
