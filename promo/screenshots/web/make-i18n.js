// content.js'teki başlık/not metinlerini shots.html'in okuyacağı web/i18n.js'e yazar.
const C = require('./content.js');
const out = {};
for (const [k, v] of Object.entries(C)) out[k] = { caps: v.caps, notes: v.notes, rtl: !!v.rtl };
require('fs').writeFileSync(require('path').join(__dirname, 'i18n.js'), '// make-i18n.js ile üretilir, elle düzenleme\nwindow.I18N = ' + JSON.stringify(out, null, 1) + ';\n');
