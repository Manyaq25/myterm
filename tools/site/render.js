// Sitenin görsellerini üretir: web/og.png (link önizlemesi) ve web/apple-touch-icon.png.
//   node tools/site/render.js
// Playwright, promo/store-assets'teki kurulumdan kullanılır.
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '../../promo/store-assets/node_modules/playwright'));

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const web = (f) => path.join(__dirname, '../../web', f);

(async () => {
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ['--allow-file-access-from-files'],
  });

  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.goto('file://' + path.join(__dirname, 'og.html'));
  await og.evaluate(() => document.fonts.ready);
  await og.screenshot({ path: web('og.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });

  // iOS köşeleri kendisi yuvarlar; köşeler siyah kalmasın diye arka plan dolu
  const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
  const svg = fs.readFileSync(web('favicon.svg'), 'utf8').replace('<svg ', '<svg width="180" height="180" ');
  await icon.setContent(`<body style="margin:0;background:#0B1614">${svg}</body>`);
  await icon.waitForTimeout(200);
  await icon.screenshot({ path: web('apple-touch-icon.png') });

  await browser.close();
  console.log('wrote web/og.png, web/apple-touch-icon.png');
})();
