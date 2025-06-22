#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test the translation loading by simulating the i18n setup
console.log('🧪 Testing translation loading...\n');

try {
  // Load the Czech translations
  const csPath = path.join(__dirname, '../client/src/lib/i18n/cs.json');
  const csTranslations = JSON.parse(fs.readFileSync(csPath, 'utf8'));
  
  console.log('✅ Czech translations loaded successfully');
  console.log(`📊 Total keys found: ${countKeys(csTranslations)}\n`);
  
  // Test specific keys that should be in the inventory dialog
  const testKeys = [
    'inventory.createProduct',
    'inventory.productName', 
    'inventory.price',
    'inventory.category',
    'inventory.selectCategory',
    'inventory.imageUrl',
    'inventory.initialStock',
    'common.create',
    'common.creating'
  ];
  
  console.log('🔍 Testing key inventory dialog keys:');
  testKeys.forEach(key => {
    const value = getNestedValue(csTranslations, key);
    if (value) {
      console.log(`✅ ${key}: "${value}"`);
    } else {
      console.log(`❌ ${key}: MISSING`);
    }
  });
  
  console.log('\n📋 Inventory section content:');
  if (csTranslations.inventory) {
    Object.keys(csTranslations.inventory).forEach(key => {
      console.log(`  inventory.${key}: "${csTranslations.inventory[key]}"`);
    });
  }
  
} catch (error) {
  console.error('❌ Error testing translations:', error);
  process.exit(1);
}

function countKeys(obj, prefix = '') {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key], prefix + key + '.');
    } else {
      count++;
    }
  }
  return count;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}
