// Uygulamanın gizli olmayan yapılandırma değerleri. EAS Build bunları eas.json'daki
// `env` bölümünden alıyor, ama `eas update` o bölümü okumuyor — yalnızca
// güncellemeyi yayınlayan bilgisayardaki .env dosyalarını okuyor. Bir değer orada
// eksikse anlık güncellemeyle giden pakette tanımsız kalıyordu (iOS RevenueCat
// anahtarı böyle kaybolmuş, premium ve satın alma çalışmamıştı). Bu yüzden
// değerler burada varsayılan olarak da tutuluyor; ortam değişkeni varsa o geçerli.
//
// Hepsi istemciye zaten açık değerler: RevenueCat'in public SDK anahtarları ve
// sunucu adresi. Gizli anahtarlar asla buraya konmaz.

export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://backend-five-dun-77.vercel.app';

export const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_aqXBldWXQJYLIrxOGoUwcmBCgPE';

export const REVENUECAT_ANDROID_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_dCMHonKjqhrmyBjUFIUptAmVIuH';
