// Google Play mağaza metinlerini denetler: 16 dilin dosyası var mı, alanlar
// dolu mu, uzunluklar Play sınırlarında mı, başlıkta "Unwrap" geçiyor mu.
// Uzunluk UTF-16 birimiyle sayılır (emoji 2 sayılır); Play'in saydığından
// daha katıdır, böylece Play Console'da sınır aşılmaz.
// Çalıştırma: node scripts/check-listings.ts  (ya da npx tsx scripts/check-listings.ts)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(process.argv[1]), '..');
const dir = join(root, 'store/play/listings');

const LANGS = [
  'tr-TR', 'en-US', 'de-DE', 'es-ES', 'es-419', 'ar', 'fr-FR', 'pt-BR',
  'it-IT', 'ru-RU', 'nl-NL', 'pl-PL', 'id', 'hi-IN', 'uk', 'ro',
];
const LIMITS = { title: 30, shortDescription: 80, fullDescription: 4000 } as const;
type Field = keyof typeof LIMITS;

const errors: string[] = [];
const rows: string[] = [];

for (const lang of LANGS) {
  const file = join(dir, `${lang}.json`);
  if (!existsSync(file)) {
    errors.push(`${lang}: dosya yok (${file})`);
    continue;
  }
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    errors.push(`${lang}: JSON okunamadı: ${(e as Error).message}`);
    continue;
  }
  const counts: string[] = [];
  for (const field of Object.keys(LIMITS) as Field[]) {
    const v = data[field];
    if (typeof v !== 'string' || !v.trim()) {
      errors.push(`${lang}.${field}: boş ya da metin değil`);
      continue;
    }
    const units = v.length; // UTF-16
    const chars = [...v].length; // kod noktası
    if (units > LIMITS[field]) errors.push(`${lang}.${field}: ${units}/${LIMITS[field]} (sınır aşıldı)`);
    if (v !== v.trim()) errors.push(`${lang}.${field}: başta/sonda boşluk var`);
    counts.push(`${field}=${chars}${units !== chars ? ` (utf16 ${units})` : ''}`);
  }
  const extra = Object.keys(data).filter((k) => !(k in LIMITS));
  if (extra.length) errors.push(`${lang}: beklenmeyen alanlar: ${extra.join(', ')}`);
  if (typeof data.title === 'string' && !data.title.includes('Unwrap')) errors.push(`${lang}.title: "Unwrap" geçmiyor`);
  const full = String(data.fullDescription ?? '');
  if (!full.includes('WhatsApp') || !full.includes('Telegram')) errors.push(`${lang}.fullDescription: WhatsApp/Telegram ilişkisizlik notu eksik olabilir`);
  rows.push(`${lang.padEnd(7)} ${counts.join('  ')}`);
}

const stray = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json') && !LANGS.includes(f.replace(/\.json$/, ''))) : [];
if (stray.length) errors.push(`Listede olmayan dosyalar: ${stray.join(', ')}`);

console.log(rows.join('\n'));
if (errors.length) {
  console.error(`\n${errors.length} sorun:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nTamam: ${LANGS.length} dil, tüm uzunluklar sınırda.`);
