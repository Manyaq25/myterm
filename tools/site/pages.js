// Şablonlardan sayfa üretir (build.sh bunu CSS'ten önce çalıştırır):
//   home.template.html   + home.i18n.js   → web/index.html, web/en/index.html
//   synvia.template.html + synvia.i18n.js → web/synvia/index.html, web/en/synvia/index.html
const fs = require('fs');
const path = require('path');

const ICONS = require('./icons.json');
const PAGES = [
  { template: 'home.template.html', i18n: require('./home.i18n.js') },
  { template: 'synvia.template.html', i18n: require('./synvia.i18n.js') },
];
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

  check: (t, key) => `<li class="flex items-start gap-space-sm text-on-surface">${icon('check', 'text-xl text-primary mt-0.5')}<span>${esc(t[key])}</span></li>`,

  faq: (t, q, a) => `<details class="group rounded-2xl bg-surface-container/60 px-space-lg py-space-md">
<summary class="flex items-center justify-between gap-space-md cursor-pointer list-none font-headline-sm text-base text-on-surface [&::-webkit-details-marker]:hidden">${esc(t[q])}${icon('keyboard_arrow_down', 'text-xl text-on-surface-variant transition-transform group-open:rotate-180')}</summary>
<p class="mt-space-sm text-on-surface-variant">${esc(t[a])}</p>
</details>`,
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
  const template = fs.readFileSync(path.join(__dirname, page.template), 'utf8');
  for (const t of Object.values(page.i18n)) {
    const out = path.join(__dirname, '../../web', t.path, 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, render(template, t));
    console.log('wrote', path.relative(path.join(__dirname, '../..'), out));
  }
}
