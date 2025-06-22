#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Comprehensive UX/UI Testing Suite\n');
console.log('====================================\n');

// Test scenarios to verify
const testScenarios = [
  {
    name: 'Authentication Flow',
    checks: [
      'Login page loads with Czech language by default',
      'Language dropdown shows Čeština at the top',
      'Login form validation works',
      'Successful login redirects to dashboard',
      'User preferences are loaded after login',
      'Logout functionality works'
    ]
  },
  {
    name: 'User Preferences & Settings',
    checks: [
      'Settings page loads correctly',
      'Language preferences sync between client and server',
      'Currency preferences sync between client and server', 
      'Czech language and CZK currency are defaults',
      'Language changes update UI immediately',
      'Preferences persist across browser sessions',
      'Preferences sync across devices (same user)'
    ]
  },
  {
    name: 'Shop Management',
    checks: [
      'Shop creation works with proper validation',
      'Shop selection updates current context',
      'Shop-specific data is filtered correctly',
      'Users can only access assigned shops',
      'Admin users can manage all shops'
    ]
  },
  {
    name: 'Inventory Management',
    checks: [
      'Inventory page loads with proper translations',
      'Product creation dialog shows Czech translations',
      'All form fields are properly translated',
      'Product creation works with validation',
      'Product editing preserves data correctly',
      'Product deletion works with confirmation',
      'Stock levels display correctly',
      'Category filtering works'
    ]
  },
  {
    name: 'Categories Management',
    checks: [
      'Categories page loads correctly',
      'Category creation works',
      'Category editing works',
      'Category deletion works',
      'Category colors are preserved'
    ]
  },
  {
    name: 'POS (Point of Sale)',
    checks: [
      'POS interface loads correctly',
      'Products display with correct prices in CZK',
      'Cart functionality works',
      'Checkout process works',
      'Order completion works',
      'Receipt generation works (if implemented)'
    ]
  },
  {
    name: 'Order History',
    checks: [
      'Order history loads correctly',
      'Orders display with proper formatting',
      'Date filtering works',
      'Order search works',
      'Order details are accessible'
    ]
  },
  {
    name: 'Analytics Dashboard',
    checks: [
      'Analytics page loads',
      'Charts and graphs display correctly',
      'Data is properly formatted with Czech locale',
      'Currency values show CZK formatting'
    ]
  },
  {
    name: 'Responsive Design',
    checks: [
      'Mobile layout works correctly',
      'Tablet layout works correctly',
      'Desktop layout works correctly',
      'Navigation is accessible on all screen sizes',
      'Forms are usable on mobile devices'
    ]
  },
  {
    name: 'Error Handling',
    checks: [
      'Network errors are handled gracefully',
      'Form validation errors are shown clearly',
      'Server errors display user-friendly messages',
      'Loading states are shown during operations',
      'Empty states are handled properly'
    ]
  }
];

console.log('📋 Test Scenarios Overview:\n');
testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  scenario.checks.forEach(check => {
    console.log(`   • ${check}`);
  });
  console.log();
});

console.log('🔧 Automated Checks:\n');

// Check 1: Verify all required files exist
console.log('1. File Structure Check:');
const requiredFiles = [
  'client/src/lib/i18n/cs.json',
  'client/src/lib/settings.ts',
  'client/src/hooks/use-preferences.tsx',
  'client/src/pages/auth.tsx',
  'client/src/pages/settings.tsx',
  'client/src/pages/inventory.tsx',
  'client/src/components/inventory/CreateProductDialog.tsx',
  'server/auth.ts',
  'server/storage.ts',
  'shared/schema.ts'
];

let filesOk = true;
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    filesOk = false;
  }
});

// Check 2: Verify translation completeness
console.log('\n2. Translation Completeness:');
try {
  const csPath = path.join(__dirname, '../client/src/lib/i18n/cs.json');
  const csTranslations = JSON.parse(fs.readFileSync(csPath, 'utf8'));
  
  const requiredSections = ['auth', 'common', 'inventory', 'settings', 'history', 'analytics'];
  let translationsOk = true;
  
  requiredSections.forEach(section => {
    if (csTranslations[section]) {
      console.log(`   ✅ ${section} section exists`);
    } else {
      console.log(`   ❌ ${section} section missing`);
      translationsOk = false;
    }
  });
  
  // Check specific keys
  const criticalKeys = [
    'inventory.createProduct',
    'inventory.productName',
    'common.create',
    'common.save',
    'auth.login',
    'settings.language'
  ];
  
  criticalKeys.forEach(key => {
    const value = getNestedValue(csTranslations, key);
    if (value) {
      console.log(`   ✅ ${key}: "${value}"`);
    } else {
      console.log(`   ❌ ${key} missing`);
      translationsOk = false;
    }
  });
  
} catch (error) {
  console.log(`   ❌ Error loading translations: ${error.message}`);
  translationsOk = false;
}

// Check 3: Configuration validation
console.log('\n3. Configuration Check:');
try {
  // Check settings.ts defaults
  const settingsPath = path.join(__dirname, '../client/src/lib/settings.ts');
  const settingsContent = fs.readFileSync(settingsPath, 'utf8');
  
  if (settingsContent.includes("'cs'")) {
    console.log('   ✅ Czech language set as default');
  } else {
    console.log('   ❌ Czech language not set as default');
  }
  
  if (settingsContent.includes("'CZK'")) {
    console.log('   ✅ CZK currency set as default');
  } else {
    console.log('   ❌ CZK currency not set as default');
  }
  
  // Check i18n.ts defaults
  const i18nPath = path.join(__dirname, '../client/src/lib/i18n.ts');
  const i18nContent = fs.readFileSync(i18nPath, 'utf8');
  
  if (i18nContent.includes("lng: 'cs'")) {
    console.log('   ✅ i18n configured with Czech as default');
  } else {
    console.log('   ❌ i18n not configured with Czech as default');
  }
  
} catch (error) {
  console.log(`   ❌ Configuration check failed: ${error.message}`);
}

// Check 4: Database schema validation
console.log('\n4. Database Schema Check:');
try {
  const schemaPath = path.join(__dirname, '../shared/schema.ts');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  if (schemaContent.includes("language: text(\"language\").notNull().default('cs')")) {
    console.log('   ✅ User table has language column with Czech default');
  } else {
    console.log('   ❌ User table language column not properly configured');
  }
  
  if (schemaContent.includes("currency: text(\"currency\").notNull().default('CZK')")) {
    console.log('   ✅ User table has currency column with CZK default');
  } else {
    console.log('   ❌ User table currency column not properly configured');
  }
  
  if (schemaContent.includes("userPreferencesSchema")) {
    console.log('   ✅ User preferences schema defined');
  } else {
    console.log('   ❌ User preferences schema missing');
  }
  
} catch (error) {
  console.log(`   ❌ Schema check failed: ${error.message}`);
}

console.log('\n🎯 Manual Testing Checklist:\n');
console.log('Copy this checklist and test each item manually:\n');

const manualTests = [
  '□ Open http://localhost:3002 and verify Czech language is selected by default',
  '□ Try changing language in login page and verify it updates immediately',
  '□ Login with test credentials and verify successful authentication',
  '□ Go to Settings page and verify language/currency preferences are Czech/CZK',
  '□ Change language to English, then back to Czech - verify it persists',
  '□ Change currency to USD, then back to CZK - verify it persists',
  '□ Go to Inventory page and click "Přidat produkt" button',
  '□ Verify the dialog shows Czech text (not translation keys)',
  '□ Fill out the form and create a product successfully',
  '□ Edit the product and verify all text is in Czech',
  '□ Delete the product and verify confirmation dialog is in Czech',
  '□ Navigate through all pages (POS, History, Categories, Analytics)',
  '□ Verify all UI text is properly translated to Czech',
  '□ Test responsive design on mobile/tablet screen sizes',
  '□ Test error scenarios (network issues, validation errors)',
  '□ Logout and login again - verify preferences are maintained',
  '□ Open in different browser/incognito - verify Czech defaults',
  '□ Test with multiple shops (if admin user)',
  '□ Verify currency formatting shows CZK symbol (Kč)',
  '□ Test order creation and checkout process'
];

manualTests.forEach(test => {
  console.log(test);
});

console.log('\n📊 Testing Results Summary:\n');
console.log(`Files Check: ${filesOk ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Translations Check: ${translationsOk ? '✅ PASS' : '❌ FAIL'}`);
console.log('\n🚀 Next Steps:');
console.log('1. Run the manual testing checklist above');
console.log('2. Fix any issues found during manual testing');
console.log('3. Consider adding automated E2E tests for critical user flows');
console.log('4. Test on different devices and browsers');
console.log('5. Conduct user acceptance testing with Czech users\n');

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}
