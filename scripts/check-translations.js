#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript and TSX files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTsFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to extract translation keys from file content
function extractTranslationKeys(content) {
  const keys = new Set();
  
  // Match t('key') and t("key") patterns
  const regex = /t\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  return Array.from(keys);
}

// Function to check if a key exists in translations
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

// Main function
function checkTranslations() {
  console.log('🔍 Checking for missing translation keys...\n');
  
  // Load Czech translations
  const csTranslationsPath = path.join(__dirname, '../client/src/lib/i18n/cs.json');
  const csTranslations = JSON.parse(fs.readFileSync(csTranslationsPath, 'utf8'));
  
  // Find all TypeScript files in client src
  const clientSrcDir = path.join(__dirname, '../client/src');
  const tsFiles = findTsFiles(clientSrcDir);
  
  const missingKeys = new Set();
  const foundFiles = {};
  
  // Check each file for translation keys
  tsFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const keys = extractTranslationKeys(content);
    
    keys.forEach(key => {
      if (!keyExists(key, csTranslations)) {
        missingKeys.add(key);
        if (!foundFiles[key]) {
          foundFiles[key] = [];
        }
        foundFiles[key].push(path.relative(clientSrcDir, filePath));
      }
    });
  });
  
  if (missingKeys.size === 0) {
    console.log('✅ All translation keys are present in Czech translations!');
  } else {
    console.log(`❌ Found ${missingKeys.size} missing translation keys:\n`);
    
    Array.from(missingKeys).sort().forEach(key => {
      console.log(`🔑 ${key}`);
      console.log(`   Used in: ${foundFiles[key].join(', ')}\n`);
    });
    
    console.log('\n📝 Missing keys organized by section:');
    const keysBySection = {};
    Array.from(missingKeys).forEach(key => {
      const section = key.split('.')[0];
      if (!keysBySection[section]) {
        keysBySection[section] = [];
      }
      keysBySection[section].push(key);
    });
    
    Object.keys(keysBySection).sort().forEach(section => {
      console.log(`\n[${section}]`);
      keysBySection[section].sort().forEach(key => {
        console.log(`  ${key}`);
      });
    });
  }
}

// Run the check
try {
  checkTranslations();
} catch (error) {
  console.error('Error checking translations:', error);
  process.exit(1);
}
