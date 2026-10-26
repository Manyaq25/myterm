// iOS: expo-notifications uzaktan bildirim (push) iznini ekler; Unwrap yalnız telefonun
// kendi kurduğu yerel bildirimi (aylık hatırlatıcı) kullanır, push gerekmez. İzin kalırsa
// Apple profili de Push yeteneği ister. Bu eklenti izni kaldırır.
// Sıra önemli: app.json'da expo-notifications'tan ÖNCE durmalı (değişiklikler ters sırayla çalışır).
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPush(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};
