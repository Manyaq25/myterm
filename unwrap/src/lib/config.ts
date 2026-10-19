// Uygulamanın dış bağlantıları. EXPO_PUBLIC_ değerleri derlemeye gömülür;
// buraya yalnız herkese açık bilgiler konur (gizli anahtar asla).
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://unwrap-backend.vercel.app',
  // RevenueCat'in mağazaya özel herkese açık SDK anahtarları (appl_ / goog_).
  revenueCatIosKey: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '',
  // Google Cloud proje numarası (Play Integrity). Boşsa Android kontrolü atlanır.
  playCloudProjectNumber: process.env.EXPO_PUBLIC_PLAY_CLOUD_PROJECT ?? '',
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? '',
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
};
