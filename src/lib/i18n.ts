import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en.json'
import ru from '@/locales/ru.json'

export const LOCALE_STORAGE_KEY = 'preferred-locale'

export type AppLocale = 'en' | 'ru'

export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'ru']

function detectBrowserLocale(): AppLocale {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

function getInitialLocale(): AppLocale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (saved === 'ru' || saved === 'en') return saved
  } catch {
    // private mode / unavailable
  }
  return detectBrowserLocale()
}

const initialLng = getInitialLocale()

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: initialLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLng
}

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng
  }
  try {
    if (lng === 'ru' || lng === 'en') {
      localStorage.setItem(LOCALE_STORAGE_KEY, lng)
    }
  } catch {
    // ignore
  }
})

export function changeAppLocale(lang: AppLocale) {
  void i18n.changeLanguage(lang)
}

export default i18n
