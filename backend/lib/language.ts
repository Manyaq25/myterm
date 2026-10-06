import type { IncomingHttpHeaders } from 'http';

// Uygulamanın desteklediği diller (src/i18n ile aynı kodlar).
const LANGUAGE_NAMES = {
  tr: 'Turkish',
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  ru: 'Russian',
  ar: 'Arabic',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Simplified Chinese',
} as const;

export type AppLanguage = keyof typeof LANGUAGE_NAMES;

/**
 * Uygulamanın arayüz dili (X-App-Language). Eski sürümler bu başlığı
 * göndermiyor; onlar için davranış eskisi gibi Türkçe kalıyor.
 */
export function parseAppLanguage(headers: IncomingHttpHeaders): AppLanguage {
  const raw = headers['x-app-language'];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase().split('-')[0];
  return value && value in LANGUAGE_NAMES ? (value as AppLanguage) : 'tr';
}

/** Modele verilecek dil satırı, ör. "Yanıt dili: English (en)." */
export function responseLanguageLine(lang: AppLanguage): string {
  return `Yanıt dili: ${LANGUAGE_NAMES[lang]} (${lang}).`;
}
