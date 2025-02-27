import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "settings": {
        "title": "Settings",
        "language": "Language",
        "currency": "Currency",
        "save": "Save Changes"
      },
      "common": {
        "inventory": "Inventory",
        "history": "History",
        "pos": "POS",
        "total": "Total",
        "pay": "Pay",
        "stock": "Stock",
        "units": "units"
      }
    }
  },
  es: {
    translation: {
      "settings": {
        "title": "Configuración",
        "language": "Idioma",
        "currency": "Moneda",
        "save": "Guardar Cambios"
      },
      "common": {
        "inventory": "Inventario",
        "history": "Historial",
        "pos": "TPV",
        "total": "Total",
        "pay": "Pagar",
        "stock": "Stock",
        "units": "unidades"
      }
    }
  },
  fr: {
    translation: {
      "settings": {
        "title": "Paramètres",
        "language": "Langue",
        "currency": "Devise",
        "save": "Enregistrer"
      },
      "common": {
        "inventory": "Inventaire",
        "history": "Historique",
        "pos": "Caisse",
        "total": "Total",
        "pay": "Payer",
        "stock": "Stock",
        "units": "unités"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
