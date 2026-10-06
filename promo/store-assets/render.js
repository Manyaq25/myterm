// App Store başlık (header) ve arama sonucu görselleri.
//   node render.js still  <header|search> <tr|en> [t]   -> out/<kind>-<lang>.png
//   node render.js video  <header|search> <tr|en>       -> out/<kind>-<lang>.mp4
// Çözünürlük Apple ölçüleri: başlık 3840x1646 (21:9), arama 3840x2560 (3:2).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SIZES = { header: { w: 1920, h: 823 }, search: { w: 1920, h: 1280 } };

(async () => {
  const [mode, kind, lang, tArg] = process.argv.slice(2);
  const size = SIZES[kind];
  if (!size || !['still', 'video'].includes(mode)) throw new Error('usage: render.js still|video header|search tr|en');
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  const browser = await chromium.launch({
    // Ortamdaki önceden kurulu Chromium (Playwright sürümü farklı olsa da çalışır).
    executablePath: fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined,
    args: ['--allow-file-access-from-files'],
  });
  const page = await browser.newPage({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 2 });
  await page.goto(`file://${path.join(__dirname, 'assets.html')}?kind=${kind}&lang=${lang}`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  });

  if (mode === 'still') {
    const t = Number(tArg ?? 0);
    await page.evaluate((t) => window.render(t), t);
    const out = path.join(__dirname, 'out', `${kind}-${lang}${tArg ? `-${t}` : ''}.png`);
    await page.screenshot({ path: out, type: 'png' });
    console.log('wrote', out);
  } else {
    const fps = 30;
    const dur = await page.evaluate(() => window.DURATION);
    const n = Math.round(dur * fps);
    const out = path.join(__dirname, 'out', `${kind}-${lang}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out],
      { stdio: ['pipe', 'ignore', 'inherit'] });
    for (let i = 0; i < n; i++) {
      await page.evaluate((t) => window.render(t), i / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 60 === 0) console.log(`frame ${i}/${n}`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    console.log('wrote', out);
  }
  await browser.close();
})();
