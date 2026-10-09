const { withAndroidManifest } = require('@expo/config-plugins');

// expo-audio's own AndroidManifest.xml unconditionally adds
// FOREGROUND_SERVICE_MEDIA_PLAYBACK plus two foreground services:
// AudioControlsService (mediaPlayback: lock-screen playback controls) and
// AudioRecordingService (microphone: background recording). This app only
// records short voice notes while the screen is open, so neither service is
// ever started (they run only with setActiveForLockScreen /
// allowsBackgroundRecording, which we don't use). Google Play otherwise
// demands a Foreground Service declaration for a capability the app doesn't
// have.
//
// Those entries come from the library manifest and are merged in by Gradle
// after this plugin runs, so filtering them out of the app manifest has no
// effect. They have to be added with tools:node="remove" so the manifest
// merger drops them.
const REMOVE_PERMISSIONS = ['android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK'];
const REMOVE_SERVICES = [
  'expo.modules.audio.service.AudioControlsService',
  'expo.modules.audio.service.AudioRecordingService',
];

module.exports = function withoutMediaPlaybackForegroundService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$ = { ...manifest.$, 'xmlns:tools': 'http://schemas.android.com/tools' };

    const permissions = (manifest['uses-permission'] ?? []).filter(
      (entry) => !REMOVE_PERMISSIONS.includes(entry.$?.['android:name'])
    );
    for (const name of REMOVE_PERMISSIONS) {
      permissions.push({ $: { 'android:name': name, 'tools:node': 'remove' } });
    }
    manifest['uses-permission'] = permissions;

    const application = manifest.application?.[0];
    if (application) {
      const services = (application.service ?? []).filter(
        (entry) => !REMOVE_SERVICES.includes(entry.$?.['android:name'])
      );
      for (const name of REMOVE_SERVICES) {
        services.push({ $: { 'android:name': name, 'tools:node': 'remove' } });
      }
      application.service = services;
    }

    return config;
  });
};
