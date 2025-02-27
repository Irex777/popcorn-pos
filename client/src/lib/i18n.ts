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
        "all": "All",
        "categories": "Categories"
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
      },
      "analytics": {
        "title": "Sales Analytics",
        "daily": "Daily",
        "weekly": "Weekly",
        "monthly": "Monthly",
        "totalSales": "Total Sales",
        "totalOrders": "Total Orders",
        "averageOrder": "Average Order",
        "salesTrend": "Sales Trend",
        "salesByCategory": "Sales by Category",
        "topProducts": "Top Products",
        "revenue": "Revenue",
        "unitsSold": "Units Sold"
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
        "all": "Todo",
        "categories": "Categorías"
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
      },
      "analytics": {
        "title": "Análisis de Ventas",
        "daily": "Diario",
        "weekly": "Semanal",
        "monthly": "Mensual",
        "totalSales": "Ventas Totales",
        "totalOrders": "Pedidos Totales",
        "averageOrder": "Pedido Promedio",
        "salesTrend": "Tendencia de Ventas",
        "salesByCategory": "Ventas por Categoría",
        "topProducts": "Productos Principales",
        "revenue": "Ingresos",
        "unitsSold": "Unidades Vendidas"
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
        "all": "Alle",
        "categories": "Kategorien"
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
      },
      "analytics": {
        "title": "Verkaufsanalyse",
        "daily": "Täglich",
        "weekly": "Wöchentlich",
        "monthly": "Monatlich",
        "totalSales": "Gesamtverkäufe",
        "totalOrders": "Gesamtbestellungen",
        "averageOrder": "Durchschnittliche Bestellung",
        "salesTrend": "Verkaufstrend",
        "salesByCategory": "Verkäufe nach Kategorie",
        "topProducts": "Top-Produkte",
        "revenue": "Umsatz",
        "unitsSold": "Verkaufte Einheiten"
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
        "all": "Vše",
        "categories": "Kategorie"
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
      },
      "analytics": {
        "title": "Analýza Prodeje",
        "daily": "Denní",
        "weekly": "Týdenní",
        "monthly": "Měsíční",
        "totalSales": "Celkové Prodeje",
        "totalOrders": "Celkové Objednávky",
        "averageOrder": "Průměrná Objednávka",
        "salesTrend": "Trend Prodejů",
        "salesByCategory": "Prodeje dle Kategorie",
        "topProducts": "Nejlepší Produkty",
        "revenue": "Tržby",
        "unitsSold": "Prodané Jednotky"
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