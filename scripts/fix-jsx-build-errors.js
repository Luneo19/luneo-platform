#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '../apps/frontend/src/app/(dashboard)/dashboard');

const filesToFix = [
  'ab-testing/page.tsx',
  'affiliate/page.tsx',
  'ai-studio/animations/page.tsx',
  'ai-studio/page.tsx',
  'ai-studio/templates/page.tsx',
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix: Missing </Button> before ))}
  const missingButtonClose = /(\{integration\.name\}|\{format\.name\}|\{action\.name\}|\{integration\})\s*\n\s*\)\)\}/g;
  if (missingButtonClose.test(content)) {
    content = content.replace(/(\{integration\.name\}|\{format\.name\}|\{action\.name\}|\{integration\})\s*\n\s*\)\)\}/g, (match) => {
      return match.replace(/\)\)\}/g, '</Button>\n            ))}');
    });
    modified = true;
  }

  // Fix: Missing </Button> before </div> and ))}
  const missingButtonClose2 = /(Appliquer|Configurer|Utiliser|Connecter|Gérer)\s*\n\s*<\/div>\s*\n\s*\)\)\}/g;
  if (missingButtonClose2.test(content)) {
    content = content.replace(/(Appliquer|Configurer|Utiliser|Connecter|Gérer)\s*\n\s*<\/div>\s*\n\s*\)\)\}/g, (match) => {
      return match.replace(/<\/div>\s*\n\s*\)\)\}/g, '</Button>\n                    </div>\n                  ))}');
    });
    modified = true;
  }

  // Fix: Orphan </Badge> tags before return statements
  const orphanBadge = /\s*<\/Badge>\s*\n\s*return\s*\(/g;
  if (orphanBadge.test(content)) {
    content = content.replace(/\s*<\/Badge>\s*\n\s*return\s*\(/g, '\n                      return (');
    modified = true;
  }

  // Fix: Missing closing tags in map functions
  const missingCloseInMap = /const\s+Icon\s*=\s*\w+\.icon;\s*\n\s*\)\)\}/g;
  if (missingCloseInMap.test(content)) {
    content = content.replace(/const\s+Icon\s*=\s*\w+\.icon;\s*\n\s*\)\)\}/g, (match) => {
      return match.replace(/\)\)\}/g, 'return (\n                        <div>...</div>\n                      );\n                    ))}');
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

console.log('🔧 Correction des erreurs JSX de build...\n');

let fixedCount = 0;
filesToFix.forEach(file => {
  const filePath = path.join(dashboardPath, file);
  if (fs.existsSync(filePath)) {
    if (fixFile(filePath)) {
      console.log(`✅ ${file}`);
      fixedCount++;
    } else {
      console.log(`⏭️  ${file} (pas de corrections automatiques possibles)`);
    }
  } else {
    console.log(`❌ ${file} (fichier non trouvé)`);
  }
});

console.log(`\n📊 ${fixedCount} fichier(s) corrigé(s)`);








