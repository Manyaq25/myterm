import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'synviaDeviceId';

let cached: Promise<string> | null = null;

function randomHex(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

function randomUuid(): string {
  const h = randomHex(32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

async function computeDeviceId(): Promise<string> {
  // Android'in uygulamaya özel cihaz kimliği uygulama silinip yeniden
  // yüklenince değişmez. Modül yerel olduğu için önce varlığını kontrol
  // ediyoruz: Metro, geç yüklenen bir modülün açılış hatasını ölümcül sayıp
  // uygulamayı kapatıyor, try/catch bunu yakalayamıyor.
  if (Platform.OS === 'android' && requireOptionalNativeModule('ExpoApplication')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const application = require('expo-application') as typeof import('expo-application');
      const androidId = application.getAndroidId();
      if (androidId) return `a:${androidId}`;
    } catch {
      // Aşağıdaki kalıcı rastgele kimliğe düş.
    }
  }

  // iOS'ta anahtar zinciri (SecureStore) uygulama silinse de korunur, bu yüzden
  // bu kimlik yeniden yüklemede de aynı kalır.
  try {
    const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (existing) return existing;
    const created = `${Platform.OS === 'ios' ? 'i' : 'x'}:${randomUuid()}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, created, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
    return created;
  } catch {
    return `t:${randomUuid()}`;
  }
}

/**
 * Sunucunun ücretsiz AI hakkını cihaz başına sayabilmesi için kullanılan,
 * kişisel bilgi içermeyen kalıcı kimlik.
 */
export function getDeviceId(): Promise<string> {
  if (!cached) cached = computeDeviceId();
  return cached;
}
