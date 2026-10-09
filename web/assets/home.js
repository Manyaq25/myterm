// aydinapp ana sayfası: kaydırmayla oynayan sahneler (parçacıklı A, nasıl çalışır hikâyesi, dört yol,
// yatay özellik galerisi, açılan açık bölüm, kapanış yazısı). Şablon: tools/site/home.template.html.
// Dile bağlı metinler HTML'den ve data-* özniteliklerinden okunur.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const io = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const out = (t) => 1 - Math.pow(1 - t, 3);
  const back = (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  let vw = innerWidth, vh = innerHeight, mx = -9999, my = -9999, t0 = performance.now();
  const born = performance.now();

  /* ---------- imleç ışığı + mıknatıslı düğmeler ---------- */
  const cursor = $('.cursor');
  let cx = vw / 2, cy = vh / 2;
  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (e.pointerType === 'mouse' && cursor.style.opacity !== '1') cursor.style.opacity = '1';
  }, { passive: true });
  if (fine && !reduce) {
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1), color .3s'; el.style.transform = ''; setTimeout(() => (el.style.transition = ''), 500); });
    });
  }

  /* ---------- 1. açılış: parçacıklardan "A" ---------- */
  const hero = $('#top'), cv = $('#field'), ctx = cv.getContext('2d'), hv = $('#hv');
  let P = [], CW = 0, CH = 0, dpr = 1, heroOn = true;
  const COLORS = [];
  for (let i = 0; i < 10; i++) {
    const k = i / 9, a = [89, 219, 199], b = [255, 107, 74];
    COLORS.push(`rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`);
  }
  function aPoints(n) {
    const S = 220, off = document.createElement('canvas'); off.width = off.height = S;
    const o = off.getContext('2d');
    o.strokeStyle = '#fff'; o.lineWidth = S * .06; o.lineCap = 'round'; o.lineJoin = 'round';
    o.beginPath(); o.moveTo(.30 * S, .72 * S); o.lineTo(.5 * S, .26 * S); o.lineTo(.70 * S, .72 * S); o.moveTo(.38 * S, .56 * S); o.lineTo(.62 * S, .56 * S); o.stroke();
    const d = o.getImageData(0, 0, S, S).data, edge = [], fill = [];
    const A = (x, y) => (x < 0 || y < 0 || x >= S || y >= S ? 0 : d[(y * S + x) * 4 + 3]);
    // Kenar pikselleri net bir çizgi, iç pikseller hafif bir doku verir
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (A(x, y) < 140) continue;
      (A(x - 1, y) < 140 || A(x + 1, y) < 140 || A(x, y - 1) < 140 || A(x, y + 1) < 140 ? edge : fill).push([x / S, y / S]);
    }
    const mix = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    mix(edge); mix(fill);
    const ne = Math.min(edge.length, Math.round(n * .7));
    return mix(edge.slice(0, ne).concat(fill.slice(0, n - ne)));
  }
  function buildField() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const hr = hero.getBoundingClientRect(); CW = hr.width; CH = hr.height;
    cv.width = CW * dpr; cv.height = CH * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = hv.getBoundingClientRect();
    // "A" telefonu bir çadır gibi sarar: tepesi telefonun üstünde, bacakları iki yanında
    const pr = $('.phone').getBoundingClientRect(), phoneH = pr.height || 560;
    const size = Math.min(phoneH * 1.18 / .46, CW * (vw < 900 ? 2.4 : 1.3));
    const ax = r.left - hr.left + r.width / 2, ay = pr.top - hr.top - phoneH * .1 + .23 * size;
    const n = vw < 900 ? 600 : 2000, pts = aPoints(n), dust = Math.round(n * .18);
    const old = P; P = [];
    for (let i = 0; i < n + dust; i++) {
      const prev = old[i];
      const isDust = i >= n;
      const p = prev || { x: Math.random() * CW, y: Math.random() * CH, vx: 0, vy: 0 };
      p.dust = isDust;
      if (isDust) { p.hx = Math.random() * CW; p.hy = Math.random() * CH; p.dx = (Math.random() - .5) * .25; p.dy = -Math.random() * .3 - .05; }
      else { const [u, v] = pts[i % pts.length]; p.hx = ax + (u - .5) * size; p.hy = ay + (v - .49) * size; }
      const k = isDust ? Math.random() : clamp(((p.hx - ax) / size + (p.hy - ay) / size) * 1.6 + .5);
      p.c = Math.round(k * 9);
      p.s = isDust ? Math.random() * 1.2 + .4 : Math.random() * 1.4 + 1;
      p.sx = (Math.random() - .5) * 2; p.sy = (Math.random() - .5) * 2;
      p.ph = Math.random() * 6.28; p.f = .0006 + Math.random() * .0012;
      p.al = isDust ? .25 + Math.random() * .35 : .6 + Math.random() * .4;
      P.push(p);
    }
    P.sort((a, b) => a.c - b.c);
  }
  function drawField(t) {
    const hr = hero.getBoundingClientRect();
    const sc = clamp(-hr.top / (hr.height * .85));
    const scat = out(sc) * 520;
    const lx = mx - hr.left, ly = my - hr.top, R = vw < 900 ? 90 : 140, R2 = R * R;
    const intro = reduce ? 1 : seg(t - born, 600, 1900);
    ctx.clearRect(0, 0, CW, CH);
    ctx.globalCompositeOperation = 'lighter';
    let cur = -1;
    for (const p of P) {
      let tx, ty;
      if (p.dust) {
        if (!reduce) { p.hx += p.dx; p.hy += p.dy; if (p.hy < -10) { p.hy = CH + 10; p.hx = Math.random() * CW; } if (p.hx < -10) p.hx = CW + 10; else if (p.hx > CW + 10) p.hx = -10; }
        tx = p.hx; ty = p.hy;
      } else {
        const w = reduce ? 0 : 2.5;
        tx = p.hx + Math.sin(t * p.f + p.ph) * w + p.sx * scat;
        ty = p.hy + Math.cos(t * p.f * 1.3 + p.ph) * w + p.sy * scat - sc * 120;
      }
      if (reduce) { p.x = tx; p.y = ty; }
      else {
        const dx = p.x - lx, dy = p.y - ly, d2 = dx * dx + dy * dy;
        if (d2 < R2) { const d = Math.sqrt(d2) + .1, f = (1 - d / R) * 2.4; p.vx += dx / d * f; p.vy += dy / d * f; }
        const k = p.dust ? .02 : .012 + .02 * intro;
        p.vx += (tx - p.x) * k; p.vy += (ty - p.y) * k; p.vx *= .86; p.vy *= .86; p.x += p.vx; p.y += p.vy;
      }
      if (p.c !== cur) { cur = p.c; ctx.fillStyle = COLORS[cur]; }
      ctx.globalAlpha = p.al * (1 - sc * .7);
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    ctx.globalAlpha = 1;
  }
  new IntersectionObserver(([e]) => (heroOn = e.isIntersecting)).observe(hero);

  /* telefon eğimi */
  const tilt = $('#tilt'), sheen = $('.sheen');
  let rx = 4, ry = -14;
  function tiltFrame(t) {
    let trx = 4, try_ = -14;
    if (fine && mx > -999) { trx = 4 - (my / vh - .5) * 12; try_ = -14 + (mx / vw - .5) * 26; }
    else if (!reduce) { trx = 4 + Math.sin(t * .0007) * 3; try_ = -14 + Math.sin(t * .0005) * 9; }
    rx = lerp(rx, trx, .06); ry = lerp(ry, try_, .06);
    const fl = reduce ? 0 : Math.sin(t * .0011) * 8;
    tilt.style.transform = `translateY(${fl}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    sheen.style.setProperty('--sx', `${50 + ry * 3}%`);
  }

  /* ---------- 2. sihir anı ---------- */
  const story = $('#nasil'), stage = $('#stage'), stageBox = $('#stageBox');
  const steps = $$('.step'), navBars = $$('.story-nav b');
  const chat = $('#chat'), scan = $('#scan'), ai = $('#ai'), aiRows = $$('.ai-r'), aiPct = $('#aiPct');
  const task = $('#task'), phone2 = $('#phone2'), slot = $('#slot'), slotCard = $('#slotCard');
  const lock = $('#lock'), lockD = $('#lockD'), lockT = $('#lockT'), notif = $('#notif'), acts = $('#acts'), actSpans = $$('#acts span'), draft = $('#draft');
  const msg = $('#msg'), kPerson = $('#kPerson');
  // Mesajdaki metni kelime ve harf parçalarına böl (anahtar kelime grupları HTML'de .k ile işaretli)
  (() => {
    const split = (text) => {
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
        const ws = document.createElement('span'); ws.className = 'w';
        [...w].forEach((ch) => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; ws.appendChild(c); });
        frag.appendChild(ws);
      });
      return frag;
    };
    [...msg.childNodes].forEach((n) => {
      if (n.nodeType === 3) n.replaceWith(split(n.textContent));
      else if (n.classList && n.classList.contains('k')) { const t = n.textContent; n.textContent = ''; n.appendChild(split(t)); }
    });
  })();
  const kSpans = $$('#msg .k'), chars = $$('#msg .c');
  let charData = [], stageS = 1;
  function layoutStage() {
    const b = stageBox.getBoundingClientRect();
    stageS = Math.min(b.width / 440, b.height / 660, 1.15);
    stage.style.setProperty('--s', stageS.toFixed(3));
    chars.forEach((c) => (c.style.transform = ''));
    chat.style.transform = ''; msg.style.transform = '';
    const sr = stage.getBoundingClientRect();
    const tx = 40 + 180, ty = 238 + 60;
    charData = chars.map((c) => {
      const r = c.getBoundingClientRect();
      const x = (r.left - sr.left) / stageS, y = (r.top - sr.top) / stageS;
      return { dx: tx - x + (Math.random() - .5) * 300, dy: ty - y + (Math.random() - .5) * 120, r: (Math.random() - .5) * 220, d: Math.random() * .35 };
    });
    lastP = null;
  }
  const DAYS = JSON.parse(lock.dataset.days);
  let lastP = null;
  function storyFrame() {
    const r = story.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp(-r.top / (r.height - vh));
    if (r.top === lastP) return;
    lastP = r.top;
    const si = p < .17 ? 0 : p < .42 ? 1 : p < .76 ? 2 : 3;
    steps.forEach((s, i) => s.classList.toggle('on', i === si));
    const bounds = [[0, .17], [.17, .42], [.42, .76], [.76, 1]];
    navBars.forEach((b, i) => (b.style.transform = `scaleX(${seg(p, bounds[i][0], bounds[i][1]).toFixed(3)})`));

    // A: sohbet gelir
    const a = out(seg(1 - r.top / vh, .25, .85));
    const chatOut = seg(p, .46, .56);
    chat.style.opacity = (a * (1 - chatOut)).toFixed(3);
    chat.style.transform = `translateY(${(1 - a) * 60}px) scale(${1 - chatOut * .08})`;
    $$('.bub', chat).forEach((b, i) => { const q = i === 0 ? a : out(i === 1 ? seg(p, 0, .06) : seg(p, .07, .12)); b.style.opacity = q; b.style.transform = `translateY(${(1 - q) * 14}px)`; });
    // B: tarama + vurgular
    const sc = seg(p, .17, .31);
    const mTop = 60 + msg.offsetTop - 8, mBot = mTop + msg.offsetHeight + 16;
    scan.style.top = `${lerp(mTop - 30, mBot, io(sc))}px`;
    scan.style.opacity = (sc > 0 && sc < 1 ? Math.min(1, Math.sin(sc * Math.PI) * 2) : 0).toFixed(3);
    const hlOff = 1 - seg(p, .42, .48);
    kPerson.style.setProperty('--h', (out(seg(p, .18, .22)) * hlOff).toFixed(3));
    kSpans.forEach((k) => { const g = +k.dataset.g; k.style.setProperty('--h', (out(seg(p, .21 + g * .035, .25 + g * .035)) * hlOff).toFixed(3)); });
    const aiIn = out(seg(p, .22, .26)), aiOut = seg(p, .42, .48);
    ai.style.opacity = (aiIn * (1 - aiOut)).toFixed(3);
    ai.style.transform = `translateY(${(1 - aiIn) * 30 + aiOut * 40}px)`;
    aiRows.forEach((row, i) => { const q = out(seg(p, .25 + i * .035, .29 + i * .035)); row.style.opacity = q; row.style.transform = `translateX(${(1 - q) * -16}px)`; });
    aiPct.textContent = `${Math.round(seg(p, .22, .39) * 100)}%`;
    // C: harfler dağılır, kart oluşur
    const fly = seg(p, .42, .56);
    chars.forEach((c, i) => {
      const d = charData[i]; if (!d) return;
      const q = io(seg(fly, d.d, d.d + .65));
      c.style.transform = q ? `translate(${(d.dx * q).toFixed(1)}px, ${(d.dy * q).toFixed(1)}px) rotate(${(d.r * q).toFixed(0)}deg) scale(${1 - q * .6})` : '';
      c.style.opacity = (1 - seg(q, .6, 1)).toFixed(2);
    });
    msg.style.backgroundColor = `rgba(27, 44, 41, ${1 - seg(p, .42, .47)})`;
    const cardIn = seg(p, .49, .58);
    // D: telefon yükselir, kart listeye girer
    const ph = out(seg(p, .55, .66));
    phone2.style.transform = `translateY(${((1 - ph) * 760).toFixed(1)}px)`;
    const into = io(seg(p, .64, .73));
    const sx = lerp(40, 9 + 70 + 12, into), sy = lerp(238, 20 + 9 + slot.offsetTop, into), ss = lerp(1, 258 / 360, into);
    task.style.opacity = (cardIn * (1 - seg(p, .72, .74))).toFixed(3);
    task.style.filter = `blur(${((1 - cardIn) * 14).toFixed(1)}px)`;
    task.style.transform = `translate(${sx - 40}px, ${sy - 238}px) scale(${(ss * (.9 + .1 * cardIn)).toFixed(4)})`;
    const grow = io(seg(p, .69, .74));
    slot.style.height = `${(grow * slotCard.offsetHeight).toFixed(1)}px`;
    slot.style.marginBottom = `${((grow - 1) * 10).toFixed(1)}px`;
    slotCard.style.opacity = seg(p, .72, .74).toFixed(2);
    slotCard.classList.toggle('glow', p < .8);
    // E: günler geçer, kilit ekranı, bildirim
    const lk = seg(p, .78, .81);
    lock.style.opacity = lk.toFixed(3);
    const di = p < .83 ? 0 : p < .86 ? 1 : p < .885 ? 2 : 3;
    if (lockD.textContent !== DAYS[di][0]) lockD.textContent = DAYS[di][0];
    if (lockT.textContent !== DAYS[di][1]) lockT.textContent = DAYS[di][1];
    const nf = seg(p, .885, .92);
    notif.style.opacity = Math.min(1, nf * 2).toFixed(2);
    notif.style.transform = `translateY(${((1 - back(nf)) * -150).toFixed(1)}px)`;
    const ac = out(seg(p, .91, .94));
    acts.style.opacity = ac.toFixed(2);
    acts.style.transform = `translateY(${(1 - ac) * -12}px) scale(${.96 + ac * .04})`;
    actSpans.forEach((s, i) => s.classList.toggle('hit', i === 0 && p > .975));
    const dr = out(seg(p, .94, .985));
    draft.style.opacity = dr.toFixed(2);
    draft.style.transform = `translate(${(1 - dr) * 40}px, ${(1 - dr) * 20}px) scale(${.9 + dr * .1})`;
  }

  /* ---------- 3. dört yol ---------- */
  const waysArea = $('#waysArea'), lines = $('#lines'), waysResult = $('#waysResult');
  let paths = [];
  function layoutWays() {
    $$('path', lines).forEach((p) => p.remove());
    const ar = waysArea.getBoundingClientRect(), rr = waysResult.getBoundingClientRect();
    const ex = rr.left - ar.left + rr.width / 2, ey = rr.top - ar.top - (waysResult.classList.contains('on') ? 0 : 30) + 6;
    paths = $$('.way').map((w) => {
      const r = w.getBoundingClientRect();
      const x = r.left - ar.left + r.width / 2, y = r.bottom - ar.top;
      const d = `M${x},${y} C${x},${y + (ey - y) * .55} ${ex},${y + (ey - y) * .45} ${ex},${ey}`;
      const ns = 'http://www.w3.org/2000/svg';
      const base = document.createElementNS(ns, 'path'); base.setAttribute('d', d); base.setAttribute('class', 'base');
      const pulse = document.createElementNS(ns, 'path'); pulse.setAttribute('d', d); pulse.setAttribute('class', 'pulse');
      lines.append(base, pulse);
      const len = base.getTotalLength();
      base.style.strokeDasharray = len; base.style.strokeDashoffset = len;
      return { base, len };
    });
  }
  function waysFrame() {
    const r = waysArea.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const q = seg(vh * .78 - r.top, 0, r.height * .75);
    paths.forEach(({ base, len }, i) => (base.style.strokeDashoffset = (len * (1 - seg(q, .25 + i * .04, .8 + i * .04))).toFixed(1)));
    const done = q > .86;
    waysResult.classList.toggle('on', done);
    lines.classList.toggle('done', done);
  }
  // yazı makinesi + ses dalgası
  const typed = $('#typed'), TYPE = JSON.parse(typed.dataset.lines);
  let ti = 0, tc = 0, tdir = 1;
  if (reduce) typed.textContent = TYPE[0];
  else setInterval(() => {
    const s = TYPE[ti];
    tc = Math.max(0, tc + tdir); typed.textContent = s.slice(0, tc);
    if (tc >= s.length + 18) tdir = -2;
    if (tc <= 0 && tdir < 0) { tdir = 1; ti = (ti + 1) % TYPE.length; }
  }, 55);
  const bars = $('#bars');
  for (let i = 0; i < 26; i++) { const b = document.createElement('i'); b.style.setProperty('--i', i); b.style.setProperty('--hh', `${30 + Math.abs(Math.sin(i * 1.7)) * 70}%`); bars.appendChild(b); }

  /* ---------- 4. büyük cümle ---------- */
  const big = $('#big');
  (() => {
    const nodes = [...big.childNodes], frag = document.createDocumentFragment();
    nodes.forEach((n) => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(w)); else frag.appendChild(Object.assign(document.createElement('span'), { className: 'w', textContent: w })); });
      else { n.className = 'w g'; frag.appendChild(n); }
    });
    big.textContent = ''; big.appendChild(frag);
  })();
  const bigW = $$('.w', big);
  function bigFrame() {
    const r = big.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const q = seg(vh * .85 - r.top, 0, r.height + vh * .3);
    bigW.forEach((w, i) => (w.style.opacity = (.4 + .6 * clamp(q * bigW.length * 1.25 - i)).toFixed(2)));
  }

  /* ---------- 5. yatay galeri ---------- */
  const hs = $('#ozellikler'), track = $('#track'), panels = $$('.panel'), hsBar = $('#hsBar'), hsCount = $('#hsCount');
  let hsDist = 0;
  function layoutHS() {
    hsDist = Math.max(0, track.scrollWidth - vw);
    hs.style.height = `${hsDist + vh * 1.15}px`;
  }
  function hsFrame() {
    const r = hs.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp(-r.top / (r.height - vh));
    const x = -hsDist * p;
    track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    hsBar.style.transform = `scaleX(${p.toFixed(3)})`;
    const best = Math.round(p * (panels.length - 1));
    panels.forEach((pn) => {
      const c = pn.offsetLeft + pn.offsetWidth / 2 + x - vw / 2;
      const k = clamp(c / vw, -1.2, 1.2);
      pn.style.transform = reduce ? '' : `rotateY(${(-k * 22).toFixed(2)}deg) translateZ(${(-Math.abs(k) * 120).toFixed(1)}px)`;
      pn.style.opacity = (1 - Math.abs(k) * .35).toFixed(2);
    });
    hsCount.firstChild.textContent = String(best + 1).padStart(2, '0');
  }
  // panellerdeki küçük döngüler
  const tone = $('[data-cycle="tone"]'), TONES = JSON.parse(tone.dataset.tones);
  const notifRow = $$('[data-cycle="notif"] .row span');
  const lang = $('[data-cycle="lang"]'), HELLO = ['Merhaba', 'Hello', 'Hallo', 'Hola', 'Bonjour', 'Ciao', 'Olá', 'Привет', 'مرحبا', 'こんにちは', '안녕하세요', '你好'];
  let cyc = 0;
  if (!reduce) setInterval(() => {
    cyc++;
    const ti2 = cyc % 3, tabs = $$('.tabs span', tone), m = $('.msg', tone);
    tabs.forEach((s, i) => s.classList.toggle('on', i === ti2));
    m.style.opacity = 0; setTimeout(() => { m.textContent = TONES[ti2]; m.style.opacity = 1; }, 300);
    notifRow.forEach((s, i) => s.classList.toggle('on', i === cyc % 4));
    const h = $('.hello', lang), li = cyc % HELLO.length;
    h.classList.add('out'); setTimeout(() => { h.textContent = HELLO[li]; h.classList.remove('out'); }, 350);
    $$('.codes span', lang).forEach((s, i) => s.classList.toggle('on', i === li));
  }, 2200);

  /* ---------- 6. uygulamalar: kayan dev yazı + eğilen kartlar ---------- */
  const ghost = $('#ghost'), apps = $('#uygulamalar');
  function appsFrame() {
    const r = apps.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    ghost.style.transform = `translateX(${(vw * .1 - (vh - r.top) * .35).toFixed(1)}px)`;
  }
  if (fine && !reduce) $$('.app-card').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
      c.style.transition = 'transform .15s ease-out';
      c.style.transform = `perspective(1200px) rotateX(${((.5 - v) * 8).toFixed(2)}deg) rotateY(${((u - .5) * 10).toFixed(2)}deg)`;
      c.style.setProperty('--gx', `${u * 100}%`); c.style.setProperty('--gy', `${v * 100}%`);
    });
    c.addEventListener('pointerleave', () => { c.style.transition = ''; c.style.transform = ''; });
  });

  /* ---------- 7. hakkımda: daire açılarak gelen açık bölüm ---------- */
  const about = $('#hakkimda'), aboutIn = $('#aboutIn'), rail = $('#rail');
  function aboutFrame() {
    const r = about.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh * 1.2) return;
    const q = out(seg(vh - r.top, vh * .05, vh * .85));
    aboutIn.style.setProperty('--r', `${(q * 150).toFixed(2)}%`);
  }

  /* ---------- 8. kapanış: harf harf yükselen dev yazı ---------- */
  const word = $('#word'), letters = $$('span', word);
  function layoutWord() {
    // Tek bir renk geçişi bütün kelimeye yayılsın diye her harfin arka planını kaydır
    const wl = letters[0].offsetLeft;
    letters.forEach((l) => { l.style.setProperty('--ww', `${letters.at(-1).offsetLeft + letters.at(-1).offsetWidth - wl}px`); l.style.setProperty('--ox', `${wl - l.offsetLeft}px`); });
  }
  function wordFrame() {
    const r = word.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const q = seg(vh - r.top, 0, r.height * 1.6);
    letters.forEach((l, i) => l.style.setProperty('--y', `${((1 - out(seg(q, i * .06, .5 + i * .06))) * 100).toFixed(1)}%`));
  }

  /* ---------- menü, cetvel ---------- */
  const hdr = $('#hdr'), secs = $$('[data-sec]'), railLinks = $$('a', rail), navLinks = $$('.nav a');
  function chrome() {
    hdr.classList.toggle('scrolled', scrollY > 30);
    let cur = secs[0];
    secs.forEach((s) => { if (s.getBoundingClientRect().top < vh * .5) cur = s; });
    railLinks.forEach((a) => a.classList.toggle('on', a.dataset.s === cur.id));
    navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + cur.id));
    const ar = about.getBoundingClientRect(), ai2 = aboutIn.getBoundingClientRect();
    rail.classList.toggle('light', ar.top < vh * .5 && ai2.bottom > vh * .5);
    hdr.classList.toggle('light', ai2.top < 40 && ai2.bottom > 40);
  }

  /* ---------- ana döngü ---------- */
  function layout() {
    vw = innerWidth; vh = innerHeight;
    buildField(); layoutStage(); layoutHS(); layoutWays(); layoutWord();
  }
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(layout, 150); });
  function frame(t) {
    if (heroOn && !document.hidden) { drawField(t); tiltFrame(t); }
    if (fine) { cx = lerp(cx, mx, .12); cy = lerp(cy, my, .12); cursor.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`; }
    storyFrame(); waysFrame(); bigFrame(); hsFrame(); appsFrame(); aboutFrame(); wordFrame(); chrome();
    requestAnimationFrame(frame);
  }
  const start = () => { layout(); requestAnimationFrame(frame); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else addEventListener('load', start);
})();
