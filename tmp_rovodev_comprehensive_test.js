#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE CODEBASE ANALYSIS');
console.log('=====================================\n');

// 1. Find hardcoded values
console.log('1. HARDCODED VALUES ANALYSIS:');
console.log('-----------------------------');

const hardcodedPatterns = [
  /localhost:300[0-9]/g,
  /3002|3003/g,
  /"[A-Z]{3}"/g, // Currency codes
  /999|1999|2499/g, // Pricing
  /admin|test|demo/gi,
  /password|secret/gi
];

function scanForHardcoded(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && !['node_modules', 'dist', 'build'].includes(file)) {
      scanForHardcoded(filePath, results);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        hardcodedPatterns.forEach((pattern, index) => {
          const matches = content.match(pattern);
          if (matches) {
            results.push({
              file: filePath,
              pattern: pattern.toString(),
              matches: matches,
              lines: content.split('\n').map((line, i) => 
                pattern.test(line) ? { line: i + 1, content: line.trim() } : null
              ).filter(Boolean)
            });
          }
        });
      } catch (err) {
        // Skip files that can't be read
      }
    }
  });
  
  return results;
}

// 2. Find duplicate code
console.log('\n2. DUPLICATE CODE ANALYSIS:');
console.log('---------------------------');

function findDuplicates(dir) {
  const components = {};
  const functions = {};
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Find React components
      const componentMatches = content.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9]*)\s*(?:\(|\s*=)/g);
      if (componentMatches) {
        componentMatches.forEach(match => {
          const name = match.match(/([A-Z][a-zA-Z0-9]*)/)[1];
          if (!components[name]) components[name] = [];
          components[name].push(filePath);
        });
      }
      
      // Find function definitions
      const functionMatches = content.match(/(?:function|const)\s+([a-z][a-zA-Z0-9]*)\s*(?:\(|\s*=)/g);
      if (functionMatches) {
        functionMatches.forEach(match => {
          const name = match.match(/([a-z][a-zA-Z0-9]*)/)[1];
          if (!functions[name]) functions[name] = [];
          functions[name].push(filePath);
        });
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && !['node_modules', 'dist', 'build'].includes(file)) {
        scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        scanFile(filePath);
      }
    });
  }
  
  scanDirectory(dir);
  
  return { components, functions };
}

// 3. Find unused imports/exports
console.log('\n3. UNUSED CODE ANALYSIS:');
console.log('------------------------');

function findUnusedCode(dir) {
  const exports = new Set();
  const imports = new Set();
  const files = [];
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      files.push({ path: filePath, content });
      
      // Find exports
      const exportMatches = content.match(/export\s+(?:default\s+)?(?:function|const|class|interface|type)\s+([a-zA-Z0-9_]+)/g);
      if (exportMatches) {
        exportMatches.forEach(match => {
          const name = match.match(/([a-zA-Z0-9_]+)$/)[1];
          exports.add(name);
        });
      }
      
      // Find imports
      const importMatches = content.match(/import\s+(?:{[^}]+}|[a-zA-Z0-9_]+)\s+from/g);
      if (importMatches) {
        importMatches.forEach(match => {
          const names = match.match(/{([^}]+)}/);
          if (names) {
            names[1].split(',').forEach(name => {
              imports.add(name.trim());
            });
          }
        });
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }
  
  function scanDirectory(dir) {
    const dirFiles = fs.readdirSync(dir);
    dirFiles.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && !['node_modules', 'dist', 'build'].includes(file)) {
        scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        scanFile(filePath);
      }
    });
  }
  
  scanDirectory(dir);
  
  return { exports, imports, files };
}

// Run analysis
const hardcodedResults = scanForHardcoded('.');
const duplicateResults = findDuplicates('.');
const unusedResults = findUnusedCode('.');

// Report hardcoded values
console.log('🚨 HARDCODED VALUES FOUND:');
hardcodedResults.forEach(result => {
  console.log(`\n📁 ${result.file}`);
  result.lines.forEach(line => {
    console.log(`   Line ${line.line}: ${line.content}`);
  });
});

// Report duplicates
console.log('\n🔄 POTENTIAL DUPLICATES:');
Object.entries(duplicateResults.components).forEach(([name, files]) => {
  if (files.length > 1) {
    console.log(`\n🔸 Component "${name}" found in:`);
    files.forEach(file => console.log(`   - ${file}`));
  }
});

Object.entries(duplicateResults.functions).forEach(([name, files]) => {
  if (files.length > 1) {
    console.log(`\n🔸 Function "${name}" found in:`);
    files.forEach(file => console.log(`   - ${file}`));
  }
});

console.log('\n✅ ANALYSIS COMPLETE');
console.log('====================');