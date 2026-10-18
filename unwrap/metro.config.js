// Unwrap'in kendi Metro ayarı. Bu dosya olmazsa Metro üst klasördeki
// Synvia ayarını bulur; iki uygulama birbirine karışmasın diye yalnız bu
// klasöre ve bu klasörün node_modules'üne bakılır.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [__dirname];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
// Üst klasördeki (Synvia) paketler hiçbir zaman kullanılmasın
const parentModules = path.resolve(__dirname, '..', 'node_modules').replace(/[/\\]/g, '[/\\\\]');
config.resolver.blockList = [new RegExp(`^${parentModules}[/\\\\].*`)];

module.exports = config;
