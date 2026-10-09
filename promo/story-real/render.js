// Gerçek insanlı reklamın grafik bölümleri (gfx.html).
// node render.js video app out.mp4        -> uygulama ara bölümü
// node render.js video end out.mp4        -> kapanış kartı
// node render.js preview app 1.0 3.5      -> frames/app_<t>.png
// node render.js caps caps.json outdir    -> şeffaf altyazı PNG'leri
const { chromium } = require('../video/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
(async () => {
  const [mode, a1, a2, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  const open = async (q) => {
    await page.goto('file://' + path.join(__dirname, 'gfx.html') + '?' + q);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  };
  if (mode === 'caps') {
    const caps = JSON.parse(fs.readFileSync(a1, 'utf8'));
    fs.mkdirSync(a2, { recursive: true });
    for (const [i, c] of caps.entries()) {
      await open(new URLSearchParams({ seg: 'cap', who: c.who || '', text: c.text }).toString());
      await page.screenshot({ path: path.join(a2, `cap${String(i).padStart(2, '0')}.png`), omitBackground: true });
    }
  } else if (mode === 'preview') {
    await open('seg=' + a1);
    fs.mkdirSync(path.join(__dirname, 'frames'), { recursive: true });
    for (const t of [a2, ...rest].map(Number)) {
      await page.evaluate((t) => window.render(t), t);
      await page.screenshot({ path: path.join(__dirname, 'frames', `${a1}_${t.toFixed(2)}.png`) });
    }
  } else {
    await open('seg=' + a1);
    const fps = 30, n = Math.round((await page.evaluate(() => window.DURATION)) * fps);
    const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', a2], { stdio: ['pipe', 'ignore', 'ignore'] });
    for (let i = 0; i < n; i++) {
      await page.evaluate((t) => window.render(t), i / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise((r) => ff.on('close', r)); console.log('done', a2);
  }
  await browser.close();
})();
