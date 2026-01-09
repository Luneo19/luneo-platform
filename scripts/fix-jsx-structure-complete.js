#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '../apps/frontend/src/app/(dashboard)/dashboard');

// Fichiers avec erreurs identifiés
const problemFiles = [
  'ab-testing/page.tsx',
  'affiliate/page.tsx',
  'ai-studio/animations/page.tsx',
  'ai-studio/page.tsx',
  'ai-studio/2d/page.tsx',
];

function fixJSXStructure(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const lines = content.split('\n');
  const fixedLines = [];
  
  // Stack pour suivre les balises ouvertes
  const tagStack = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let processedLine = line;
    
    // Détecter les balises ouvrantes
    const openTagMatch = line.match(/<(\w+)([^>]*?)(\/?)>/g);
    if (openTagMatch) {
      openTagMatch.forEach(tag => {
        const tagName = tag.match(/<(\w+)/)[1];
        const isSelfClosing = tag.includes('/>') || tag.endsWith('/>');
        
        if (!isSelfClosing && ['Button', 'Badge', 'Card', 'CardContent', 'CardHeader', 'div', 'span', 'TabsContent', 'DialogFooter'].includes(tagName)) {
          tagStack.push({ tag: tagName, line: i + 1 });
        }
      });
    }
    
    // Détecter les balises fermantes
    const closeTagMatch = line.match(/<\/(\w+)>/g);
    if (closeTagMatch) {
      closeTagMatch.forEach(tag => {
        const tagName = tag.match(/<\/(\w+)>/)[1];
        // Retirer de la stack
        for (let j = tagStack.length - 1; j >= 0; j--) {
          if (tagStack[j].tag === tagName) {
            tagStack.splice(j, 1);
            break;
          }
        }
      });
    }
    
    // Si on trouve un pattern problématique, corriger
    // Pattern 1: {variable} suivi de </div> sans balise fermante
    if (line.match(/\{[^}]*\}\s*$/) && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.match(/^\s*<\/div>|^\s*\)\)\}|^\s*<\/Card/)) {
        // Vérifier si on a une balise ouverte non fermée
        const lastOpen = tagStack[tagStack.length - 1];
        if (lastOpen && ['Button', 'Badge'].includes(lastOpen.tag)) {
          const indent = line.match(/^(\s*)/)[1];
          processedLine = line + '\n' + indent + `</${lastOpen.tag}>`;
          tagStack.pop();
        }
      }
    }
    
    fixedLines.push(processedLine);
  }
  
  let newContent = fixedLines.join('\n');
  
  // Corrections supplémentaires avec regex
  // Fix: Missing </Button> before </div> and ))}
  newContent = newContent.replace(
    /(Réutiliser|Réinitialiser|Configurer|Utiliser|Connecter|Gérer|Explorer|Créer|Activer|Appliquer|Essayer)\s*\n\s*<\/div>\s*\n\s*\)\)\}/g,
    (match, text) => {
      return `${text}\n                        </Button>\n                      </div>\n                    ))}`;
    }
  );
  
  // Fix: Missing </Badge> before </div>
  newContent = newContent.replace(
    /(\{[^}]*\})\s*\n\s*<\/div>/g,
    (match, content) => {
      const beforeMatch = newContent.substring(0, newContent.indexOf(match));
      if (beforeMatch.lastIndexOf('<Badge') > beforeMatch.lastIndexOf('</Badge>')) {
        return `${content}</Badge>\n                    </div>`;
      }
      return match;
    }
  );
  
  // Fix: Missing closing in conditional Badge
  newContent = newContent.replace(
    /<Badge([^>]*)>(\{[^}]*\})\s*\n\s*\)\s*:/g,
    (match, attrs, content) => {
      return `<Badge${attrs}>${content}</Badge>\n                    ) :`;
    }
  );
  
  if (newContent !== original) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  return false;
}

console.log('🔧 Correction complète de la structure JSX...\n');

let fixedCount = 0;
problemFiles.forEach(file => {
  const filePath = path.join(dashboardPath, file);
  if (fs.existsSync(filePath)) {
    if (fixJSXStructure(filePath)) {
      console.log(`✅ ${file}`);
      fixedCount++;
    } else {
      console.log(`⏭️  ${file} (pas de corrections)`);
    }
  }
});

console.log(`\n📊 ${fixedCount} fichier(s) corrigé(s)`);











