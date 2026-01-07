#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dashboardPath = path.join(__dirname, '../apps/frontend/src/app/(dashboard)/dashboard');

// Composants qui nécessitent une balise fermante
const requiresClosing = ['Button', 'Badge', 'Card', 'CardContent', 'CardHeader', 'div', 'span', 'p'];

function fixUnclosedTags(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const lines = content.split('\n');
  const fixedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    fixedLines.push(line);
    
    // Chercher les balises ouvertes non fermées
    requiresClosing.forEach(tag => {
      // Pattern: <Tag ...> sans </Tag> avant la fin de la ligne ou la ligne suivante
      const openTagRegex = new RegExp(`<${tag}([^>]*)>`, 'g');
      let match;
      
      while ((match = openTagRegex.exec(line)) !== null) {
        // Vérifier si c'est une balise self-closing
        if (match[1].includes('/') || match[1].trim().endsWith('/')) {
          continue;
        }
        
        // Chercher la balise fermante dans les lignes suivantes (max 20 lignes)
        let foundClosing = false;
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          if (lines[j].includes(`</${tag}>`)) {
            foundClosing = true;
            break;
          }
        }
        
        // Si pas de balise fermante trouvée et que la ligne se termine par {variable}
        if (!foundClosing && line.match(/\{[^}]*\}\s*$/)) {
          // Vérifier la ligne suivante
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            // Si la ligne suivante commence par </div> ou ))} ou similaire
            if (nextLine.match(/^\s*<\/div>|^\s*\)\)\}|^\s*<\/Card/)) {
              // Insérer </Tag> avant cette ligne
              const indent = line.match(/^(\s*)/)[1];
              const insertIndex = fixedLines.length;
              fixedLines.splice(insertIndex, 0, `${indent}</${tag}>`);
              break;
            }
          }
        }
      }
    });
  }
  
  const newContent = fixedLines.join('\n');
  
  // Corrections supplémentaires avec regex
  // Fix: Missing </Button> before </div> followed by ))}
  let finalContent = newContent.replace(
    /(\{[^}]*\})\s*\n\s*<\/div>\s*\n\s*\)\)\}/g,
    (match) => {
      const beforeMatch = newContent.substring(0, newContent.indexOf(match));
      if (beforeMatch.lastIndexOf('<Button') > beforeMatch.lastIndexOf('</Button>')) {
        return match.replace(/(\{[^}]*\})\s*\n\s*<\/div>\s*\n\s*\)\)\}/, '$1\n                        </Button>\n                      </div>\n                    ))}');
      }
      return match;
    }
  );
  
  // Fix: Missing </Badge> before </div>
  finalContent = finalContent.replace(
    /(\{[^}]*\})\s*\n\s*<\/div>/g,
    (match) => {
      const beforeMatch = finalContent.substring(0, finalContent.indexOf(match));
      if (beforeMatch.lastIndexOf('<Badge') > beforeMatch.lastIndexOf('</Badge>')) {
        return match.replace(/(\{[^}]*\})\s*\n\s*<\/div>/, '$1</Badge>\n                    </div>');
      }
      return match;
    }
  );
  
  if (finalContent !== original) {
    fs.writeFileSync(filePath, finalContent, 'utf8');
    return true;
  }
  return false;
}

// Obtenir la liste des fichiers avec erreurs depuis TypeScript
console.log('🔍 Identification des fichiers avec erreurs...\n');
let errorFiles = new Set();

try {
  const tsOutput = execSync('cd apps/frontend && pnpm run type-check 2>&1', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const lines = tsOutput.split('\n');
  lines.forEach(line => {
    const match = line.match(/src\/app\/\(dashboard\)\/dashboard\/([^:]+):/);
    if (match) {
      errorFiles.add(match[1]);
    }
  });
} catch (e) {
  // Ignorer les erreurs d'exécution
}

console.log(`📋 ${errorFiles.size} fichier(s) avec erreurs identifié(s)\n`);

// Corriger tous les fichiers du dashboard
const allFiles = [];
function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(path.relative(dashboardPath, filePath));
    }
  });
  return fileList;
}

walkDir(dashboardPath, allFiles);

console.log('🔧 Correction de toutes les balises non fermées...\n');

let fixedCount = 0;
allFiles.forEach(file => {
  const filePath = path.join(dashboardPath, file);
  if (fixUnclosedTags(filePath)) {
    console.log(`✅ ${file}`);
    fixedCount++;
  }
});

console.log(`\n📊 ${fixedCount} fichier(s) corrigé(s)`);










