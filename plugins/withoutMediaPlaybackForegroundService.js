const { withAndroidManifest } = require('@expo/config-plugins');

// expo-audio's own AndroidManifest.xml unconditionally adds
// FOREGROUND_SERVICE_MEDIA_PLAYBACK plus a MediaSessionService for
// background-playback notification controls, even though this app only
// ever uses expo-audio to record short voice notes (no background/media
// playback feature exists). Declaring that permission to Google Play would
// require answering their Foreground Service Permissions questionnaire for
// a capability the app doesn't actually implement, so we strip it here
// instead. FOREGROUND_SERVICE and the microphone recording service stay,
// since those are genuinely used.
module.exports = function withoutMediaPlaybackForegroundService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (entry) => entry.$?.['android:name'] !== 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK'
      );
    }

    const application = manifest.application?.[0];
    if (application && Array.isArray(application.service)) {
      application.service = application.service.filter(
        (entry) => !entry.$?.['android:name']?.endsWith('AudioControlsService')
      );
    }

    return config;
  });
};
