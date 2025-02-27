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
        "units": "units",
        "all": "All"
      },
      "history": {
        "daily": "Daily",
        "monthly": "Monthly",
        "orders": "orders",
        "totalRevenue": "Total Revenue",
        "orderNumber": "Order #{{id}}",
        "unknownProduct": "Unknown Product",
        "status": {
          "completed": "Completed",
          "pending": "Pending",
          "cancelled": "Cancelled"
        }
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
        "units": "unidades",
        "all": "Todo"
      },
      "history": {
        "daily": "Diario",
        "monthly": "Mensual",
        "orders": "pedidos",
        "totalRevenue": "Ingresos Totales",
        "orderNumber": "Pedido #{{id}}",
        "unknownProduct": "Producto Desconocido",
        "status": {
          "completed": "Completado",
          "pending": "Pendiente",
          "cancelled": "Cancelado"
        }
      }
    }
  },
  de: {
    translation: {
      "settings": {
        "title": "Einstellungen",
        "language": "Sprache",
        "currency": "Währung",
        "save": "Änderungen speichern"
      },
      "common": {
        "inventory": "Inventar",
        "history": "Verlauf",
        "pos": "Kasse",
        "total": "Gesamt",
        "pay": "Bezahlen",
        "stock": "Bestand",
        "units": "Stück",
        "all": "Alle"
      },
      "history": {
        "daily": "Täglich",
        "monthly": "Monatlich",
        "orders": "Bestellungen",
        "totalRevenue": "Gesamtumsatz",
        "orderNumber": "Bestellung #{{id}}",
        "unknownProduct": "Unbekanntes Produkt",
        "status": {
          "completed": "Abgeschlossen",
          "pending": "In Bearbeitung",
          "cancelled": "Storniert"
        }
      }
    }
  },
  cs: {
    translation: {
      "settings": {
        "title": "Nastavení",
        "language": "Jazyk",
        "currency": "Měna",
        "save": "Uložit změny"
      },
      "common": {
        "inventory": "Sklad",
        "history": "Historie",
        "pos": "Pokladna",
        "total": "Celkem",
        "pay": "Zaplatit",
        "stock": "Zásoba",
        "units": "kusů",
        "all": "Vše"
      },
      "history": {
        "daily": "Denní",
        "monthly": "Měsíční",
        "orders": "objednávek",
        "totalRevenue": "Celkové tržby",
        "orderNumber": "Objednávka #{{id}}",
        "unknownProduct": "Neznámý produkt",
        "status": {
          "completed": "Dokončeno",
          "pending": "Zpracovává se",
          "cancelled": "Zrušeno"
        }
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