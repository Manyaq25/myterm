import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

import tr from './locales/tr.json';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import ar from './locales/ar.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';

export const SUPPORTED_LANGUAGES = ['tr', 'en', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'ar', 'ja', 'ko', 'zh'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  tr: 'Türkçe',
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  ru: 'Русский',
  ar: 'العربية',
  ja: '日本語',
  ko: '한국어',
  zh: '简体中文',
};

const LANGUAGE_STORAGE_KEY = 'appLanguage';

function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function detectDeviceLanguage(): SupportedLanguage {
  for (const locale of Localization.getLocales()) {
    if (isSupportedLanguage(locale.languageCode)) return locale.languageCode;
  }
  return 'en';
}

export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  const value = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
  return isSupportedLanguage(value) ? value : null;
}

/** Pass null to go back to following the device's system language. */
export async function setAppLanguage(language: SupportedLanguage | null): Promise<void> {
  if (language) {
    await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } else {
    await SecureStore.deleteItemAsync(LANGUAGE_STORAGE_KEY);
    await i18n.changeLanguage(detectDeviceLanguage());
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    es: { translation: es },
    pt: { translation: pt },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
    ru: { translation: ru },
    ar: { translation: ar },
    ja: { translation: ja },
    ko: { translation: ko },
    zh: { translation: zh },
  },
  lng: 'tr',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// SecureStore reads are async, so the language above is a placeholder until
// this resolves — the root layout awaits it before rendering any UI text.
export const languageReady: Promise<void> = (async () => {
  const stored = await getStoredLanguage();
  await i18n.changeLanguage(stored ?? detectDeviceLanguage());
})();

export default i18n;
