import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ScreenCapture from 'expo-screen-capture';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import { ensureNotificationPermission } from './notifications';

const SETTING_KEY = 'screenshotSuggestionsEnabled';

let subscription: ReturnType<typeof ScreenCapture.addScreenshotListener> | null = null;
let appStateSubscription: { remove: () => void } | null = null;
// iOS, "ekran görüntüsü alındı" native bildirimini sadece o an aktif olan
// uygulamaya gönderiyor — arka plandaki bir uygulama (kullanıcı başka bir
// uygulamadayken ekran görüntüsü aldığında) bu olayı hiç alamıyor (Apple'ın
// kasıtlı gizlilik kısıtlaması). Bu yüzden arka plana geçiş anını tutup, öne
// dönüşte galeriyi kontrol ederek yakalıyoruz.
let backgroundedAt: number | null = null;
let lastNotifiedAssetId: string | null = null;

export async function isScreenshotSuggestionEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(SETTING_KEY);
  return value === 'true';
}

/**
 * Kullanıcı bu özelliği Ayarlar'dan açtığında (opt-in) etkinleşir. Kapalıyken
 * ekran görüntüsü olayları hiç dinlenmez, hiçbir görsel otomatik taranmaz.
 */
export async function setScreenshotSuggestionEnabled(enabled: boolean): Promise<boolean> {
  if (enabled) {
    if (Platform.OS === 'android') {
      const permission = await ScreenCapture.requestPermissionsAsync();
      if (!permission.granted) return false;
    }
    const notifGranted = await ensureNotificationPermission();
    if (!notifGranted) return false;
    // Arka planda alınan ekran görüntülerini yakalamak (aşağıya bakınız) galeri
    // erişimi gerektiriyor — native listener sadece ön plandayken çalışıyor.
    const mediaPermission = await MediaLibrary.requestPermissionsAsync();
    if (!mediaPermission.granted) return false;
  }

  await SecureStore.setItemAsync(SETTING_KEY, enabled ? 'true' : 'false');
  if (enabled) {
    startListening();
  } else {
    stopListening();
  }
  return enabled;
}

export async function initScreenshotSuggestions(): Promise<void> {
  const enabled = await isScreenshotSuggestionEnabled();
  if (enabled) startListening();
}

function startListening(): void {
  if (subscription) return;
  subscription = ScreenCapture.addScreenshotListener(() => {
    void notifySuggestion();
  });
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
}

function stopListening(): void {
  subscription?.remove();
  subscription = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
  backgroundedAt = null;
}

function handleAppStateChange(nextState: AppStateStatus): void {
  if (nextState === 'active') {
    if (backgroundedAt !== null) {
      const since = backgroundedAt;
      backgroundedAt = null;
      void checkForBackgroundScreenshot(since);
    }
    return;
  }
  if (backgroundedAt === null) backgroundedAt = Date.now();
}

async function checkForBackgroundScreenshot(since: number): Promise<void> {
  const permission = await MediaLibrary.getPermissionsAsync();
  if (!permission.granted) return;
  const page = await MediaLibrary.getAssetsAsync({
    first: 1,
    mediaType: 'photo',
    sortBy: [['creationTime', false]],
  });
  const asset = page.assets[0];
  if (!asset || asset.creationTime < since || asset.id === lastNotifiedAssetId) return;
  lastNotifiedAssetId = asset.id;
  await notifySuggestion();
}

async function notifySuggestion(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('screenshot-suggestions', {
      name: 'Ekran görüntüsü önerileri',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Az önce bir ekran görüntüsü aldın',
      body: 'Bunu takip listesine eklememi ister misin? Dokun, gözden geçir.',
      data: { kind: 'screenshot-suggestion' },
      ...(Platform.OS === 'android' ? { channelId: 'screenshot-suggestions' } : {}),
    },
    trigger: null,
  });
}
