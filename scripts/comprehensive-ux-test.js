#!/usr/bin/env node

// Comprehensive UX/UI Testing Script for Popcorn POS
// This script performs end-to-end testing of the application

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Comprehensive UX/UI Testing for Popcorn POS\n');

// Test Configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3002',
  testUser: {
    username: 'testuser',
    password: 'testpassword123'
  },
  expectedLanguage: 'cs',
  expectedCurrency: 'CZK'
};

class UXUITester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} ${message}`);
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    this.log(`Running: ${testName}`, 'info');
    
    try {
      await testFunction();
      this.testResults.passed++;
      this.testResults.details.push({ name: testName, status: 'PASSED' });
      this.log(`${testName}: PASSED`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
      this.log(`${testName}: FAILED - ${error.message}`, 'error');
    }
  }

  async testTranslationCoverage() {
    // Load Czech translations
    const csPath = path.join(__dirname, '../client/src/lib/i18n/cs.json');
    const csTranslations = JSON.parse(fs.readFileSync(csPath, 'utf8'));
    
    // Test critical UI elements have translations
    const criticalKeys = [
      'auth.login',
      'auth.username', 
      'auth.password',
      'common.settings',
      'common.categories',
      'common.pos',
      'inventory.title',
      'inventory.addProduct',
      'categories.title',
      'categories.addCategory',
      'settings.title',
      'settings.language',
      'settings.currency',
      'checkout.title',
      'checkout.pay'
    ];

    let missingKeys = [];
    criticalKeys.forEach(key => {
      if (!this.getNestedValue(csTranslations, key)) {
        missingKeys.push(key);
      }
    });

    if (missingKeys.length > 0) {
      throw new Error(`Missing critical translations: ${missingKeys.join(', ')}`);
    }

    this.log(`All ${criticalKeys.length} critical translation keys are present`);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  async testDefaultLanguageAndCurrency() {
    // Check that default language is Czech
    const settingsPath = path.join(__dirname, '../client/src/lib/settings.ts');
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    
    if (!settingsContent.includes("'cs'")) {
      throw new Error('Default language is not set to Czech (cs)');
    }
    
    if (!settingsContent.includes("'CZK'")) {
      throw new Error('Default currency is not set to Czech Koruna (CZK)');
    }

    this.log('Default language and currency are correctly set to Czech/CZK');
  }

  async testI18nConfiguration() {
    // Check i18n configuration
    const i18nPath = path.join(__dirname, '../client/src/lib/i18n.ts');
    const i18nContent = fs.readFileSync(i18nPath, 'utf8');
    
    if (!i18nContent.includes("lng: 'cs'")) {
      throw new Error('i18n default language is not set to Czech');
    }

    if (!i18nContent.includes("fallbackLng: 'cs'")) {
      throw new Error('i18n fallback language is not set to Czech');
    }

    this.log('i18n configuration is correctly set to Czech');
  }

  async testPreferencesAPI() {
    // Test that the preferences API endpoints are properly defined
    const authPath = path.join(__dirname, '../server/auth.ts');
    const authContent = fs.readFileSync(authPath, 'utf8');
    
    if (!authContent.includes('/api/user/preferences')) {
      throw new Error('User preferences API endpoints are not defined');
    }

    this.log('User preferences API endpoints are properly defined');
  }

  async testDatabaseSchema() {
    // Test that user preferences columns exist in schema
    const schemaPath = path.join(__dirname, '../shared/schema.ts');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    if (!schemaContent.includes('language: text("language")') || 
        !schemaContent.includes('currency: text("currency")')) {
      throw new Error('User preferences columns are not defined in database schema');
    }

    if (!schemaContent.includes("DEFAULT 'cs'") || 
        !schemaContent.includes("DEFAULT 'CZK'")) {
      throw new Error('Default values for user preferences are not set in schema');
    }

    this.log('Database schema includes user preferences with correct defaults');
  }

  async testFileStructure() {
    const requiredFiles = [
      '../client/src/hooks/use-preferences.tsx',
      '../client/src/lib/i18n/cs.json',
      '../client/src/lib/settings.ts',
      '../server/storage.ts',
      '../server/auth.ts',
      '../shared/schema.ts'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    this.log('All required files are present');
  }

  async testComponentTranslations() {
    const componentPaths = [
      '../client/src/pages/auth.tsx',
      '../client/src/pages/categories.tsx', 
      '../client/src/pages/inventory.tsx',
      '../client/src/pages/settings.tsx',
      '../client/src/components/inventory/CreateProductDialog.tsx',
      '../client/src/components/inventory/EditProductDialog.tsx'
    ];

    let totalHardcodedStrings = 0;

    for (const componentPath of componentPaths) {
      const fullPath = path.join(__dirname, componentPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hardcodedStrings = this.findHardcodedStrings(content);
        totalHardcodedStrings += hardcodedStrings.length;
        
        if (hardcodedStrings.length > 0) {
          this.log(`Found ${hardcodedStrings.length} potential hardcoded strings in ${path.basename(componentPath)}`, 'warning');
        }
      }
    }

    if (totalHardcodedStrings > 5) { // Allow some tolerance
      throw new Error(`Too many hardcoded strings found: ${totalHardcodedStrings}`);
    }

    this.log(`Component translation check passed (${totalHardcodedStrings} potential issues found)`);
  }

  findHardcodedStrings(content) {
    const hardcoded = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Look for common UI text patterns that should be translated
      const patterns = [
        />\s*([A-Z][a-zA-Z\s]{3,})</g, // Text between JSX tags
        /placeholder="([^"]{3,})"/g,    // Placeholder text
        /title="([^"]{3,})"/g,          // Title attributes
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const text = match[1].trim();
          // Skip if it's likely a variable or already translated
          if (!text.includes('{') && !text.includes('$') && 
              !line.includes('t(') && text.length > 2 &&
              /^[A-Za-z\s]+$/.test(text) && 
              !['App Name', 'POS', 'ID'].includes(text)) { // Allow some exceptions
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

  async runAllTests() {
    this.log('🧪 Starting UX/UI Test Suite\n');

    await this.runTest('File Structure Check', () => this.testFileStructure());
    await this.runTest('Translation Coverage Check', () => this.testTranslationCoverage());
    await this.runTest('Default Language/Currency Check', () => this.testDefaultLanguageAndCurrency());
    await this.runTest('i18n Configuration Check', () => this.testI18nConfiguration());
    await this.runTest('Preferences API Check', () => this.testPreferencesAPI());
    await this.runTest('Database Schema Check', () => this.testDatabaseSchema());
    await this.runTest('Component Translation Check', () => this.testComponentTranslations());

    this.log('\n📊 Test Results Summary:');
    this.log('═══════════════════════════');
    this.log(`Total Tests: ${this.testResults.total}`);
    this.log(`Passed: ${this.testResults.passed}`, 'success');
    this.log(`Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'error' : 'success');
    this.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      this.log('\n❌ Failed Tests:');
      this.testResults.details.filter(t => t.status === 'FAILED').forEach(test => {
        this.log(`  - ${test.name}: ${test.error}`, 'error');
      });
    }

    // Manual Testing Scenarios
    this.log('\n🎯 Manual Testing Scenarios to Verify:');
    this.log('═══════════════════════════════════════');
    
    const scenarios = [
      {
        name: 'Language Persistence',
        steps: [
          '1. Open http://localhost:3002',
          '2. Verify language selector shows "Čeština" as default',
          '3. Login with any user',
          '4. Go to Settings',
          '5. Verify all text is in Czech',
          '6. Refresh page - verify language persists'
        ]
      },
      {
        name: 'Currency Display',
        steps: [
          '1. Login as admin user',
          '2. Go to Settings',
          '3. Verify currency selector shows "CZK" as default',
          '4. Go to POS page',
          '5. Add products and verify prices show "Kč" symbol'
        ]
      },
      {
        name: 'All Pages Translation',
        steps: [
          '1. Navigate to each page: POS, Historie, Sklad, Kategorie, Analýzy, Nastavení',
          '2. Verify all text is in Czech',
          '3. Open all dialogs and forms',
          '4. Verify no English text remains'
        ]
      },
      {
        name: 'Error Messages',
        steps: [
          '1. Try to create product with empty name',
          '2. Try invalid login',
          '3. Verify all error messages are in Czech'
        ]
      }
    ];

    scenarios.forEach((scenario, index) => {
      this.log(`\n${index + 1}. ${scenario.name}:`);
      scenario.steps.forEach(step => {
        this.log(`   ${step}`);
      });
    });

    if (this.testResults.failed === 0) {
      this.log('\n🎉 All automated tests passed! Ready for manual testing.', 'success');
      return true;
    } else {
      this.log('\n⚠️  Some tests failed. Please fix issues before manual testing.', 'error');
      return false;
    }
  }
}

// Run the tests
const tester = new UXUITester();
tester.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
