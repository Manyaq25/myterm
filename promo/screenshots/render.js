// Mağaza ekran görüntüleri (çerçeveli + başlıklı).
//   node render.js [tr]  -> out/appstore/<dil>-NN.png (1320x2868, App Store 6.9")
//                           out/play/<dil>-NN.png     (1080x1920, Google Play 9:16)
const { chromium } = require('../store-assets/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const SETS = { appstore: { w: 1320, h: 2868 }, 'appstore-6.3': { w: 1206, h: 2622 }, play: { w: 1080, h: 1920 } };
const COUNT = 8;

(async () => {
  const lang = process.argv[2] || 'tr';
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined,
    args: ['--allow-file-access-from-files'],
  });
  for (const [name, s] of Object.entries(SETS)) {
    const dir = path.join(__dirname, 'out', name);
    fs.mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
    for (let i = 0; i < COUNT; i++) {
      await page.goto(`file://${path.join(__dirname, 'shots.html')}?w=${s.w}&h=${s.h}&lang=${lang}&i=${i}`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => window.READY === true);
      const out = path.join(dir, `${lang}-${String(i + 1).padStart(2, '0')}.png`);
      await page.screenshot({ path: out, type: 'png' });
      console.log('wrote', out);
    }
    await page.close();
  }
  await browser.close();
})();
