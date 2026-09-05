const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

// expo.android.softwareKeyboardLayoutMode only accepts "resize" | "pan" and is
// validated server-side by EAS Update, which rejects any other value even
// though the underlying AndroidManifest attribute (android:windowSoftInputMode)
// supports more values. We need "adjustNothing" (native does nothing at all;
// KeyboardAvoidingView handles the keyboard purely in JS), so this plugin sets
// the manifest attribute directly instead of going through that config field.
module.exports = function withAdjustNothingKeyboard(config) {
  return withAndroidManifest(config, (config) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    mainActivity.$['android:windowSoftInputMode'] = 'adjustNothing';
    return config;
  });
};
