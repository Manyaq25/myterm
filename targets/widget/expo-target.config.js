/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'TakipWidget',
  displayName: 'Synvia AI',
  // EAS kimlik bilgileri için app.json → extra.eas.build.experimental.ios.appExtensions ile aynı olmalı.
  bundleIdentifier: 'com.manyaq25.benimyerimetakipet.widget',
  colors: {
    $accent: '#00A896',
  },
  deploymentTarget: '17.0',
  entitlements: {
    // app.json'daki ios.entitlements ile aynı App Group — ana uygulama ile
    // widget arasında veri paylaşımı için (bkz. src/services/widget.ts).
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
