// Uygulama tanıtım sayfası (app.template.html): "Nasıl çalışır" bölümünde kaydırdıkça adım değişir,
// telefonda o adımın sahnesi oynar (sahneler: tools/site/partials/story-<uygulama>.html).
(() => {
  const story = document.getElementById('story');
  if (!story) return;
  const steps = [...story.querySelectorAll('.st')];
  const scenes = [...story.querySelectorAll('.scene')];
  const dots = [...story.querySelectorAll('.story-nav b')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = -1;
  function countUp(el) {
    const end = +el.dataset.count, fmt = (v) => v.toLocaleString(document.documentElement.lang === 'tr' ? 'tr-TR' : 'en-US');
    if (reduce) { el.textContent = fmt(end); return; }
    const t0 = performance.now(), dur = 2200;
    const tick = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - k, 3)))); if (k < 1 && el.closest('.scene.on')) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  function show(i) {
    if (i === cur) return;
    cur = i;
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    scenes.forEach((s) => s.classList.remove('on'));
    const sc = scenes.find((s) => +s.dataset.s === i);
    if (sc) { void sc.offsetWidth; sc.classList.add('on'); sc.querySelectorAll('[data-count]').forEach(countUp); }
  }
  function onScroll() {
    const mid = innerHeight * (innerWidth < 900 ? .72 : .5);
    let best = 0;
    steps.forEach((s, k) => { if (s.getBoundingClientRect().top < mid) best = k; });
    show(best);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
