import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "auth": {
        "login": "Login",
        "register": "Register",
        "loginDescription": "Welcome back! Please sign in to your account",
        "registerDescription": "Create a new account to get started",
        "username": "Username",
        "password": "Password",
        "needAccount": "Need an account? Register",
        "haveAccount": "Already have an account? Login",
        "loginSuccess": "Login Successful",
        "registerSuccess": "Registration Successful",
        "welcomeBack": "Welcome back!",
        "accountCreated": "Your account has been created",
        "loginFailed": "Login Failed",
        "registerFailed": "Registration Failed",
        "welcomeMessage": "Welcome to Boutique POS",
        "createAccount": "Create a new account"
      },
      "settings": {
        "title": "Settings",
        "language": "Language",
        "currency": "Currency",
        "save": "Save Changes",
        "account": "Account",
        "accountDescription": "Manage your account settings and security",
        "username": "Username",
        "currentPassword": "Current Password",
        "newPassword": "New Password",
        "confirmPassword": "Confirm Password",
        "changePassword": "Change Password",
        "userManagement": "User Management",
        "userManagementDescription": "Create and manage user accounts",
        "newUsername": "New Username",
        "createUser": "Create User",
        "userList": "User List",
        "adminUser": "Administrator",
        "editUser": "Edit User",
        "editUserDescription": "Update user details",
        "leaveBlankPassword": "Leave blank to keep current password",
        "validationError": "Validation Error",
        "userCreated": "User Created",
        "userCreatedSuccess": "New user has been created successfully",
        "userUpdateFailed": "Update Failed",
        "userUpdated": "User Updated",
        "userUpdateSuccess": "User has been updated successfully",
        "passwordChanged": "Password Changed",
        "passwordChangeSuccess": "Your password has been updated successfully",
        "passwordChangeFailed": "Password Change Failed",
        "passwordMismatch": "Password Mismatch",
        "passwordsMustMatch": "New password and confirmation must match",
        "preferences": "Preferences",
        "preferencesDescription": "Customize your application settings"
      },
      "common": {
        "save": "Save",
        "cancel": "Cancel",
        "inventory": "Inventory",
        "history": "History",
        "pos": "POS",
        "total": "Total",
        "pay": "Pay",
        "stock": "Stock",
        "units": "units",
        "all": "All",
        "categories": "Categories",
        "settings": "Settings",
        "logout": "Logout",
        "lightMode": "Light Mode",
        "darkMode": "Dark Mode",
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
      "auth": {
        "login": "Iniciar Sesión",
        "register": "Registrarse",
        "loginDescription": "¡Bienvenido de nuevo! Por favor, inicie sesión en su cuenta",
        "registerDescription": "Cree una nueva cuenta para comenzar",
        "username": "Nombre de Usuario",
        "password": "Contraseña",
        "needAccount": "¿Necesita una cuenta? Regístrese",
        "haveAccount": "¿Ya tiene una cuenta? Inicie sesión",
        "loginSuccess": "Inicio de Sesión Exitoso",
        "registerSuccess": "Registro Exitoso",
        "welcomeBack": "¡Bienvenido de nuevo!",
        "accountCreated": "Su cuenta ha sido creada",
        "loginFailed": "Error de Inicio de Sesión",
        "registerFailed": "Error de Registro",
        "welcomeMessage": "Bienvenido a Boutique POS",
        "createAccount": "Crear una nueva cuenta"
      },
      "settings": {
        "title": "Configuración",
        "language": "Idioma",
        "currency": "Moneda",
        "save": "Guardar Cambios",
        "account": "Cuenta",
        "accountDescription": "Administra la configuración y seguridad de tu cuenta",
        "username": "Nombre de Usuario",
        "currentPassword": "Contraseña Actual",
        "newPassword": "Nueva Contraseña",
        "confirmPassword": "Confirmar Contraseña",
        "changePassword": "Cambiar Contraseña",
        "userManagement": "Gestión de Usuarios",
        "userManagementDescription": "Crear y administrar cuentas de usuario",
        "newUsername": "Nuevo Usuario",
        "createUser": "Crear Usuario",
        "userList": "Lista de Usuarios",
        "adminUser": "Administrador",
        "editUser": "Editar Usuario",
        "editUserDescription": "Actualizar detalles del usuario",
        "leaveBlankPassword": "Dejar en blanco para mantener la contraseña actual",
        "validationError": "Error de Validación",
        "userCreated": "Usuario Creado",
        "userCreatedSuccess": "El nuevo usuario ha sido creado con éxito",
        "userUpdateFailed": "Actualización Fallida",
        "userUpdated": "Usuario Actualizado",
        "userUpdateSuccess": "El usuario ha sido actualizado con éxito",
        "passwordChanged": "Contraseña Cambiada",
        "passwordChangeSuccess": "Tu contraseña ha sido actualizada con éxito",
        "passwordChangeFailed": "Cambio de Contraseña Fallido",
        "passwordMismatch": "Contraseñas No Coinciden",
        "passwordsMustMatch": "La nueva contraseña y la confirmación deben coincidir",
        "preferences": "Preferencias",
        "preferencesDescription": "Personaliza la configuración de tu aplicación"
      },
      "common": {
        "save": "Guardar",
        "cancel": "Cancelar",
        "inventory": "Inventario",
        "history": "Historial",
        "pos": "TPV",
        "total": "Total",
        "pay": "Pagar",
        "stock": "Stock",
        "units": "unidades",
        "all": "Todo",
        "categories": "Categorías",
        "settings": "Configuración",
        "logout": "Cerrar sesión",
        "lightMode": "Modo claro",
        "darkMode": "Modo oscuro",
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
      "auth": {
        "login": "Anmelden",
        "register": "Registrieren",
        "loginDescription": "Willkommen zurück! Bitte melden Sie sich in Ihrem Konto an",
        "registerDescription": "Erstellen Sie ein neues Konto, um loszulegen",
        "username": "Benutzername",
        "password": "Passwort",
        "needAccount": "Benötigen Sie ein Konto? Registrieren",
        "haveAccount": "Haben Sie bereits ein Konto? Anmelden",
        "loginSuccess": "Anmeldung Erfolgreich",
        "registerSuccess": "Registrierung Erfolgreich",
        "welcomeBack": "Willkommen zurück!",
        "accountCreated": "Ihr Konto wurde erstellt",
        "loginFailed": "Anmeldung Fehlgeschlagen",
        "registerFailed": "Registrierung Fehlgeschlagen",
        "welcomeMessage": "Willkommen bei Boutique POS",
        "createAccount": "Neues Konto erstellen"
      },
      "settings": {
        "title": "Einstellungen",
        "language": "Sprache",
        "currency": "Währung",
        "save": "Änderungen speichern",
        "account": "Konto",
        "accountDescription": "Verwalte deine Kontoeinstellungen und Sicherheit",
        "username": "Benutzername",
        "currentPassword": "Aktuelles Passwort",
        "newPassword": "Neues Passwort",
        "confirmPassword": "Passwort bestätigen",
        "changePassword": "Passwort ändern",
        "userManagement": "Benutzerverwaltung",
        "userManagementDescription": "Benutzerkonten erstellen und verwalten",
        "newUsername": "Neuer Benutzername",
        "createUser": "Benutzer erstellen",
        "userList": "Benutzerliste",
        "adminUser": "Administrator",
        "editUser": "Benutzer bearbeiten",
        "editUserDescription": "Benutzerdetails aktualisieren",
        "leaveBlankPassword": "Leer lassen, um aktuelles Passwort beizubehalten",
        "validationError": "Validierungsfehler",
        "userCreated": "Benutzer erstellt",
        "userCreatedSuccess": "Neuer Benutzer wurde erfolgreich erstellt",
        "userUpdateFailed": "Aktualisierung fehlgeschlagen",
        "userUpdated": "Benutzer aktualisiert",
        "userUpdateSuccess": "Benutzer wurde erfolgreich aktualisiert",
        "passwordChanged": "Passwort geändert",
        "passwordChangeSuccess": "Dein Passwort wurde erfolgreich aktualisiert",
        "passwordChangeFailed": "Passwortänderung fehlgeschlagen",
        "passwordMismatch": "Passwörter stimmen nicht überein",
        "passwordsMustMatch": "Neues Passwort und Bestätigung müssen übereinstimmen",
        "preferences": "Einstellungen",
        "preferencesDescription": "Passe deine Anwendungseinstellungen an"
      },
      "common": {
        "save": "Speichern",
        "cancel": "Abbrechen",
        "inventory": "Inventar",
        "history": "Verlauf",
        "pos": "Kasse",
        "total": "Gesamt",
        "pay": "Bezahlen",
        "stock": "Bestand",
        "units": "Stück",
        "all": "Alle",
        "categories": "Kategorien",
        "settings": "Einstellungen",
        "logout": "Abmelden",
        "lightMode": "Heller Modus",
        "darkMode": "Dunkler Modus",
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
      "auth": {
        "login": "Přihlášení",
        "register": "Registrace",
        "loginDescription": "Vítejte zpět! Přihlaste se prosím do svého účtu",
        "registerDescription": "Vytvořte si nový účet a začněte",
        "username": "Uživatelské jméno",
        "password": "Heslo",
        "needAccount": "Potřebujete účet? Zaregistrujte se",
        "haveAccount": "Již máte účet? Přihlaste se",
        "loginSuccess": "Přihlášení Úspěšné",
        "registerSuccess": "Registrace Úspěšná",
        "welcomeBack": "Vítejte zpět!",
        "accountCreated": "Váš účet byl vytvořen",
        "loginFailed": "Přihlášení Selhalo",
        "registerFailed": "Registrace Selhala",
        "welcomeMessage": "Vítejte v Boutique POS",
        "createAccount": "Vytvořit nový účet"
      },
      "settings": {
        "title": "Nastavení",
        "language": "Jazyk",
        "currency": "Měna",
        "save": "Uložit změny",
        "account": "Účet",
        "accountDescription": "Správa nastavení a zabezpečení účtu",
        "username": "Uživatelské jméno",
        "currentPassword": "Současné heslo",
        "newPassword": "Nové heslo",
        "confirmPassword": "Potvrdit heslo",
        "changePassword": "Změnit heslo",
        "userManagement": "Správa uživatelů",
        "userManagementDescription": "Vytvářejte a spravujte uživatelské účty",
        "newUsername": "Nové uživatelské jméno",
        "createUser": "Vytvořit uživatele",
        "userList": "Seznam uživatelů",
        "adminUser": "Administrátor",
        "editUser": "Upravit uživatele",
        "editUserDescription": "Aktualizovat údaje uživatele",
        "leaveBlankPassword": "Ponechte prázdné pro zachování současného hesla",
        "validationError": "Chyba validace",
        "userCreated": "Uživatel vytvořen",
        "userCreatedSuccess": "Nový uživatel byl úspěšně vytvořen",
        "userUpdateFailed": "Aktualizace selhala",
        "userUpdated": "Uživatel aktualizován",
        "userUpdateSuccess": "Uživatel byl úspěšně aktualizován",
        "passwordChanged": "Heslo změněno",
        "passwordChangeSuccess": "Vaše heslo bylo úspěšně aktualizováno",
        "passwordChangeFailed": "Změna hesla selhala",
        "passwordMismatch": "Hesla se neshodují",
        "passwordsMustMatch": "Nové heslo a potvrzení se musí shodovat",
        "preferences": "Předvolby",
        "preferencesDescription": "Přizpůsobte si nastavení aplikace"
      },
      "common": {
        "save": "Uložit",
        "cancel": "Zrušit",
        "inventory": "Sklad",
        "history": "Historie",
        "pos": "Pokladna",
        "total": "Celkem",
        "pay": "Zaplatit",
        "stock": "Zásoba",
        "units": "kusů",
        "all": "Vše",
        "categories": "Kategorie",
        "settings": "Nastavení",
        "logout": "Odhlásit",
        "lightMode": "Světlý režim",
        "darkMode": "Tmavý režim",
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