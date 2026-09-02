import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import { ensureNotificationPermission } from '../../src/services/notifications';
import {
  isScreenshotSuggestionEnabled,
  setScreenshotSuggestionEnabled,
} from '../../src/services/screenshotSuggestion';
import { disableAppLock, enableAppLock, isAppLockEnabled } from '../../src/services/appLock';
import { deleteAllData, exportAllData } from '../../src/services/dataExport';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../../src/theme';

export default function AyarlarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [screenshotSuggestionsOn, setScreenshotSuggestionsOn] = useState(false);
  const [appLockOn, setAppLockOn] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportAllData(db);
    } catch (e) {
      Alert.alert('Hata', 'Verilerin dışa aktarılamadı. Lütfen tekrar dene.');
    } finally {
      setExporting(false);
    }
  }

  function handleDeleteAll() {
    if (deleting) return;
    Alert.alert(
      'Hesabımı ve tüm verilerimi sil',
      'Tüm kişiler, takipler ve hatırlatıcılar bu cihazdan kalıcı olarak silinecek. Bu işlem GERİ ALINAMAZ. Devam etmeden önce verilerini dışa aktarmanı öneririz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kalıcı olarak sil',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAllData(db);
              router.replace('/onboarding');
            } catch (e) {
              Alert.alert('Hata', 'Veriler silinirken bir sorun oluştu.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  useEffect(() => {
    Notifications.getPermissionsAsync().then((res) => setNotificationsGranted(res.granted));
    isScreenshotSuggestionEnabled().then(setScreenshotSuggestionsOn);
    isAppLockEnabled().then(setAppLockOn);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            accessibilityLabel="Hatırlatma bildirimleri"
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
                Alert.alert('İzin gerekli', 'Bu özellik için bildirim izni ve galeri izni gerekiyor.');
              }
            }}
            accessibilityLabel="Ekran görüntüsü önerisi"
          />
        </View>
        <Text style={styles.hint}>
          Açarsan, ekran görüntüsü aldığında (uygulama açıkken veya başka bir uygulamadan
          buraya döndüğünde) sana bir bildirimle sorarız — "takip listesine eklememi ister
          misin?". Sadece "evet" dersen o görsel gözden geçirmen için açılır; onaylamadan
          hiçbir görsel otomatik taranmaz veya AI'ya gönderilmez.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veri</Text>
        <Pressable
          style={styles.dataButton}
          onPress={handleExport}
          disabled={exporting}
          accessibilityRole="button"
          accessibilityLabel="Verilerimi Dışa Aktar"
          accessibilityState={{ disabled: exporting, busy: exporting }}
        >
          {exporting ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.dataButtonText}>Verilerimi Dışa Aktar</Text>
          )}
        </Pressable>
        <Text style={styles.hint}>
          Tüm kişilerini, takiplerini ve notlarını okunabilir bir JSON dosyası olarak
          telefonundaki paylaşım sayfası üzerinden (AirDrop, Dosyalar, e-posta vb.) kaydedebilirsin.
        </Text>

        <Pressable
          style={[styles.dataButton, styles.dangerButton]}
          onPress={handleDeleteAll}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel="Hesabımı ve Tüm Verilerimi Sil"
          accessibilityState={{ disabled: deleting, busy: deleting }}
        >
          {deleting ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <Text style={[styles.dataButtonText, styles.dangerButtonText]}>
              Hesabımı ve Tüm Verilerimi Sil
            </Text>
          )}
        </Pressable>
        <Text style={styles.hint}>
          Bu cihazdaki tüm kişi ve takip verilerini kalıcı olarak siler. Geri alınamaz.
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
            accessibilityLabel="Uygulama Kilidi"
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
          Synvia AI, kimseye verdiğin sözleri ve birinden beklediğin şeyleri unutmaman
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

        <Text style={styles.aboutVersion}>Synvia AI — v0.1 (MVP)</Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      shadowColor: colors.text,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    sectionTitle: {
      fontSize: fontSize.caption,
      fontFamily: fontFamily.bodyBold,
      color: colors.textMuted,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLabel: { fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.text },
    hint: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.textMuted, marginTop: 8, lineHeight: 18 },
    dataButton: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    dataButtonText: { color: colors.primary, fontSize: fontSize.small, fontFamily: fontFamily.bodyBold },
    dangerButton: { backgroundColor: colors.surfaceAlt },
    dangerButtonText: { color: colors.danger },
    aboutText: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.textMuted, lineHeight: 19, marginBottom: 12 },
    aboutLabel: { fontSize: fontSize.caption, fontFamily: fontFamily.bodyBold, color: colors.text, marginBottom: 4 },
    aboutVersion: { fontSize: fontSize.caption, fontFamily: fontFamily.body, color: colors.textMuted, marginTop: 4 },
  });
}
