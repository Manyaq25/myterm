// aydinapp vitrin sayfası (/ ve /en/): parçacıklı A, dönen öne çıkan kart, eğilen uygulama kartları, büyük cümle,
// açılan açık bölüm, kapanış yazısı. Şablon: tools/site/studio.template.html. Parçalar home.js'ten alındı.
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
    const pr = $('#spot').getBoundingClientRect(), phoneH = (pr.height || 500) * .9;
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

  /* öne çıkan kart: uygulamalar arasında kendiliğinden döner (apps.json'daki sıra) */
  const spot = $('#spot'), cards = $$('.spot-card', spot), icons = $$('.spot-ic', spot);
  const SPOT_MS = +spot.dataset.interval || 4200;
  let si = 0, sT = 0, sPaused = false;
  spot.style.setProperty('--dur', `${SPOT_MS}ms`);
  function showSpot(i) {
    si = (i + cards.length) % cards.length;
    cards.forEach((c, k) => { const on = k === si; c.classList.toggle('on', on); c.toggleAttribute('aria-hidden', !on); c.tabIndex = on ? 0 : -1; });
    icons.forEach((b, k) => { b.classList.remove('on'); b.setAttribute('aria-selected', k === si); });
    void spot.offsetWidth; // çubuk animasyonu baştan başlasın
    icons[si].classList.add('on');
    sT = performance.now();
  }
  icons.forEach((b) => b.addEventListener('click', () => showSpot(+b.dataset.i)));
  spot.addEventListener('pointerenter', () => { sPaused = true; spot.classList.add('paused'); });
  spot.addEventListener('pointerleave', () => { sPaused = false; spot.classList.remove('paused'); sT = performance.now(); });
  function spotFrame(t) {
    if (reduce || sPaused || cards.length < 2) return;
    if (t - sT > SPOT_MS) showSpot(si + 1);
  }
  showSpot(0);



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

  /* ---------- 6. uygulamalar: kayan dev yazı + eğilen kartlar ---------- */
  const ghost = $('#ghost'), apps = $('#uygulamalar');
  function appsFrame() {
    const r = apps.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    ghost.style.transform = `translateX(${(vw * .1 - (vh - r.top) * .35).toFixed(1)}px)`;
  }
  if (fine && !reduce) $$('.ac:not(.next)').forEach((c) => {
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
    buildField(); layoutWord();
  }
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(layout, 150); });
  function frame(t) {
    if (heroOn && !document.hidden) { drawField(t); spotFrame(t); }
    if (fine) { cx = lerp(cx, mx, .12); cy = lerp(cy, my, .12); cursor.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`; }
    bigFrame(); appsFrame(); aboutFrame(); wordFrame(); chrome();
    requestAnimationFrame(frame);
  }
  const start = () => { layout(); requestAnimationFrame(frame); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else addEventListener('load', start);
})();
