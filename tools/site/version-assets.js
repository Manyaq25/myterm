// site.css, store.js, home.css ve home.js bağlantılarına içerik özetinden bir sürüm etiketi ekler (?v=…).
// Dosya değişince adres de değişir; böylece tarayıcılar bu dosyaları uzun süre
// önbellekte tutabilir (vercel.json) ve güncellemeyi yine de hemen görür.
// build.sh en son adım olarak çalıştırır.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const web = path.join(__dirname, '../../web');
const assets = ['site.css', 'store.js', 'home.css', 'home.js'];
const hashes = Object.fromEntries(
  assets.map((f) => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(web, 'assets', f))).digest('hex').slice(0, 10)])
);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []
  );
}

for (const file of walk(web)) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  for (const [name, hash] of Object.entries(hashes)) {
    after = after.replace(new RegExp(`(/assets/${name.replace('.', '\\.')})(\\?v=[0-9a-f]+)?"`, 'g'), `$1?v=${hash}"`);
  }
  if (after !== before) fs.writeFileSync(file, after);
}
console.log('versioned', hashes);
