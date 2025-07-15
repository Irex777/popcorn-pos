#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

/**
 * Comprehensive test runner for the Popcorn POS application
 * Runs both Playwright (visual) and Puppeteer (E2E) tests
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`\n${colors.cyan}Running: ${command} ${args.join(' ')}${colors.reset}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`${colors.green}✅ ${command} completed successfully${colors.reset}`);
        resolve(code);
      } else {
        log(`${colors.red}❌ ${command} failed with code ${code}${colors.reset}`);
        reject(new Error(`Command failed: ${command}`));
      }
    });

    child.on('error', (error) => {
      log(`${colors.red}❌ Error running ${command}: ${error.message}${colors.reset}`);
      reject(error);
    });
  });
}

async function main() {
  log(`${colors.bright}🧪 Popcorn POS - Comprehensive Test Suite${colors.reset}`);
  log(`${colors.blue}Running both Playwright (visual) and Puppeteer (E2E) tests${colors.reset}`);

  const testSuites = [
    {
      name: 'TypeScript Check',
      command: 'npm',
      args: ['run', 'check'],
      description: 'Verify TypeScript compilation'
    },
    {
      name: 'Playwright Visual Tests',
      command: 'npm',
      args: ['run', 'test'],
      description: 'Visual regression testing with Playwright'
    },
    {
      name: 'Puppeteer E2E Tests',
      command: 'npm',
      args: ['run', 'test:e2e'],
      description: 'End-to-end testing with Puppeteer'
    }
  ];

  const results = [];
  let totalTests = 0;
  let passedTests = 0;

  for (const suite of testSuites) {
    try {
      log(`\n${colors.yellow}📋 ${suite.name}: ${suite.description}${colors.reset}`);
      await runCommand(suite.command, suite.args);
      results.push({ ...suite, status: 'passed' });
      passedTests++;
    } catch (error) {
      log(`${colors.red}💥 ${suite.name} failed: ${error.message}${colors.reset}`);
      results.push({ ...suite, status: 'failed', error: error.message });
    }
    totalTests++;
  }

  // Summary
  log(`\n${colors.bright}📊 Test Results Summary${colors.reset}`);
  log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  results.forEach(result => {
    const status = result.status === 'passed' 
      ? `${colors.green}✅ PASSED${colors.reset}`
      : `${colors.red}❌ FAILED${colors.reset}`;
    log(`${result.name}: ${status}`);
    if (result.error) {
      log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
    }
  });

  log(`\n${colors.cyan}Total: ${totalTests} suites, ${passedTests} passed, ${totalTests - passedTests} failed${colors.reset}`);

  if (passedTests === totalTests) {
    log(`${colors.green}🎉 All tests passed!${colors.reset}`);
    process.exit(0);
  } else {
    log(`${colors.red}💥 Some tests failed. Check the output above for details.${colors.reset}`);
    process.exit(1);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log(`${colors.bright}Popcorn POS Test Runner${colors.reset}`);
  log(`${colors.cyan}Usage: node tests/run-all-tests.js [options]${colors.reset}`);
  log(`\nOptions:`);
  log(`  --help, -h     Show this help message`);
  log(`\nThis script runs:`);
  log(`  1. TypeScript compilation check`);
  log(`  2. Playwright visual tests`);
  log(`  3. Puppeteer E2E tests`);
  process.exit(0);
}

main().catch((error) => {
  log(`${colors.red}💥 Test runner failed: ${error.message}${colors.reset}`);
  process.exit(1);
});