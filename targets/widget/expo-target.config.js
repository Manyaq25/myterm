/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'TakipWidget',
  displayName: 'Benim Yerime Takip Et',
  colors: {
    $accent: '#2563eb',
  },
  deploymentTarget: '17.0',
  entitlements: {
    // app.json'daki ios.entitlements ile aynı App Group — ana uygulama ile
    // widget arasında özet veri paylaşımı için (bkz. src/services/widget.ts).
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
