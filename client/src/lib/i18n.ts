import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './i18n/en.json';
import esTranslations from './i18n/es.json';
import frTranslations from './i18n/fr.json';
import deTranslations from './i18n/de.json';
import csTranslations from './i18n/cs.json';

const resources = {
  en: {
    translation: enTranslations
  },
  es: {
    translation: esTranslations
  },
  fr: {
    translation: frTranslations
  },
  de: {
    translation: deTranslations
  },
  cs: {
    translation: csTranslations
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'cs',
    fallbackLng: 'cs',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
