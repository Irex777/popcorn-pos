#!/usr/bin/env node

/**
 * Test runner for error prevention tests
 * Runs all tests designed to catch common runtime errors, auth issues, translation problems, etc.
 */

const { spawn } = require('child_process');
const path = require('path');

const testSuites = [
  'runtime-errors.spec.ts',
  'translation-keys.spec.ts', 
  'auth-validation.spec.ts',
  'common-runtime-errors.spec.ts'
];

const runTests = async () => {
  console.log('🧪 Running Error Prevention Test Suite');
  console.log('=====================================\n');

  for (const testSuite of testSuites) {
    console.log(`\n🔍 Running ${testSuite}...`);
    
    const testProcess = spawn('npx', ['playwright', 'test', testSuite, '--reporter=list'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    await new Promise((resolve, reject) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${testSuite} passed`);
          resolve();
        } else {
          console.log(`❌ ${testSuite} failed with code ${code}`);
          reject(new Error(`Test suite ${testSuite} failed`));
        }
      });
    });
  }

  console.log('\n🎉 All error prevention tests completed!');
};

// Run with specific focus on error detection
const runWithErrorFocus = async () => {
  console.log('🎯 Running Error Detection Tests');
  console.log('=================================\n');

  // Run specific error-focused tests
  const errorTests = [
    'runtime-errors.spec.ts',
    'common-runtime-errors.spec.ts'
  ];

  for (const testSuite of errorTests) {
    console.log(`\n🔍 Running ${testSuite}...`);
    
    const testProcess = spawn('npx', ['playwright', 'test', testSuite, '--grep', 'undefined|missing|error', '--reporter=list'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    await new Promise((resolve, reject) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${testSuite} error detection passed`);
          resolve();
        } else {
          console.log(`❌ ${testSuite} error detection failed with code ${code}`);
          reject(new Error(`Error detection in ${testSuite} failed`));
        }
      });
    });
  }
};

// Run translation-focused tests
const runTranslationTests = async () => {
  console.log('🌍 Running Translation Tests');
  console.log('============================\n');

  const testProcess = spawn('npx', ['playwright', 'test', 'translation-keys.spec.ts', '--reporter=list'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  await new Promise((resolve, reject) => {
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Translation tests passed`);
        resolve();
      } else {
        console.log(`❌ Translation tests failed with code ${code}`);
        reject(new Error(`Translation tests failed`));
      }
    });
  });
};

// Run authentication tests
const runAuthTests = async () => {
  console.log('🔐 Running Authentication Tests');
  console.log('===============================\n');

  const testProcess = spawn('npx', ['playwright', 'test', 'auth-validation.spec.ts', '--reporter=list'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  await new Promise((resolve, reject) => {
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Authentication tests passed`);
        resolve();
      } else {
        console.log(`❌ Authentication tests failed with code ${code}`);
        reject(new Error(`Authentication tests failed`));
      }
    });
  });
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--errors')) {
      await runWithErrorFocus();
    } else if (args.includes('--translations')) {
      await runTranslationTests();
    } else if (args.includes('--auth')) {
      await runAuthTests();
    } else {
      await runTests();
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
};

main();