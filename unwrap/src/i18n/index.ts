// Çoklu dil. Kaynak dil Türkçe (locales/tr); diğer diller aynı anahtarları taşır,
// eksik anahtar önce İngilizceye, sonra Türkçeye düşer.
// Dil: Ayarlar'da seçilen, yoksa telefonun dili, o da yoksa İngilizce.
import { getLocales } from 'expo-localization';
import { File, Paths } from 'expo-file-system';
import { I18nManager } from 'react-native';

import tr from './locales/tr';

export type Dict = typeof tr;
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type PartialDict = DeepPartial<Dict>;

export const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', locale: 'tr-TR', english: 'Turkish' },
  { code: 'en', name: 'English', locale: 'en-US', english: 'English' },
  { code: 'de', name: 'Deutsch', locale: 'de-DE', english: 'German' },
  { code: 'es', name: 'Español', locale: 'es-ES', english: 'Spanish' },
  { code: 'ar', name: 'العربية', locale: 'ar', english: 'Arabic', rtl: true },
  { code: 'fr', name: 'Français', locale: 'fr-FR', english: 'French' },
  { code: 'pt', name: 'Português', locale: 'pt-BR', english: 'Portuguese (Brazil)' },
  { code: 'it', name: 'Italiano', locale: 'it-IT', english: 'Italian' },
  { code: 'ru', name: 'Русский', locale: 'ru-RU', english: 'Russian' },
  { code: 'nl', name: 'Nederlands', locale: 'nl-NL', english: 'Dutch' },
  { code: 'pl', name: 'Polski', locale: 'pl-PL', english: 'Polish' },
  { code: 'id', name: 'Bahasa Indonesia', locale: 'id-ID', english: 'Indonesian' },
  { code: 'hi', name: 'हिन्दी', locale: 'hi-IN', english: 'Hindi' },
  { code: 'uk', name: 'Українська', locale: 'uk-UA', english: 'Ukrainian' },
  { code: 'ro', name: 'Română', locale: 'ro-RO', english: 'Romanian' },
] as const;

export type LangCode = (typeof LANGUAGES)[number]['code'];

// Diller yalnız gerektiğinde yüklenir (require ile; Metro hepsini pakete koyar,
// ama yalnız seçilen dil belleğe açılır).
const LOADERS: Record<LangCode, () => PartialDict> = {
  tr: () => tr,
  en: () => require('./locales/en').default,
  de: () => require('./locales/de').default,
  es: () => require('./locales/es').default,
  ar: () => require('./locales/ar').default,
  fr: () => require('./locales/fr').default,
  pt: () => require('./locales/pt').default,
  it: () => require('./locales/it').default,
  ru: () => require('./locales/ru').default,
  nl: () => require('./locales/nl').default,
  pl: () => require('./locales/pl').default,
  id: () => require('./locales/id').default,
  hi: () => require('./locales/hi').default,
  uk: () => require('./locales/uk').default,
  ro: () => require('./locales/ro').default,
};

const prefFile = () => new File(Paths.document, '.dil');
const isLang = (c: string | null | undefined): c is LangCode => !!c && LANGUAGES.some((l) => l.code === c);

function detect(): LangCode {
  try {
    const saved = prefFile().exists ? prefFile().textSync().trim() : null;
    if (isLang(saved)) return saved;
  } catch {
    // okunamazsa telefon diline düş
  }
  for (const l of getLocales()) if (isLang(l.languageCode)) return l.languageCode;
  return 'en';
}

let current: LangCode = detect();
let dict: PartialDict = LOADERS[current]();
const fallback: PartialDict = current === 'en' || current === 'tr' ? tr : LOADERS.en();

export const lang = () => current;
export const langInfo = () => LANGUAGES.find((l) => l.code === current)!;
/** Sayı/tarih biçimi için yerel ayar ("tr-TR" gibi). */
export const locale = () => langInfo().locale;
export const isRTL = () => 'rtl' in langInfo();

// Arapça sağdan sola: değişiklik uygulama yeniden açılınca geçerli olur.
I18nManager.allowRTL(isRTL());
if (I18nManager.isRTL !== isRTL()) I18nManager.forceRTL(isRTL());

function lookup(d: unknown, key: string): string | undefined {
  let v: unknown = d;
  for (const part of key.split('.')) v = v && typeof v === 'object' ? (v as Record<string, unknown>)[part] : undefined;
  return typeof v === 'string' ? v : undefined;
}

/** t('home.title') · t('story.lead', { name: 'Ece' }) → "{{name}}" yerine konur. */
export function t(key: string, params?: Record<string, string | number>): string {
  const raw = lookup(dict, key) ?? lookup(fallback, key) ?? lookup(tr, key) ?? key;
  return params ? raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? '')) : raw;
}

/** Dizi değerleri (ör. hazır soru listesi). */
export function tl(key: string): string[] {
  const get = (d: unknown) => {
    let v: unknown = d;
    for (const part of key.split('.')) v = v && typeof v === 'object' ? (v as Record<string, unknown>)[part] : undefined;
    return Array.isArray(v) ? (v as string[]) : undefined;
  };
  return get(dict) ?? get(fallback) ?? get(tr) ?? [];
}

/** Dili kaydeder; uygulama yeniden başlatılınca uygulanır. */
export function saveLanguage(code: LangCode) {
  const f = prefFile();
  if (!f.exists) f.create();
  f.write(code);
}
