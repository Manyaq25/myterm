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
    // Android 14+ / iOS 14+ kullanıcı "sadece seçili fotoğraflar" (limited)
    // erişimi verebiliyor — bu durumda YENİ çekilen bir ekran görüntüsü hiçbir
    // zaman seçili küme içinde olmadığı için getAssetsAsync onu asla görmez ve
    // arka plan tespiti sessizce çalışmaz gibi görünür. Kullanıcıyı hemen "tümüne
    // izin ver" seçeneğine yönlendirmeyi deniyoruz.
    await promptFullAccessIfLimited();
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
  if (!enabled) return;
  startListening();
  // NOT: presentPermissionsPickerAsync() burada, her soğuk başlangıçta
  // otomatik çağrılıyordu — ama bu, Android'in sistem Ayarlar'ından
  // kullanıcının manuel olarak "Tümüne her zaman izin ver" seçimini bile her
  // açılışta "sınırlı"ya geri döndürüyor gibi görünüyor (gerçek cihazda
  // gözlemlendi). Bu yüzden buradan kaldırıldı — artık sadece kullanıcı
  // özelliği Ayarlar'dan açtığı anda (setScreenshotSuggestionEnabled içinde,
  // tek seferlik, açık bir kullanıcı eylemine bağlı olarak) tetikleniyor.
}

async function promptFullAccessIfLimited(): Promise<void> {
  try {
    const permission = await MediaLibrary.getPermissionsAsync();
    if (permission.granted && permission.accessPrivileges === 'limited') {
      await MediaLibrary.presentPermissionsPickerAsync(['photo']);
    }
  } catch {
    // Seçici bu platformda/sürümde yoksa sessizce geç.
  }
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
  if (backgroundedAt === null) {
    backgroundedAt = Date.now();
    void debugNotify('arka plana geçti', `t=${backgroundedAt}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Uygulama ön plana döndüğü anda Android'in ekran görüntüsünü MediaStore'a
// işlemesi henüz tamamlanmamış olabilir (birkaç yüz ms'lik bir gecikme) —
// tek seferlik kontrol bunu kaçırabiliyordu. Kısa aralıklarla birkaç kez
// deniyoruz.
const RETRY_DELAYS_MS = [0, 400, 900, 1500];

// Android'de MediaStore'un DATE_MODIFIED kolonu saniye hassasiyetinde
// (alt saniye bilgisi atılıyor) — yani bir asset'in modificationTime'ı
// gerçek yazılma anından ~999ms öncesine kadar "yuvarlanmış" görünebilir.
// Uygulama arka plana geçip aynı saniye içinde ekran görüntüsü alınırsa
// (çok olası — hızlı bir uygulama değişimi) bu yuvarlama, taze görüntüyü
// "since'den eski" gibi gösterip kaçırmamıza neden oluyordu. Karşılaştırmayı
// bu kadarlık bir tolerans payıyla yapıyoruz.
const TIMESTAMP_ROUNDING_BUFFER_MS = 1500;

// GEÇİCİ TEŞHİS MODU: arka plan tespiti hâlâ tutarsız çalıştığı için, gerçek
// cihazda hangi adımda koptuğunu görmeden tahmin etmeyi bırakıyoruz. Bu bayrak
// açıkken her arka plandan dönüşte bir "debug" bildirimi gönderilir. Kök neden
// bulununca bu bloğu ve DEBUG_DIAGNOSTICS'i kaldır.
const DEBUG_DIAGNOSTICS = true;

async function debugNotify(title: string, body: string): Promise<void> {
  if (!DEBUG_DIAGNOSTICS) return;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('screenshot-debug', {
        name: 'Teşhis (geçici)',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `[debug] ${title}`,
        body,
        ...(Platform.OS === 'android' ? { channelId: 'screenshot-debug' } : {}),
      },
      trigger: null,
    });
  } catch {
    // Teşhis bildirimi başarısız olsa bile asıl akışı bozmasın.
  }
}

async function checkForBackgroundScreenshot(since: number): Promise<void> {
  await debugNotify(
    'arka plandan döndü',
    `since=${since} (${new Date(since).toLocaleTimeString()})`
  );

  const permission = await MediaLibrary.getPermissionsAsync();
  await debugNotify(
    'izin durumu',
    `granted=${permission.granted} access=${permission.accessPrivileges} status=${permission.status}`
  );
  if (!permission.granted) return;

  // Erişim "all" olsa bile mediaType:'photo' filtreli sorgular boş dönüyordu
  // (bkz. denemeler) — bu, sadece "yeni dosya görünmüyor" değil, filtrenin
  // kendisiyle veya bu cihazın galerisiyle ilgili daha temel bir şey olabilir.
  // Filtre olmadan ve mediaType'ı loglayarak bir sondaj atıyoruz.
  try {
    const probe = await MediaLibrary.getAssetsAsync({ first: 5 });
    const types = probe.assets.map((a) => a.mediaType).join(',') || '-';
    await debugNotify('galeri sondaj', `total=${probe.totalCount} found=${probe.assets.length} types=${types}`);
  } catch (e) {
    await debugNotify('galeri sondaj hata', String(e));
  }

  const threshold = since - TIMESTAMP_ROUNDING_BUFFER_MS;
  await debugNotify('eşik', `threshold=${threshold}`);
  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    const delay = RETRY_DELAYS_MS[i];
    if (delay > 0) await sleep(delay);
    const page = await MediaLibrary.getAssetsAsync({
      first: 1,
      mediaType: 'photo',
      // Android'de ekran görüntülerinin creationTime'ı (MediaStore DATE_TAKEN,
      // kameranın EXIF "çekilme tarihi"ne dayanır) genelde hiç dolmuyor/0
      // kalıyor — ekran görüntüsü kamerayla çekilmediği için. modificationTime
      // (dosyanın diske yazıldığı an) her iki platformda da güvenilir.
      sortBy: [['modificationTime', false]],
    });
    const asset = page.assets[0];
    if (!asset) {
      await debugNotify(`deneme #${i}`, 'hiç asset yok');
      continue;
    }
    const isSame = asset.id === lastNotifiedAssetId;
    const isOld = asset.modificationTime < threshold;
    await debugNotify(
      `deneme #${i}`,
      `mod=${asset.modificationTime} old=${isOld} same=${isSame} id=${asset.id.slice(0, 8)}`
    );
    if (isSame || isOld) continue;
    lastNotifiedAssetId = asset.id;
    await debugNotify('EŞLEŞTİ ✅', `id=${asset.id.slice(0, 8)}`);
    await notifySuggestion();
    return;
  }
  await debugNotify('eşleşme yok ❌', 'tüm denemeler tükendi');
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
