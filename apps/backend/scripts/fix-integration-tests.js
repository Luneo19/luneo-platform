/**
 * Script pour mettre à jour les tests d'intégration avec describeIntegration
 */

const fs = require('fs');
const path = require('path');

const testDirs = [
  'test/integration',
  'test/chaos',
  'test/security',
  'test/contract',
  'test/mutation',
];

const importLine = "import { describeIntegration } from '@/common/test/integration-test.helper';";

function fixTestFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already using describeIntegration as main describe
  if (content.match(/^describeIntegration\(/m)) {
    console.log(`Already fixed: ${filePath}`);
    return;
  }
  
  // Add import if not present
  if (!content.includes("describeIntegration")) {
    // Find the last import line
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importLine);
      content = lines.join('\n');
    }
  }
  
  // Replace only the first describe( with describeIntegration(
  // The first describe should be at the start of a line (not indented)
  content = content.replace(/^(describe\()/m, 'describeIntegration(');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

// Process all test files
testDirs.forEach(dir => {
  const fullDir = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullDir)) {
    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.spec.ts'));
    files.forEach(file => {
      fixTestFile(path.join(fullDir, file));
    });
  }
});

console.log('Done!');
