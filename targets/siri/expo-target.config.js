/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'app-intent',
  name: 'TakipSiri',
  displayName: 'Benim Yerime Takip Et',
  // App Intents Extension (ExtensionKit) API'si iOS 18'de tanıtıldı —
  // widget'ın 17.0 hedefinden farklı olarak burada 18.0 gerekiyor.
  deploymentTarget: '18.0',
  entitlements: {
    // app.json'daki ios.entitlements ve targets/widget ile aynı App Group —
    // özet metinleri src/services/widget.ts tarafından buraya yazılıyor.
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
