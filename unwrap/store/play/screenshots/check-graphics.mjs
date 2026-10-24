// Play görsellerinin boyutunu ve PNG renk türünü denetler (bağımlılık yok, PNG başlığı okunur).
//   node store/play/screenshots/check-graphics.mjs
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../graphics');
const COLOR = { 0: 'gray', 2: 'RGB', 3: 'palette', 4: 'gray+alpha', 6: 'RGBA' };

// [dosya, genişlik, yükseklik, izinli renk türleri, en fazla bayt]
const expected = [
  ['icon-512.png', 512, 512, [6], 1024 * 1024],
  ['feature-1024x500.png', 1024, 500, [2], 15 * 1024 * 1024],
];
for (const lang of ['tr-TR', 'en-US'])
  for (let n = 1; n <= 6; n++) expected.push([`phone/${lang}/${String(n).padStart(2, '0')}.png`, 1080, 1920, [2, 6], 8 * 1024 * 1024]);

let bad = 0;
for (const [rel, w, h, types, maxBytes] of expected) {
  const file = join(out, rel);
  if (!existsSync(file)) { console.log(`✗ ${rel}: yok`); bad++; continue; }
  const b = readFileSync(file);
  const sig = b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  const W = b.readUInt32BE(16), H = b.readUInt32BE(20), depth = b[24], ct = b[25];
  const size = statSync(file).size;
  const ok = sig && W === w && H === h && types.includes(ct) && depth === 8 && size <= maxBytes;
  if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ${rel.padEnd(24)} ${W}×${H}  ${depth * (ct === 6 ? 4 : ct === 2 ? 3 : 1)}-bit ${COLOR[ct] ?? ct}  ${(size / 1024).toFixed(0)} KB`);
}
if (bad) { console.error(`\n${bad} dosyada sorun var`); process.exit(1); }
console.log(`\nTamam: ${expected.length} görsel doğru boyutta.`);
