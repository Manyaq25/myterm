// Prototip: src.html içindeki {{icon:ad:sınıf}} yer tutucularını tools/site/icons.json'daki SVG'lerle doldurur → index.html
const fs = require('fs');
const path = require('path');
const ICONS = require('../../tools/site/icons.json');
const src = fs.readFileSync(path.join(__dirname, 'src.html'), 'utf8');
const out = src.replace(/\{\{icon:([\w]+)(?::([^}]*))?\}\}/g, (m, name, cls = '') => {
  if (!ICONS[name]) throw new Error('icons.json içinde yok: ' + name);
  return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 -960 960 960" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
});
fs.writeFileSync(path.join(__dirname, 'index.html'), out);
console.log('wrote design/v2/index.html', (out.length / 1024).toFixed(1) + ' KB');
