import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { ensureNotificationPermission } from '../../src/services/notifications';
import {
  isScreenshotSuggestionEnabled,
  setScreenshotSuggestionEnabled,
} from '../../src/services/screenshotSuggestion';

export default function AyarlarScreen() {
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [screenshotSuggestionsOn, setScreenshotSuggestionsOn] = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then((res) => setNotificationsGranted(res.granted));
    isScreenshotSuggestionEnabled().then(setScreenshotSuggestionsOn);
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
        <Text style={styles.sectionTitle}>Hakkında</Text>
        <Text style={styles.hint}>Benim Yerime Takip Et — v0.1 (MVP)</Text>
        <Text style={styles.hint}>
          Uygulama kilidi (Face ID) sonraki fazlarda eklenecek.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 15, color: '#111827' },
  hint: { fontSize: 13, color: '#9ca3af', marginTop: 8 },
});
