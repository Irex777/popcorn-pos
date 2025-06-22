#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Comprehensive UX/UI Translation Testing\n');

// Load Czech translations
const csPath = path.join(__dirname, '../client/src/lib/i18n/cs.json');
const csTranslations = JSON.parse(fs.readFileSync(csPath, 'utf8'));

// Define all pages to test
const pagesToTest = [
  'auth.tsx',
  'pos.tsx', 
  'inventory.tsx',
  'categories.tsx',
  'settings.tsx',
  'history.tsx',
  'analytics.tsx'
];

// Define all components to test
const componentsToTest = [
  'components/pos/CheckoutDialog.tsx',
  'components/inventory/CreateProductDialog.tsx',
  'components/inventory/EditProductDialog.tsx',
  'components/layouts/DashboardLayout.tsx'
];

console.log('📄 Testing pages for translation coverage:\n');

function extractTranslationKeys(content) {
  const keys = new Set();
  
  // Match t('key') and t("key") patterns with optional interpolation
  const regex = /t\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*\{[^}]*\})?\s*\)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  return Array.from(keys);
}

function keyExists(key, translations) {
  const parts = key.split('.');
  let current = translations;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return false;
    }
  }
  
  return true;
}

function findHardcodedStrings(content) {
  const hardcoded = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Look for common UI text patterns that should be translated
    const patterns = [
      />\s*([A-Z][a-zA-Z\s]{3,})</g, // Text between JSX tags
      /placeholder="([^"]{3,})"/g,    // Placeholder text
      /title="([^"]{3,})"/g,          // Title attributes
      /aria-label="([^"]{3,})"/g      // Aria labels
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const text = match[1].trim();
        // Skip if it's likely a variable or already translated
        if (!text.includes('{') && !text.includes('$') && 
            !line.includes('t(') && text.length > 2 &&
            /^[A-Za-z\s]+$/.test(text)) {
          hardcoded.push({
            line: index + 1,
            text: text,
            context: line.trim()
          });
        }
      }
    });
  });
  
  return hardcoded;
}

let totalMissingKeys = 0;
let totalHardcodedStrings = 0;
let allMissingKeys = new Set();

// Test pages
pagesToTest.forEach(page => {
  const pagePath = path.join(__dirname, '../client/src/pages', page);
  
  if (!fs.existsSync(pagePath)) {
    console.log(`⚠️  ${page}: File not found`);
    return;
  }
  
  const content = fs.readFileSync(pagePath, 'utf8');
  const translationKeys = extractTranslationKeys(content);
  const hardcodedStrings = findHardcodedStrings(content);
  
  console.log(`📄 ${page}:`);
  
  // Check for missing translation keys
  const missingKeys = translationKeys.filter(key => !keyExists(key, csTranslations));
  if (missingKeys.length > 0) {
    console.log(`  ❌ Missing translation keys (${missingKeys.length}):`);
    missingKeys.forEach(key => {
      console.log(`    - ${key}`);
      allMissingKeys.add(key);
    });
    totalMissingKeys += missingKeys.length;
  } else {
    console.log(`  ✅ All translation keys present (${translationKeys.length} keys)`);
  }
  
  // Check for hardcoded strings
  if (hardcodedStrings.length > 0) {
    console.log(`  ⚠️  Potential hardcoded strings (${hardcodedStrings.length}):`);
    hardcodedStrings.slice(0, 5).forEach(item => { // Show first 5
      console.log(`    Line ${item.line}: "${item.text}"`);
    });
    if (hardcodedStrings.length > 5) {
      console.log(`    ... and ${hardcodedStrings.length - 5} more`);
    }
    totalHardcodedStrings += hardcodedStrings.length;
  } else {
    console.log(`  ✅ No hardcoded strings detected`);
  }
  
  console.log('');
});

// Test components
console.log('🧩 Testing components for translation coverage:\n');

componentsToTest.forEach(component => {
  const componentPath = path.join(__dirname, '../client/src', component);
  
  if (!fs.existsSync(componentPath)) {
    console.log(`⚠️  ${component}: File not found`);
    return;
  }
  
  const content = fs.readFileSync(componentPath, 'utf8');
  const translationKeys = extractTranslationKeys(content);
  const hardcodedStrings = findHardcodedStrings(content);
  
  console.log(`🧩 ${component}:`);
  
  const missingKeys = translationKeys.filter(key => !keyExists(key, csTranslations));
  if (missingKeys.length > 0) {
    console.log(`  ❌ Missing translation keys (${missingKeys.length}):`);
    missingKeys.forEach(key => {
      console.log(`    - ${key}`);
      allMissingKeys.add(key);
    });
    totalMissingKeys += missingKeys.length;
  } else {
    console.log(`  ✅ All translation keys present (${translationKeys.length} keys)`);
  }
  
  if (hardcodedStrings.length > 0) {
    console.log(`  ⚠️  Potential hardcoded strings (${hardcodedStrings.length}):`);
    hardcodedStrings.slice(0, 3).forEach(item => {
      console.log(`    Line ${item.line}: "${item.text}"`);
    });
    if (hardcodedStrings.length > 3) {
      console.log(`    ... and ${hardcodedStrings.length - 3} more`);
    }
    totalHardcodedStrings += hardcodedStrings.length;
  } else {
    console.log(`  ✅ No hardcoded strings detected`);
  }
  
  console.log('');
});

// Summary
console.log('📊 Translation Test Summary:');
console.log('══════════════════════════════');
console.log(`🔑 Total missing translation keys: ${totalMissingKeys}`);
console.log(`⚠️  Total potential hardcoded strings: ${totalHardcodedStrings}`);

if (allMissingKeys.size > 0) {
  console.log('\n🔧 Missing keys to add to cs.json:');
  console.log('──────────────────────────────────');
  
  const keysBySection = {};
  Array.from(allMissingKeys).forEach(key => {
    const section = key.split('.')[0];
    if (!keysBySection[section]) {
      keysBySection[section] = [];
    }
    keysBySection[section].push(key);
  });
  
  Object.keys(keysBySection).sort().forEach(section => {
    console.log(`\n[${section}]`);
    keysBySection[section].sort().forEach(key => {
      console.log(`"${key.split('.').slice(1).join('.')}" : "TODO: Add Czech translation"`);
    });
  });
}

// UX/UI Test scenarios
console.log('\n🎯 UX/UI Test Scenarios:');
console.log('═══════════════════════════');

const testScenarios = [
  {
    name: 'Language Persistence',
    description: 'Test that language preference persists across sessions',
    steps: [
      '1. Login to the app',
      '2. Change language to Czech in settings',
      '3. Refresh the page',
      '4. Verify language is still Czech',
      '5. Logout and login again',
      '6. Verify language is still Czech'
    ]
  },
  {
    name: 'Currency Persistence', 
    description: 'Test that currency preference persists across sessions',
    steps: [
      '1. Login to the app',
      '2. Change currency to CZK in settings',
      '3. Navigate to POS page',
      '4. Verify prices show in CZK',
      '5. Refresh and verify currency persists'
    ]
  },
  {
    name: 'Cross-Device Sync',
    description: 'Test that preferences sync across devices',
    steps: [
      '1. Login on first device',
      '2. Change language and currency',
      '3. Login on second device with same account',
      '4. Verify preferences are synced'
    ]
  },
  {
    name: 'Translation Coverage',
    description: 'Test that all UI elements are translated',
    steps: [
      '1. Set language to Czech',
      '2. Navigate through all pages',
      '3. Open all dialogs and forms',
      '4. Verify no English text remains',
      '5. Test error messages and toasts'
    ]
  },
  {
    name: 'Form Validation',
    description: 'Test that form validation messages are translated',
    steps: [
      '1. Set language to Czech',
      '2. Try to submit empty forms',
      '3. Enter invalid data',
      '4. Verify validation messages are in Czech'
    ]
  }
];

testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log(`   ${scenario.description}`);
  console.log('   Steps:');
  scenario.steps.forEach(step => {
    console.log(`   ${step}`);
  });
});

console.log('\n✅ Translation test complete!');

if (totalMissingKeys === 0 && totalHardcodedStrings === 0) {
  console.log('🎉 All tests passed! The app is fully translated.');
  process.exit(0);
} else {
  console.log('⚠️  Some issues found. Please address the missing translations and hardcoded strings.');
  process.exit(1);
}
