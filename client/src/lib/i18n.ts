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
        "categories": "Categories",
        "export": {
          "title": "Export",
          "csv": "Export as CSV",
          "excel": "Export as Excel",
          "pdf": "Export as PDF",
          "generated": "Generated on"
        }
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
        "title": "Analytics",
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
      },
      "onboarding": {
        "pos": {
          "welcome": "Welcome to Boutique POS! This is your main point of sale screen where you can process orders quickly and efficiently.",
          "categories": "Filter products by categories to find items faster.",
          "products": "Click on products to add them to the cart. The grid updates in real-time with stock information.",
          "cart": "Your shopping cart shows the current order. Adjust quantities or swipe items to remove them."
        },
        "inventory": {
          "welcome": "Manage your product inventory here. Keep track of stock levels and update product information.",
          "addProduct": "Click here to add new products to your inventory.",
          "stock": "Update stock levels and get alerts for low inventory items."
        },
        "analytics": {
          "welcome": "Track your business performance with detailed analytics and reports.",
          "timeFilters": "Switch between different time periods to analyze trends.",
          "export": "Export your data in various formats for further analysis.",
          "metrics": "Monitor key metrics like total sales, orders, and average order value."
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
        "all": "Todo",
        "categories": "Categorías",
        "export": {
          "title": "Exportar",
          "csv": "Exportar como CSV",
          "excel": "Exportar como Excel",
          "pdf": "Exportar como PDF",
          "generated": "Generado el"
        }
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
        "title": "Análisis",
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
      },
      "onboarding": {
        "pos": {
          "welcome": "¡Bienvenido a Boutique POS! Esta es tu pantalla principal de punto de venta donde puedes procesar pedidos de forma rápida y eficiente.",
          "categories": "Filtra productos por categorías para encontrar artículos más rápido.",
          "products": "Haz clic en los productos para añadirlos al carrito. La cuadrícula se actualiza en tiempo real con información de stock.",
          "cart": "Tu carrito de compras muestra el pedido actual. Ajusta cantidades o desliza elementos para eliminarlos."
        },
        "inventory": {
          "welcome": "Gestiona tu inventario de productos aquí. Mantén un seguimiento de los niveles de stock y actualiza la información de productos.",
          "addProduct": "Haz clic aquí para añadir nuevos productos a tu inventario.",
          "stock": "Actualiza niveles de stock y recibe alertas de productos con bajo inventario."
        },
        "analytics": {
          "welcome": "Analiza el rendimiento de tu negocio con análisis y reportes detallados.",
          "timeFilters": "Alterna entre diferentes períodos de tiempo para analizar tendencias.",
          "export": "Exporta tus datos en varios formatos para un análisis más detallado.",
          "metrics": "Monitorea métricas clave como ventas totales, pedidos y valor promedio de pedido."
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
        "all": "Alle",
        "categories": "Kategorien",
        "export": {
          "title": "Exportieren",
          "csv": "Als CSV exportieren",
          "excel": "Als Excel exportieren",
          "pdf": "Als PDF exportieren",
          "generated": "Generiert am"
        }
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
        "title": "Analyse",
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
      },
      "onboarding": {
        "pos": {
          "welcome": "Willkommen bei Boutique POS! Dies ist Ihr Hauptbildschirm für den Point of Sale, auf dem Sie Bestellungen schnell und effizient bearbeiten können.",
          "categories": "Filtern Sie Produkte nach Kategorien, um Artikel schneller zu finden.",
          "products": "Klicken Sie auf Produkte, um sie zum Warenkorb hinzuzufügen. Das Raster wird in Echtzeit mit Lagerinformationen aktualisiert.",
          "cart": "Ihr Warenkorb zeigt die aktuelle Bestellung an. Passen Sie Mengen an oder streichen Sie Artikel, um sie zu entfernen."
        },
        "inventory": {
          "welcome": "Verwalten Sie hier Ihr Produktinventar. Behalten Sie den Überblick über Lagerbestände und aktualisieren Sie Produktinformationen.",
          "addProduct": "Klicken Sie hier, um neue Produkte zu Ihrem Inventar hinzuzufügen.",
          "stock": "Aktualisieren Sie Lagerbestände und erhalten Sie Benachrichtigungen bei Artikeln mit niedrigem Lagerbestand."
        },
        "analytics": {
          "welcome": "Verfolgen Sie die Leistung Ihres Unternehmens mit detaillierten Analysen und Berichten.",
          "timeFilters": "Wechseln Sie zwischen verschiedenen Zeiträumen, um Trends zu analysieren.",
          "export": "Exportieren Sie Ihre Daten in verschiedenen Formaten für eine weitere Analyse.",
          "metrics": "Überwachen Sie wichtige Kennzahlen wie Gesamtumsatz, Bestellungen und durchschnittlicher Bestellwert."
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
        "all": "Vše",
        "categories": "Kategorie",
        "export": {
          "title": "Export",
          "csv": "Exportovat jako CSV",
          "excel": "Exportovat jako Excel",
          "pdf": "Exportovat jako PDF",
          "generated": "Vygenerováno"
        }
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
        "title": "Analýza",
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
      },
      "onboarding": {
        "pos": {
          "welcome": "Vítejte v Boutique POS! Toto je vaše hlavní obrazovka prodejního místa, kde můžete rychle a efektivně zpracovávat objednávky.",
          "categories": "Filtrujte produkty podle kategorií, abyste rychleji našli položky.",
          "products": "Kliknutím na produkty je přidáte do košíku. Mřížka se aktualizuje v reálném čase s informacemi o skladu.",
          "cart": "Váš nákupní košík zobrazuje aktuální objednávku. Upravte množství nebo přejeďte prstem přes položky, abyste je odstranili."
        },
        "inventory": {
          "welcome": "Spravujte zde svůj inventář produktů. Sledujte úrovně skladu a aktualizujte informace o produktech.",
          "addProduct": "Kliknutím sem přidáte nové produkty do svého inventáře.",
          "stock": "Aktualizujte úrovně skladu a získejte upozornění na položky s nízkým stavem skladu."
        },
        "analytics": {
          "welcome": "Sledujte výkon vašeho podnikání pomocí podrobných analýz a zpráv.",
          "timeFilters": "Přepínejte mezi různými časovými úseky, abyste analyzovali trendy.",
          "export": "Exportujte svá data v různých formátech pro další analýzu.",
          "metrics": "Monitorujte klíčové metriky, jako je celkový prodej, objednávky a průměrná hodnota objednávky."
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