// Şablonlardan sayfa üretir (build.sh bunu CSS'ten önce çalıştırır):
//   studio.template.html + studio.i18n.js → web/index.html, web/en/index.html (aydinapp vitrini: bütün uygulamalar)
//   home.template.html   + home.i18n.js   → web/synvia/index.html, web/en/synvia/index.html (Synvia AI tanıtımı)
//   changelog.template.html + changelog.i18n.js → web/synvia/yenilikler/, web/en/synvia/whats-new/
//   apps.template.html   + apps.i18n.js   → web/uygulamalar/index.html, web/en/apps/index.html
//   app.template.html    + apps.json      → web/apps/<id>/index.html, web/en/apps/<id>/index.html ("generate": true olan uygulamalar)
// Uygulama listesi tek yerde: apps.json. Ana sayfadaki kartlar, sayı etiketi ve dönen kart oradan üretilir.
const fs = require('fs');
const path = require('path');

const ICONS = require('./icons.json');
const APPS = require('./apps.json').apps;
const STUDIO = require('./studio.i18n.js');
const PAGES = [
  { template: 'studio.template.html', i18n: require('./studio.i18n.js') },
  { template: 'home.template.html', i18n: require('./home.i18n.js') },
  { template: 'changelog.template.html', i18n: require('./changelog.i18n.js') },
  { template: 'apps.template.html', i18n: require('./apps.i18n.js') },
];
// Kendi tanıtım sayfası üretilecek uygulamalar (apps.json → "generate": true)
for (const app of APPS.filter((a) => a.generate)) {
  const i18n = {};
  for (const lang of ['tr', 'en']) {
    const other = lang === 'tr' ? 'en' : 'tr';
    const ui = STUDIO[lang];
    const d = app.details[lang];
    i18n[lang] = {
      ...ui.appPage,
      lang, locale: ui.locale, path: app.page[lang], homePath: ui.path,
      altLang: other, altPath: app.page[other], altLabel: ui.altLabel, altShort: ui.altShort,
      ogImage: ui.ogImage, title: d.title, description: d.description,
      appId: app.id, appName: app.name, category: app.category[lang], tagline: app.tagline[lang],
      heroL1: d.heroL1, heroL2: d.heroL2, privacy: d.privacy, age: d.age,
      accent: app.accent, accent2: app.accent2, appBg: app.bg, icon192: app.icon192,
      supportHref: `${lang === 'en' ? '/en' : ''}/apps/${app.legalDir}/support.html`,
      privacyHref: `${lang === 'en' ? '/en' : ''}/apps/${app.legalDir}/privacy-policy.html`,
      termsHref: `${lang === 'en' ? '/en' : ''}/apps/${app.legalDir}/terms.html`,
      deleteHref: `${lang === 'en' ? '/en' : ''}/apps/${app.legalDir}/delete-data.html`,
      statusBadge: app.status === 'live' ? ui.appLive : ui.soonBadge,
      ...(d.scene || {}),
      _app: app, _steps: d.steps, _ui: ui,
    };
  }
  PAGES.push({ template: 'app.template.html', i18n });
}
const APP_STORE = 'https://apps.apple.com/app/id6812456837';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function icon(name, cls = '') {
  if (!ICONS[name]) throw new Error(`icons.json içinde yok: ${name}`);
  return `<svg class="${`ms ${cls}`.trim()}" viewBox="0 -960 960 960" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
}

const APPLE_LOGO = '<svg class="w-5 h-5 fill-surface shrink-0" viewBox="0 0 384 512" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>';
const PLAY_LOGO = '<svg class="w-5 h-5 fill-current opacity-70 shrink-0" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.609 1.814L13.792 12 3.61 22.186a1.994 1.994 0 01-.61-1.471V3.285c0-.566.231-1.08.609-1.471zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626c.624.361.994.985.994 1.68s-.37 1.319-.994 1.68l-2.808 1.626-2.595-2.595 2.596-2.597zm-13.09-7.84L15.943 8l-2.302 2.302-8.635-8.635a1.982 1.982 0 01.602.002z"/></svg>';

const components = {
  // Sayfanın diğer dildeki karşılığına giden, belirgin dil düğmesi
  langSwitch: (t) => `<a class="inline-flex items-center gap-1 px-space-sm py-1 rounded-full border border-outline-variant text-on-surface hover:border-primary hover:text-primary font-code-mono text-code-mono transition-colors" href="${t.altPath}" hreflang="${t.altLang}" lang="${t.altLang}">${icon('language', 'text-base')}<span>${esc(t.altLabel)}</span></a>`,

  storeButtons: (t) => `<a class="inline-flex items-center justify-center gap-space-sm px-space-lg py-space-md rounded-2xl bg-gradient-to-r from-primary-fixed-dim via-primary to-secondary text-surface font-headline-sm text-base sm:text-headline-sm font-bold whitespace-nowrap shadow-[0_0_28px_rgba(89,219,199,0.35)] hover:shadow-[0_0_36px_rgba(255,107,74,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all" href="${APP_STORE}" rel="noopener noreferrer" target="_blank">${APPLE_LOGO}<span>${esc(t.appStore)}</span>${icon('arrow_outward', 'text-lg')}</a>
<a data-play-btn data-get-label="${esc(t.playGet)}" aria-disabled="true" title="${esc(t.androidSoon)}" class="inline-flex items-center justify-center gap-space-sm px-space-lg py-space-md rounded-2xl bg-surface-container-high/60 text-on-surface-variant font-headline-sm text-base sm:text-headline-sm font-bold whitespace-nowrap cursor-not-allowed select-none">${PLAY_LOGO}<span data-play-label>${esc(t.playSoon)}</span></a>`,

  phone: (t, img, altKey, rotate, loading = 'lazy') => `<div class="relative w-[270px] sm:w-[300px] aspect-[660/1434] rounded-[44px] p-2.5 bg-gradient-to-b from-surface-bright via-surface-container-highest to-surface-container-low shadow-2xl shadow-black/80 ring-1 ring-white/10 ${rotate}">
<div class="w-full h-full rounded-[36px] overflow-hidden bg-[#F4F7F6]"><img src="/apps/synvia-ai/screens/${img}" alt="${esc(t[altKey])}" width="660" height="1434" loading="${loading}"${loading === 'eager' ? ' fetchpriority="high"' : ''} class="w-full h-full object-cover object-top"></div>
</div>`,

  heading: (t, kicker, title) => `<div class="flex flex-col items-center text-center gap-space-xs mb-space-xl">
<span class="font-label-caps text-label-caps text-secondary uppercase">${esc(t[kicker])}</span>
<h2 class="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface tracking-tight max-w-2xl">${esc(t[title])}</h2>
</div>`,

  step: (t, n, ic, title, text) => `<li class="relative rounded-3xl bg-surface-container/60 backdrop-blur-xl p-space-lg flex flex-col gap-space-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
<div class="flex items-center justify-between"><span class="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/15 text-primary">${icon(ic, 'text-2xl')}</span><span class="font-display-hero-mobile text-display-hero-mobile text-on-surface/10">${n}</span></div>
<h3 class="font-headline-sm text-headline-sm text-on-surface">${esc(t[title])}</h3>
<p class="text-on-surface-variant">${esc(t[text])}</p>
</li>`,

  feature: (t, ic, title, text) => `<div class="rounded-3xl bg-surface-container/60 backdrop-blur-xl p-space-md sm:p-space-lg flex flex-col gap-space-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:bg-surface-container-high/70 transition-colors">
<span class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-surface-container-highest text-primary">${icon(ic, 'text-[22px]')}</span>
<h3 class="font-headline-sm text-base font-semibold leading-snug sm:text-headline-sm text-on-surface">${esc(t[title])}</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant">${esc(t[text])}</p>
</div>`,

  // Yenilikler sayfasındaki sürüm kartları (changelog.i18n.js → entries)
  changelogEntries: (t) => t.entries.map((e) => `<li class="relative rounded-3xl ${e.latest ? 'p-[1.5px] bg-gradient-to-br from-primary via-primary-fixed-dim to-secondary shadow-[0_0_40px_rgba(89,219,199,0.15)]' : 'bg-surface-container/60'}">
<div class="${e.latest ? 'rounded-[calc(1.5rem-1.5px)] bg-surface-container-low' : ''} p-space-lg md:p-space-xl flex flex-col gap-space-md">
<div class="flex flex-wrap items-center gap-space-sm">
<span class="font-code-mono text-code-mono font-semibold px-space-sm py-0.5 rounded-full bg-primary/15 text-primary">${esc(t.versionLabel)} ${esc(e.version)}</span>
<span class="font-code-mono text-code-mono text-on-surface-variant">${esc(e.date)}</span>
${e.latest ? `<span class="font-code-mono text-[12px] font-semibold px-space-sm py-0.5 rounded-full bg-secondary/15 text-secondary">${esc(t.latestBadge)}</span>` : ''}
</div>
<h2 class="font-headline-md text-headline-md text-on-surface">${esc(e.title)}</h2>
<ul class="flex flex-col gap-space-md">
${e.items.map(([emoji, title, text]) => `<li class="flex items-start gap-space-sm"><span class="text-xl leading-7 shrink-0" aria-hidden="true">${emoji}</span><div><h3 class="font-semibold text-on-surface">${esc(title)}</h3><p class="text-on-surface-variant">${esc(text)}</p></div></li>`).join('\n')}
</ul>
</div>
</li>`).join('\n'),

  // Ana sayfadaki sohbet mesajı: [metin, grup] parçaları; grup verilen parçalar yapay zekânın vurguladığı kelimeler
  chatMessage: (t) => t.chatParts.map(([text, g]) => (g == null ? esc(text) : `<span class="k${g === 1 ? ' t' : ''}" data-g="${g}">${esc(text)}</span>`)).join(''),

  // Betiğe verilen metin listeleri (data-* özniteliği içinde JSON)
  json: (t, key) => esc(JSON.stringify(t[key])),

  check: (t, key) => `<li class="flex items-start gap-space-sm text-on-surface">${icon('check', 'text-xl text-primary mt-0.5')}<span>${esc(t[key])}</span></li>`,

  faq: (t, q, a) => `<details class="group rounded-2xl bg-surface-container/60 px-space-lg py-space-md">
<summary class="flex items-center justify-between gap-space-md cursor-pointer list-none font-headline-sm text-base text-on-surface [&::-webkit-details-marker]:hidden">${esc(t[q])}${icon('keyboard_arrow_down', 'text-xl text-on-surface-variant transition-transform group-open:rotate-180')}</summary>
<p class="mt-space-sm text-on-surface-variant">${esc(t[a])}</p>
</details>`,

  // ---- apps.json'dan üretilen parçalar (ana sayfa ve uygulama sayfaları) ----
  // "2 uygulama · 1 yayında, 1 yakında"
  appCount: (t) => {
    const live = APPS.filter((a) => a.status === 'live').length, soon = APPS.length - live;
    const parts = [];
    if (live) parts.push(t.countLive.replace('{n}', live));
    if (soon) parts.push(t.countSoon.replace('{n}', soon));
    return esc(`${t.countApps.replace('{n}', APPS.length)} · ${parts.join(', ')}`);
  },
  // Giriş bölümünde kendiliğinden dönen öne çıkan kart + altında bütün uygulama simgeleri
  appSpotlight: (t) => `<div class="spot" id="spot" data-interval="4200">
${APPS.map((a, i) => `<a class="spot-card${i === 0 ? ' on' : ''}" href="${a.page[t.lang]}" style="--acc:${a.accent};--acc2:${a.accent2};--abg:${a.bg}" data-i="${i}"${i ? ' tabindex="-1" aria-hidden="true"' : ''}>
<span class="spot-glow" aria-hidden="true"></span>
<img src="${a.icon192}" alt="" width="192" height="192">
<span class="spot-meta"><span class="badge mono${a.status === 'live' ? '' : ' soon'}">${a.status === 'live' ? '<span class="live-dot"></span>' + esc(t.appLive) : esc(t.soonBadge)}</span><span class="spot-cat mono">${esc(a.category[t.lang])}</span></span>
<b class="spot-name">${esc(a.name)}</b>
<span class="spot-tag">${esc(a.tagline[t.lang])}</span>
<span class="spot-go">${esc(t.inspect)} ${icon('arrow_outward')}</span>
</a>`).join('\n')}
<div class="spot-icons" role="tablist" aria-label="${esc(t.navApps)}">
${APPS.map((a, i) => `<button type="button" class="spot-ic${i === 0 ? ' on' : ''}" data-i="${i}" role="tab" aria-selected="${i === 0}" aria-label="${esc(a.name)}" style="--acc:${a.accent}"><img src="${a.icon96}" alt="" width="96" height="96"><i class="bar"></i></button>`).join('\n')}
<span class="spot-more" aria-hidden="true">+</span>
</div>
</div>`,
  // Mağaza düğmeleri: yayındaysa bağlantı, değilse "Yakında"
  storePair: (t, app, size = '') => {
    const live = app.status === 'live';
    const apple = '<svg class="apple" viewBox="0 0 384 512" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>';
    const play = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.609 1.814L13.792 12 3.61 22.186a1.994 1.994 0 01-.61-1.471V3.285c0-.566.231-1.08.609-1.471zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626c.624.361.994.985.994 1.68s-.37 1.319-.994 1.68l-2.808 1.626-2.595-2.595 2.596-2.597zm-13.09-7.84L15.943 8l-2.302 2.302-8.635-8.635a1.982 1.982 0 01.602.002z"/></svg>';
    if (!live) return `<span class="btn-store ${size} off" aria-disabled="true">${apple}<span>App Store · ${esc(t.soonShort)}</span></span><span class="btn-play ${size}" aria-disabled="true">${play}<span>Google Play · ${esc(t.soonShort)}</span></span>`;
    return `<a class="btn-store ${size} magnetic" href="${app.appStore}" target="_blank" rel="noopener noreferrer">${apple}<span>App Store</span></a><a class="btn-play ${size}" href="${app.googlePlay}" target="_blank" rel="noopener noreferrer">${play}<span>Google Play</span></a>`;
  },
  // "Uygulamalarımız" kartları
  appCards: (t) => APPS.map((a) => `<article class="ac" style="--acc:${a.accent};--acc2:${a.accent2};--abg:${a.bg}">
<span class="glare"></span>
<a class="ac-hit" href="${a.page[t.lang]}" aria-label="${esc(`${a.name}: ${t.inspect}`)}"></a>
<div class="ac-top"><img src="${a.icon192}" alt="" width="192" height="192" loading="lazy"><span class="badge mono${a.status === 'live' ? '' : ' soon'}">${a.status === 'live' ? '<span class="live-dot"></span>' + esc(t.appLive) : esc(t.soonBadge)}</span></div>
<h3>${esc(a.name)}</h3>
<p class="ac-cat mono">${esc(a.category[t.lang])}</p>
<p class="ac-tag">${esc(a.tagline[t.lang])}</p>
<div class="ac-store">${components.storePair(t, a, 'sm')}</div>
<a class="go" href="${a.page[t.lang]}"><i>${icon('arrow_outward')}</i>${esc(t.inspect)}</a>
</article>`).join('\n'),
  footApps: (t) => APPS.map((a) => `<a href="${a.page[t.lang]}">${esc(a.name)}</a>`).join('\n        '),
  // Uygulama sayfası: mağaza düğmeleri, adımlar, telefon çizimi
  appStores: (t) => components.storePair(t._ui, t._app),
  // Kaydırdıkça değişen "Nasıl çalışır" sahnesi: solda adımlar, sağda yapışkan telefon (partials/story-<id>.html varsa)
  appStory: (t) => {
    const f = path.join(__dirname, 'partials', `story-${t.appId}.html`);
    if (!fs.existsSync(f)) return `<ol class="ap-steps">${components.appSteps(t)}</ol>`;
    const scenes = fs.readFileSync(f, 'utf8').trimEnd()
      .replace(/\{\{icon:(\w+)\}\}/g, (m, n) => icon(n))
      .replace(/\{\{(\w+)\}\}/g, (m, k) => esc(t[k] ?? t._ui[k] ?? m));
    const n = t._steps.length;
    return `<div class="ap-story" id="story" style="--n:${n}">
<div class="ap-story-steps">
${t._steps.map(([h, p], i) => `<article class="st${i === 0 ? ' on' : ''}" data-i="${i}"><span class="n mono">${esc(t.stepWord)} ${i + 1} / ${n}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join('\n')}
</div>
<div class="ap-stage" aria-hidden="true">
<div class="phone story-phone"><div class="scenes" data-step="0">${scenes}</div><span class="sheen"></span></div>
<div class="story-nav">${t._steps.map((_, i) => `<b${i === 0 ? ' class="on"' : ''}></b>`).join('')}</div>
</div>
</div>`;
  },
  appSteps: (t) => t._steps.map(([h, p], i) => `<li><span class="n mono">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('\n'),
  appMock: (t) => {
    const f = path.join(__dirname, 'partials', `mock-${t.appId}.html`);
    return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trimEnd().replace(/\{\{(\w+)\}\}/g, (m, k) => esc(t[k] ?? t._ui[k] ?? m)) : `<img class="mock-icon" src="${t.icon192}" alt="" width="192" height="192">`;
  },
};

function jsonLd(t) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Synvia AI',
    operatingSystem: 'iOS',
    applicationCategory: 'ProductivityApplication',
    description: t.description,
    url: `https://aydinapp.com.tr${t.path}`,
    downloadUrl: APP_STORE,
    image: 'https://aydinapp.com.tr/apps/synvia-ai/icon.png',
    inLanguage: t.lang,
    offers: { '@type': 'Offer', price: '0', priceCurrency: t.lang === 'tr' ? 'TRY' : 'USD' },
    author: { '@type': 'Person', name: 'İbrahim Aydın', url: 'https://aydinapp.com.tr/' },
  }).replace(/</g, '\\u003c');
}

function render(template, t) {
  // Ortak parçalar (partials/*.html) önce yerleştirilir, sonra onların içindeki yer tutucular da doldurulur.
  template = template.replace(/\{\{partial:([\w-]+)\}\}/g, (m, name) =>
    fs.readFileSync(path.join(__dirname, 'partials', `${name}.html`), 'utf8').trimEnd()
  );
  let html = template.replace(/\{\{(\w+):([^}]+)\}\}/g, (m, name, rest) => {
    if (name === 'icon') {
      const i = rest.indexOf(':');
      return i < 0 ? icon(rest) : icon(rest.slice(0, i), rest.slice(i + 1));
    }
    if (!components[name]) throw new Error(`bilinmeyen bileşen: ${m}`);
    return components[name](t, ...rest.split(':'));
  });
  html = html.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    if (key === 'jsonLd') return jsonLd(t);
    if (components[key]) return components[key](t);
    if (!(key in t)) throw new Error(`${t.lang} metni eksik: ${key}`);
    return esc(t[key]);
  });
  return html;
}

for (const page of PAGES) {
  for (const t of Object.values(page.i18n)) {
    const clash = Object.keys(t).filter((k) => k in components);
    if (clash.length) throw new Error(`metin anahtarı bir bileşen adıyla çakışıyor: ${clash.join(', ')}`);
  }
  const template = fs.readFileSync(path.join(__dirname, page.template), 'utf8');
  for (const t of Object.values(page.i18n)) {
    const out = path.join(__dirname, '../../web', t.path, 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, render(template, t));
    console.log('wrote', path.relative(path.join(__dirname, '../..'), out));
  }
}
