import * as Updates from 'expo-updates';

/**
 * Yeni bir OTA güncellemesi varsa arka planda indirir; güncelleme bir sonraki
 * soğuk başlangıçta (uygulama kapatılıp açılınca) devreye girer.
 *
 * Önceden indirir indirmez `Updates.reloadAsync()` ile hemen yeniden başlatıyorduk.
 * Bu, açılıştan birkaç saniye sonra JS çalışma ortamını kapatırken expo-modules-core
 * içinde (SharedObjectRegistry.clear → jsi::WeakObject) çökmeye yol açtı
 * (Sentry REACT-NATIVE-2, iOS, 1.1.1+15). O yüzden anında yeniden başlatma yok.
 * Expo Go'da veya updates devre dışıyken (__DEV__, yerel build) bu API'ler
 * kullanılamaz; hatayı sessizce yutuyoruz, uygulamanın açılışını hiç etkilemesin.
 */
export async function checkAndApplyUpdate(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;
    await Updates.fetchUpdateAsync();
  } catch {
    // Güncelleme kontrolü kritik değil — ağ yoksa veya bir hata olursa
    // kullanıcı mevcut sürümle devam eder.
  }
}
