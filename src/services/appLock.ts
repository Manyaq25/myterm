import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const SETTING_KEY = 'appLockEnabled';

export async function isAppLockEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(SETTING_KEY);
  return value === 'true';
}

async function persistEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(SETTING_KEY, enabled ? 'true' : 'false');
}

/**
 * Face ID/Touch ID/cihaz şifresiyle kimlik doğrular. Sistemin kendi cihaz
 * şifresi yedeğini (disableDeviceFallback) kasıtlı olarak KAPATMIYORUZ —
 * biyometri kullanılamazsa LocalAuthentication'ın varsayılan yedek davranışı
 * geçerli kalır.
 */
export async function authenticate(promptMessage = 'Devam etmek için kimliğini doğrula'): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'İptal',
  });
  return result.success;
}

/**
 * Uygulama kilidini açmaya çalışır — kullanıcıyı gerçek bir kimlik doğrulama
 * isteğinden geçirir (bu, aynı zamanda Face ID/Touch ID "kurulumu" görevi
 * görür). Yalnızca doğrulama başarılıysa ayar kalıcı olarak açılır.
 */
export async function enableAppLock(): Promise<boolean> {
  const success = await authenticate('Uygulama kilidini açmak için kimliğini doğrula');
  if (success) {
    await persistEnabled(true);
  }
  return success;
}

export async function disableAppLock(): Promise<void> {
  await persistEnabled(false);
}
