// Sentry'nin Metro ayarı: hata raporlarında kodun hangi satırının hata verdiğini
// gösterebilmek için kaynak eşleme (source map) kimliklerini pakete ekler.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
