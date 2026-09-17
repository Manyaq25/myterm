import * as Updates from 'expo-updates';

/**
 * expo-updates varsayılan olarak yeni bir OTA güncellemesini arka planda indirip
 * ancak BİR SONRAKİ soğuk başlangıçta aktif ediyor — yani kullanıcı uygulamayı
 * bir kez kapatıp açması "indirir", aktif olması için bir kez daha kapatıp
 * açması gerekiyor (kafa karıştırıcı). Bunun yerine burada güncellemeyi
 * bulur bulmaz indirip hemen yeniden başlatıyoruz — tek kapat-aç yeterli olsun
 * diye. Expo Go'da veya updates devre dışıyken (__DEV__, yerel build) bu API'ler
 * kullanılamaz; hatayı sessizce yutuyoruz, uygulamanın açılışını hiç etkilemesin.
 */
export async function checkAndApplyUpdate(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch {
    // Güncelleme kontrolü kritik değil — ağ yoksa veya bir hata olursa
    // kullanıcı mevcut sürümle devam eder.
  }
}
