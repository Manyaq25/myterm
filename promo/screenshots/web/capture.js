const { chromium } = require('/home/user/myterm/promo/store-assets/node_modules/playwright');
// Uygulamanın web sürümünü telefon boyutunda açıp her dilde 8 ekranı çeker.
// Önce: ./build-web.sh (web derlemesi) ve node serve.js <dist> (8099 portu).
// Kullanım: node capture.js <dil> [ekran-öneki]
const C = require('./content.js');
const at = (y, m, d, h, mi) => new Date(y, m - 1, d, h, mi).getTime();
const q = (s) => "'" + s.replace(/'/g, "''") + "'";
function seed(c) {
  const now = Date.now(), day = 864e5;
  const rows = [['f1', c.items[0], 'promise_made', at(2026,9,8,12,0)], ['f2', c.items[1], 'promise_made', at(2026,9,14,10,0)], ['f3', c.items[2], 'promise_made', at(2026,10,6,15,45)], ['f4', c.items[3], 'waiting_on', at(2026,10,10,18,0)]];
  let s = `INSERT OR IGNORE INTO people (id,name,phone,createdAt) VALUES ('p1',${q(c.person)},'${c.phone}',${now});`;
  for (const [id,t,ty,due] of rows) s += `INSERT OR IGNORE INTO follow_ups (id,title,type,status,personId,dueAt,remindAt,source,createdAt,updatedAt) VALUES ('${id}',${q(t)},'${ty}','open','p1',${due},${due},'screenshot',${now-30*day},${now});`;
  s += `INSERT OR IGNORE INTO follow_ups (id,title,type,status,personId,dueAt,source,createdAt,updatedAt,completedAt) VALUES ('f5',${q(c.items[0])},'promise_made','done','p1',${at(2026,10,7,20,38)},'screenshot',${now-40*day},${now},${at(2026,10,7,20,38)});`;
  return s;
}
function chatHTML(ch) {
  const b = ch.msgs.map(([d, t], i) => `<div class="m ${d}">${t}<span>10:${String(10 + (i * 3) % 40).padStart(2, '0')}</span></div>`).join('');
  return `<html><body dir="${ch.rtl ? 'rtl' : 'ltr'}" style="margin:0;width:390px;height:844px;background:#0b141a;font-family:sans-serif;color:#e9edef">
  <div style="height:56px;background:#202c33;display:flex;align-items:center;gap:10px;padding:0 12px;font-weight:600"><div style="width:34px;height:34px;border-radius:50%;background:#6b7c85;display:flex;align-items:center;justify-content:center">${ch.name[0]}</div>${ch.name}</div>
  <div style="text-align:center;margin:10px"><span style="background:#182229;font-size:12px;padding:4px 10px;border-radius:8px;color:#8696a0">${ch.date}</span></div>
  <style>.m{max-width:72%;margin:6px 10px;padding:7px 10px 16px;border-radius:8px;font-size:14px;line-height:1.3;position:relative;clear:both}.m span{position:absolute;right:8px;bottom:3px;font-size:10px;color:#8696a0}.in{background:#202c33;float:left}.out{background:#005c4b;float:right}</style>${b}</body></html>`;
}
// El yazısı notların hedefleri: ekrandaki öğe (uygulama metniyle bulunur), hedef noktası ve etiketin hedefe göre konumu.
// pick(r): r = öğenin kutusu (CSS px) → { t: [x,y] hedef, l: [x,y] etiket merkezi }
function noteSpecs(c, L) {
  const tx = (k) => k.split('.').reduce((o, x) => o[x], L).replace('{{count}}', '4').replace(/^[^\p{L}]+/u, '').trim();
  const R = (r) => ({ l: r.x, r: r.x + r.width, t: r.y, b: r.y + r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 });
  return [
    [{ img: 1, pick: (r) => ({ t: [r.l + 4, r.cy - 30], l: [r.l - 55, r.cy - 75] }) }, { check: 1, pick: (r) => ({ t: [r.r + 2, r.cy], l: [r.r + 230, r.cy - 45] }) }],
    [{ text: tx('home.overdueSectionTitle'), pick: (r) => ({ t: [r.r + 6, r.cy], l: [r.r + 110, r.cy] }) }, { skip: 1 }],
    [{ text: tx('aiCikar.recordAgain'), pick: (r) => ({ t: [r.r + 4, r.cy], l: [r.r + 80, r.cy] }) },
     { text: tx('aiCikar.transcriptLabel'), pick: (r) => ({ t: [r.r + 60, r.b + 20], l: [r.r + 200, r.t - 16] }) },
     { text: '12:00', last: 1, pick: (r) => ({ t: [r.cx, r.b + 4], l: [r.cx + 70, r.b + 78] }) }],
    [{ text: c.question, pick: (r) => ({ t: [r.l - 16, r.cy], l: [r.l - 70, r.cy] }) }, { text: c.answer.split('\n')[0].slice(0, 12), deep: 1, pick: (r) => ({ t: [r.cx, r.b + 18], l: [r.cx + 30, r.b + 55] }) }],
    [{ text: tx('takipDetay.snoozeHour'), pick: (r) => ({ t: [r.cx, r.b + 4], l: [r.cx + 70, r.b + 24] }) },
     { text: tx('recurrence.label'), pick: (r) => ({ t: [r.r + 6, r.cy + 6], l: [r.r + 165, r.cy - 10] }) },
     { text: tx('remindMessage.button'), pick: (r) => ({ t: [r.r + 6, r.cy], l: [r.r + 95, r.cy - 30] }) }],
    [{ text: tx('followUpCard.completeSwipe'), pick: (r) => ({ t: [r.cx, r.cy - 30], l: [r.cx + 131, r.cy - 84] }) }, { text: tx('common.delete'), pick: (r) => ({ t: [r.cx, r.cy + 30], l: [r.cx - 143, r.cy + 84] }) }],
    [{ text: 'WhatsApp', pick: (r) => ({ t: [r.cx, r.b + 8], l: [r.cx + 5, r.b + 45] }) }, { text: tx('kisiProfili.sectionOverdue'), pick: (r) => ({ t: [r.r + 6, r.cy], l: [r.r + 140, r.cy] }) }],
    [{ text: tx('yeni.labelType'), pick: (r) => ({ t: [r.r + 70, r.b + 20], l: [r.r + 170, r.cy - 24] }) }, { text: tx('yeni.labelDueAt'), pick: (r) => ({ t: [r.l + 170, r.b + 28], l: [r.l + 300, r.b + 28] }) }],
  ];
}

(async () => {
  const [lang, only] = process.argv.slice(2); const c = C[lang]; const L = require(`../../../src/i18n/locales/${lang}.json`); const specs = noteSpecs(c, L); const notePos = {}; const out = require('path').join(__dirname, '..', 'raw-web', lang);
  require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  // sohbet görseli
  const cp = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await cp.setContent(chatHTML({ ...c.chat, name: c.person, rtl: c.rtl })); const chatPng = 'data:image/png;base64,' + (await cp.screenshot()).toString('base64'); await cp.close();
  const shots = {
    '01-gorsel': { route: '/takip/ai-cikar', demo: { mode: 'image', image: { uri: chatPng, width: 780, height: 1688 }, candidates: [{ ...c.imageCand, personName: c.person, dueAtISO: '2026-09-14T10:00', confidence: 0.95, timeSpecified: true }] } },
    '02-anasayfa': { route: '/' },
    '03-sesli': { route: '/takip/ai-cikar', demo: { mode: 'voice', hasRecording: true, transcript: c.transcript, candidates: [{ ...c.voiceCand, personName: c.person2, dueAtISO: '2026-10-14T12:00', confidence: 0.92, timeSpecified: true }] } },
    '04-asistan': { route: '/asistan', ask: true },
    '05-detay': { route: '/takip/f4' },
    '06-kaydir': { route: '/', swipe: true },
    '07-kisi': { route: '/kisi/p1' },
    '08-yeni': { route: '/takip/yeni' },
  };
  for (const [name, s] of Object.entries(shots)) {
    if (only && !name.startsWith(only)) continue;
    const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: lang });
    await ctx.addInitScript(([lang, sd, demo]) => { localStorage.setItem('ss_onboardingSeen', 'true'); localStorage.setItem('ss_appLanguage', lang); globalThis.__SEED__ = sd; if (demo) globalThis.__DEMO_AI__ = demo; }, [lang, seed(c), s.demo || null]);
    // Plus Jakarta Sans'ta Kiril harfi yok; telefondaki gibi düz (sans) bir yazı tipine düşsün diye
    // aynı aile adlarına Kiril aralığı için Noto Sans eklenir (dosyalar sunucunun /_fonts klasöründe).
    await ctx.addInitScript(() => {
      const fams = { PlusJakartaSans_400Regular: 400, PlusJakartaSans_500Medium: 500, PlusJakartaSans_600SemiBold: 600, PlusJakartaSans_700Bold: 700, PlusJakartaSans_800ExtraBold: 700, SpaceGrotesk_600SemiBold: 600, SpaceGrotesk_700Bold: 700 };
      const css = Object.entries(fams).map(([f, w]) => ['cyrillic', 'cyrillic-ext'].map((sub) => `@font-face{font-family:'${f}';src:url('/_fonts/noto-sans-${sub}-${w}-normal.woff') format('woff');unicode-range:${sub === 'cyrillic' ? 'U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' : 'U+0460-052F,U+1C80-1C88,U+20B4,U+2DE0-2DFF,U+A640-A69F'};}`).join('')).join('');
      document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); });
    });
    await ctx.route('**/api/assistant', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ answer: c.answer }) }));
    const p = await ctx.newPage();
    p.on('pageerror', (e) => console.log(name, 'E', e.message.slice(0, 150)));
    await p.goto('http://localhost:8099' + s.route); await p.waitForTimeout(4500);
    if (s.ask) { const i = p.locator('input, textarea').last(); await i.fill(c.question); await i.press('Enter'); await p.waitForTimeout(2500); }
    if (s.swipe) {
      const drag = async (text, dx) => {
        const bb = await p.evaluate((t) => {
          const leaves = [...document.querySelectorAll('div')].filter((e) => e.childElementCount === 0 && e.textContent.includes(t));
          const r = leaves.length ? leaves[leaves.length - 1].getBoundingClientRect() : null;
          return r ? { y: r.y, height: r.height } : null;
        }, text);
        const x = 201, y = bb.y + bb.height / 2;
        const cdp = await ctx.newCDPSession(p);
        const t = (type, xx) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: xx, y, id: 1 }] });
        await t('touchStart', x);
        for (let i = 1; i <= 15; i++) { await t('touchMove', x + dx * i / 15); await p.waitForTimeout(25); }
        await t('touchEnd', x + dx); await p.waitForTimeout(900);
      };
      await drag(c.items[1], 110); await drag(c.items[2], -110);
    }
    await p.screenshot({ path: `${out}/${name}.png` });
    const si = Object.keys(shots).indexOf(name);
    notePos[si] = [];
    for (const sp of specs[si]) {
      if (sp.skip) { notePos[si].push(null); continue; }
      const box = await p.evaluate(({ text, img, check, last, deep }) => {
        let els;
        if (img) els = [...document.querySelectorAll('img')].filter((e) => e.src.startsWith('data:'));
        else if (check) els = [...document.querySelectorAll('div')].filter((e) => e.childElementCount === 0 && e.textContent.trim() === '✓');
        else els = [...document.querySelectorAll('div,span')].filter((e) => (deep || e.childElementCount === 0) && e.textContent.replace(/\s+/g, ' ').includes(text));
        els = els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.y >= 0 && r.y < 874 && r.x > -5 && r.x < 400; });
        if (!els.length) return null;
        const e = deep ? els.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height)[0] : last ? els[els.length - 1] : els[0];
        // metin öğesinde gerçek yazı genişliği (satır kutusu değil)
        let r = e.getBoundingClientRect();
        if (!img && e.firstChild && e.firstChild.nodeType === 3) { const rg = document.createRange(); rg.selectNodeContents(e); const rr = rg.getBoundingClientRect(); if (rr.width) r = rr; }
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }, { text: sp.text, img: sp.img, check: sp.check, last: sp.last, deep: sp.deep });
      if (!box) { console.log(name, 'not bulunamadı', sp.text || (sp.img ? 'img' : 'check')); notePos[si].push(null); continue; }
      // Arapça (sağdan sola) arayüzde kurallar aynalanır: kutu aynalanır, sonuç geri aynalanır.
      const M = c.rtl ? (x) => 402 - x : (x) => x;
      const X1 = M(box.x), X2 = M(box.x + box.width);
      const R = { l: Math.min(X1, X2), r: Math.max(X1, X2), t: box.y, b: box.y + box.height, cx: M(box.x + box.width / 2), cy: box.y + box.height / 2 };
      const { t, l } = sp.pick(R); notePos[si].push([M(l[0]), l[1], M(t[0]), t[1]].map(Math.round));
    }
    console.log('ok', name);
    await ctx.close();
  }
  if (!only) require('fs').writeFileSync(`${out}/notes.js`, `window.NOTEPOS = ${JSON.stringify(notePos)};\n`);
  else { const f = `${out}/notes.js`; let prev = {}; try { prev = JSON.parse(require('fs').readFileSync(f, 'utf8').replace(/^window.NOTEPOS = /, '').replace(/;\s*$/, '')); } catch {} require('fs').writeFileSync(f, `window.NOTEPOS = ${JSON.stringify({ ...prev, ...notePos })};\n`); }
  await b.close();
})();
