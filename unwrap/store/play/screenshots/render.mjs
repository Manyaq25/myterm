// Unwrap Google Play görsellerini üretir (Playwright Chromium).
//   node store/play/screenshots/render.mjs            -> hepsi
//   node store/play/screenshots/render.mjs tr 3       -> yalnız tr/03
// Çıktılar: store/play/graphics/feature-1024x500.png ve phone/<tr-TR|en-US>/01..06.png
// icon-512.png assets/images/icon.png'den küçültülür (Python PIL varsa onunla, yoksa Chromium ile).
// Sonra check-graphics.mjs boyutları ve PNG renk türünü denetler.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const unwrap = resolve(here, '../../..');
const out = resolve(here, '../graphics');

// Playwright yerelde yoksa makinedeki genel kurulumu kullan (playwright install çalıştırılmaz).
async function loadChromium() {
  for (const spec of ['playwright', '/opt/node-tools/node_modules/playwright/index.mjs']) {
    try {
      return (await import(spec)).chromium;
    } catch {}
  }
  throw new Error('playwright bulunamadı');
}

const LANGS = { tr: 'tr-TR', en: 'en-US' };
const [onlyLang, onlyN] = process.argv.slice(2);

const chromium = await loadChromium();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--allow-file-access-from-files', '--font-render-hinting=none'],
});

async function shot(url, width, height, file, { omitBackground = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 15000 });
  await page.waitForTimeout(150);
  mkdirSync(dirname(file), { recursive: true });
  await page.screenshot({ path: file, omitBackground, clip: { x: 0, y: 0, width, height } });
  await page.close();
  console.log('✓', file.replace(unwrap + '/', ''));
}

if (!onlyLang) {
  // Öne çıkan görsel: alfa kanalı olmadan (24-bit) olmalı; opak arka planla çekilir, sonra RGB'ye indirilir.
  const feature = join(out, 'feature-1024x500.png');
  await shot(pathToFileURL(join(here, 'feature.html')).href, 1024, 500, feature);
  toRgb(feature);
  icon();
}

for (const [code, dir] of Object.entries(LANGS)) {
  if (onlyLang && onlyLang !== code) continue;
  for (let n = 1; n <= 6; n++) {
    if (onlyN && Number(onlyN) !== n) continue;
    const url = `${pathToFileURL(join(here, 'template.html')).href}?lang=${code}&n=${n}`;
    await shot(url, 1080, 1920, join(out, 'phone', dir, `${String(n).padStart(2, '0')}.png`));
    toRgb(join(out, 'phone', dir, `${String(n).padStart(2, '0')}.png`));
  }
}
await browser.close();

// Play ekran görüntüleri ve öne çıkan görselde alfa istenmez: PIL ile RGB'ye çevir.
function toRgb(file) {
  try {
    execFileSync('python3', ['-I', '-c', 'import sys;from PIL import Image;im=Image.open(sys.argv[1]);im.convert("RGB").save(sys.argv[1],optimize=True)', file]);
  } catch (e) {
    console.warn('! RGB dönüşümü yapılamadı (PIL yok?):', file);
  }
}

// 512×512, 32-bit (RGBA) uygulama simgesi.
function icon() {
  const src = join(unwrap, 'assets/images/icon.png');
  const dst = join(out, 'icon-512.png');
  execFileSync('python3', ['-I', '-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGBA").resize((512,512),Image.LANCZOS).save(sys.argv[2],optimize=True)', src, dst]);
  console.log('✓', dst.replace(unwrap + '/', ''));
}
