#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class CodeAuditor {
  constructor() {
    this.duplicates = [];
    this.unused = [];
    this.hardcoded = [];
    this.issues = [];
    this.fileContents = new Map();
  }

  // Read all relevant files
  readFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const files = [];
    
    function traverse(currentDir) {
      if (currentDir.includes('node_modules') || currentDir.includes('.git') || currentDir.includes('dist')) return;
      
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  // Check for hardcoded values
  findHardcodedValues() {
    console.log('🔍 Scanning for hardcoded values...');
    
    const hardcodedPatterns = [
      /localhost:\d+/g,
      /http:\/\/[^"'\s]+/g,
      /\b\d{4,5}\b/g, // Port numbers
      /'[^']*3002[^']*'/g,
      /'[^']*3003[^']*'/g,
      /\$\{[^}]*\}/g, // Template literals that might be hardcoded
    ];

    const files = this.readFiles('./');
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        this.fileContents.set(file, content);
        
        for (const pattern of hardcodedPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              this.hardcoded.push({
                file,
                match,
                line: this.getLineNumber(content, match)
              });
            });
          }
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }
  }

  // Find duplicate code blocks
  findDuplicates() {
    console.log('🔍 Scanning for duplicate code...');
    
    const codeBlocks = new Map();
    
    for (const [file, content] of this.fileContents) {
      // Look for function definitions
      const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]+}/g) || [];
      const arrowFunctionMatches = content.match(/const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[^}]+}/g) || [];
      const componentMatches = content.match(/export\s+(default\s+)?function\s+\w+[^{]*{[^}]+}/g) || [];
      
      [...functionMatches, ...arrowFunctionMatches, ...componentMatches].forEach(block => {
        const normalized = block.replace(/\s+/g, ' ').trim();
        if (normalized.length > 50) { // Only check substantial blocks
          if (codeBlocks.has(normalized)) {
            this.duplicates.push({
              block: normalized.substring(0, 100) + '...',
              files: [codeBlocks.get(normalized), file]
            });
          } else {
            codeBlocks.set(normalized, file);
          }
        }
      });
    }
  }

  // Find unused imports and exports
  findUnused() {
    console.log('🔍 Scanning for unused code...');
    
    const exports = new Map();
    const imports = new Map();
    
    for (const [file, content] of this.fileContents) {
      // Find exports
      const exportMatches = content.match(/export\s+(const|function|class|default)\s+(\w+)/g) || [];
      exportMatches.forEach(match => {
        const name = match.split(/\s+/).pop();
        if (!exports.has(name)) exports.set(name, []);
        exports.get(name).push(file);
      });
      
      // Find imports
      const importMatches = content.match(/import\s+.*?from\s+['"][^'"]+['"]/g) || [];
      importMatches.forEach(match => {
        const importedItems = match.match(/{\s*([^}]+)\s*}/) || match.match(/import\s+(\w+)/);
        if (importedItems) {
          const items = importedItems[1].split(',').map(s => s.trim());
          items.forEach(item => {
            if (!imports.has(item)) imports.set(item, []);
            imports.get(item).push(file);
          });
        }
      });
    }
    
    // Check for unused exports
    for (const [exportName, files] of exports) {
      if (!imports.has(exportName) && exportName !== 'default') {
        this.unused.push({
          type: 'export',
          name: exportName,
          files
        });
      }
    }
  }

  // Check for workflow issues
  checkWorkflowIssues() {
    console.log('🔍 Checking workflow integrity...');
    
    // Check for missing error handling
    for (const [file, content] of this.fileContents) {
      if (content.includes('fetch(') && !content.includes('catch')) {
        this.issues.push({
          type: 'missing-error-handling',
          file,
          description: 'fetch() call without error handling'
        });
      }
      
      if (content.includes('async ') && !content.includes('try')) {
        this.issues.push({
          type: 'missing-try-catch',
          file,
          description: 'async function without try-catch'
        });
      }
    }
  }

  getLineNumber(content, searchString) {
    const lines = content.substring(0, content.indexOf(searchString)).split('\n');
    return lines.length;
  }

  generateReport() {
    console.log('\n📊 COMPREHENSIVE CODE AUDIT REPORT\n');
    console.log('=' .repeat(50));
    
    console.log('\n🔴 HARDCODED VALUES:');
    if (this.hardcoded.length === 0) {
      console.log('✅ No hardcoded values found');
    } else {
      this.hardcoded.forEach(item => {
        console.log(`  📁 ${item.file}:${item.line} - "${item.match}"`);
      });
    }
    
    console.log('\n🔴 DUPLICATE CODE:');
    if (this.duplicates.length === 0) {
      console.log('✅ No duplicate code blocks found');
    } else {
      this.duplicates.forEach(item => {
        console.log(`  🔄 "${item.block}"`);
        console.log(`     Files: ${item.files.join(', ')}`);
      });
    }
    
    console.log('\n🔴 UNUSED CODE:');
    if (this.unused.length === 0) {
      console.log('✅ No unused exports found');
    } else {
      this.unused.forEach(item => {
        console.log(`  🗑️  ${item.type}: ${item.name} in ${item.files.join(', ')}`);
      });
    }
    
    console.log('\n🔴 WORKFLOW ISSUES:');
    if (this.issues.length === 0) {
      console.log('✅ No workflow issues found');
    } else {
      this.issues.forEach(item => {
        console.log(`  ⚠️  ${item.file}: ${item.description}`);
      });
    }
    
    console.log('\n📈 SUMMARY:');
    console.log(`  • Hardcoded values: ${this.hardcoded.length}`);
    console.log(`  • Duplicate blocks: ${this.duplicates.length}`);
    console.log(`  • Unused exports: ${this.unused.length}`);
    console.log(`  • Workflow issues: ${this.issues.length}`);
    
    const totalIssues = this.hardcoded.length + this.duplicates.length + this.unused.length + this.issues.length;
    console.log(`  • Total issues: ${totalIssues}`);
    
    if (totalIssues === 0) {
      console.log('\n🎉 EXCELLENT! No issues found in the codebase.');
    } else {
      console.log('\n🔧 Issues found that need attention.');
    }
  }

  async run() {
    console.log('🚀 Starting comprehensive code audit...\n');
    
    this.findHardcodedValues();
    this.findDuplicates();
    this.findUnused();
    this.checkWorkflowIssues();
    
    this.generateReport();
  }
}

// Run the audit
const auditor = new CodeAuditor();
auditor.run().catch(console.error);