const { withAndroidManifest } = require('@expo/config-plugins');

// Google Play'in Fotoğraf ve Video İzinleri politikası: geniş fotoğraf/video
// erişimi (READ_MEDIA_IMAGES vb.) yalnızca bunu temel işlevi olarak gerektiren
// uygulamalara izinli. Android'de görseli sistemin fotoğraf seçicisiyle
// alıyoruz (izin gerekmez); galeriyi kendiliğinden tarayan "ekran görüntüsü
// önerisi" yalnızca iPhone'da var. expo-media-library ve expo-screen-capture
// bu izinleri kendi manifestlerinden eklediği için Gradle birleştirmesinde
// tools:node="remove" ile çıkarıyoruz (yalnızca süzmek etkisiz kalırdı).
const REMOVE = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.ACCESS_MEDIA_LOCATION',
  'android.permission.DETECT_SCREEN_CAPTURE',
];

module.exports = function withoutBroadMediaPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$ = { ...manifest.$, 'xmlns:tools': 'http://schemas.android.com/tools' };
    const permissions = (manifest['uses-permission'] ?? []).filter(
      (entry) => !REMOVE.includes(entry.$?.['android:name'])
    );
    for (const name of REMOVE) permissions.push({ $: { 'android:name': name, 'tools:node': 'remove' } });
    manifest['uses-permission'] = permissions;
    return config;
  });
};
