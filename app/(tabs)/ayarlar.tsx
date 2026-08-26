import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { ensureNotificationPermission } from '../../src/services/notifications';
import {
  isScreenshotSuggestionEnabled,
  setScreenshotSuggestionEnabled,
} from '../../src/services/screenshotSuggestion';
import { disableAppLock, enableAppLock, isAppLockEnabled } from '../../src/services/appLock';

export default function AyarlarScreen() {
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [screenshotSuggestionsOn, setScreenshotSuggestionsOn] = useState(false);
  const [appLockOn, setAppLockOn] = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then((res) => setNotificationsGranted(res.granted));
    isScreenshotSuggestionEnabled().then(setScreenshotSuggestionsOn);
    isAppLockEnabled().then(setAppLockOn);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bildirimler</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Hatırlatma bildirimleri</Text>
          <Switch
            value={notificationsGranted}
            onValueChange={async (value) => {
              if (value) {
                const granted = await ensureNotificationPermission();
                setNotificationsGranted(granted);
              } else {
                setNotificationsGranted(false);
              }
            }}
          />
        </View>
        <Text style={styles.hint}>
          Kapalıysa takiplerin için zamanı geldiğinde bildirim alamazsın.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Görsel Önerileri</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Ekran görüntüsü önerisi</Text>
          <Switch
            value={screenshotSuggestionsOn}
            onValueChange={async (value) => {
              const result = await setScreenshotSuggestionEnabled(value);
              setScreenshotSuggestionsOn(result);
              if (value && !result) {
                Alert.alert('İzin gerekli', 'Bu özellik için bildirim izni (ve Android’de galeri izni) gerekiyor.');
              }
            }}
          />
        </View>
        <Text style={styles.hint}>
          Açarsan, ekran görüntüsü aldığında sana bir bildirimle sorarız — "takip listesine
          eklememi ister misin?". Sadece "evet" dersen o görsel gözden geçirmen için açılır;
          onaylamadan hiçbir görsel otomatik taranmaz veya AI'ya gönderilmez.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Güvenlik</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Uygulama Kilidi</Text>
          <Switch
            value={appLockOn}
            onValueChange={async (value) => {
              if (value) {
                const result = await enableAppLock();
                setAppLockOn(result);
                if (!result) {
                  Alert.alert(
                    'Kilit açılamadı',
                    'Kimlik doğrulama tamamlanamadı. Cihazında Face ID/Touch ID/şifre kurulu olduğundan emin olup tekrar dener misin?'
                  );
                }
              } else {
                await disableAppLock();
                setAppLockOn(false);
              }
            }}
          />
        </View>
        <Text style={styles.hint}>
          Açarsan, uygulama her arka plandan öne geldiğinde (kapatıp açtığında,
          başka bir uygulamadan geri döndüğünde) Face ID/Touch ID veya cihaz
          şifreni ister — kişi ve takip verilerin sende kalsın diye.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hakkında</Text>
        <Text style={styles.aboutText}>
          Benim Yerime Takip Et, kimseye verdiğin sözleri ve birinden beklediğin şeyleri unutmaman
          için var — bir yapılacaklar listesi değil, bir hatırlatma ortağı.
        </Text>

        <Text style={styles.aboutLabel}>Gizlilik</Text>
        <Text style={styles.aboutText}>
          Tüm verilerin (takipler, kişiler, notlar) yalnızca bu cihazda, yerel olarak saklanır —
          bir sunucuya senkronize edilmez. Metin/sesli not/görsel çıkarımı yaptığında veya AI
          Asistan'a bir soru sorduğunda, yalnızca o an gönderdiğin içerik AI sağlayıcısına iletilir;
          başka hiçbir veri arka planda paylaşılmaz.
        </Text>

        <Text style={styles.aboutLabel}>AI sağlayıcıları</Text>
        <Text style={styles.aboutText}>
          Metin/görsel analizi ve AI Asistan için Anthropic (Claude), sesli not deşifresi için
          OpenAI (Whisper) kullanılıyor.
        </Text>

        <Text style={styles.aboutVersion}>Benim Yerime Takip Et — v0.1 (MVP)</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 15, color: '#111827' },
  hint: { fontSize: 13, color: '#9ca3af', marginTop: 8, lineHeight: 18 },
  aboutText: { fontSize: 13, color: '#4b5563', lineHeight: 19, marginBottom: 12 },
  aboutLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4 },
  aboutVersion: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
