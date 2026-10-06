const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');

// Android Auto Backup (telefonun Google yedeği) için kurallar. expo-secure-store'un
// kendi kuralları yalnızca SharedPreferences'ı "include" ediyor; Android'de tek bir
// include bile varsa geri kalan her şey yedekten çıkar, yani veritabanı
// (files/SQLite) yedeğe girmezdi. Burada yalnızca "exclude" kullanılıyor: her şey
// yedeklenir, sadece SecureStore hariç — onun şifre anahtarı Android Keystore'da
// kalır ve yedekle taşınmaz, geri yüklenince çözülemeyen veri olarak kalırdı.
const BACKUP_RULES = `<?xml version="1.0" encoding="utf-8"?>
<!-- Android 11 ve öncesi -->
<full-backup-content>
  <exclude domain="sharedpref" path="SecureStore.xml"/>
</full-backup-content>
`;

const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>
<!-- Android 12 ve sonrası -->
<data-extraction-rules>
  <cloud-backup>
    <exclude domain="sharedpref" path="SecureStore.xml"/>
  </cloud-backup>
  <device-transfer>
    <exclude domain="sharedpref" path="SecureStore.xml"/>
  </device-transfer>
</data-extraction-rules>
`;

module.exports = function withAndroidBackupRules(config) {
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'synvia_backup_rules.xml'), BACKUP_RULES);
      fs.writeFileSync(path.join(xmlDir, 'synvia_data_extraction_rules.xml'), DATA_EXTRACTION_RULES);
      return config;
    },
  ]);
  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    app.$['android:allowBackup'] = 'true';
    app.$['android:fullBackupContent'] = '@xml/synvia_backup_rules';
    app.$['android:dataExtractionRules'] = '@xml/synvia_data_extraction_rules';
    return config;
  });
};
