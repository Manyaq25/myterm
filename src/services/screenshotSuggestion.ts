import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ScreenCapture from 'expo-screen-capture';
import * as Notifications from 'expo-notifications';
import { ensureNotificationPermission } from './notifications';

const SETTING_KEY = 'screenshotSuggestionsEnabled';

let subscription: ReturnType<typeof ScreenCapture.addScreenshotListener> | null = null;

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
}

function stopListening(): void {
  subscription?.remove();
  subscription = null;
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
