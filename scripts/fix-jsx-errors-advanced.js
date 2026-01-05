#!/usr/bin/env node

/**
 * Script de correction avancée des erreurs JSX
 * Gère les composants auto-fermants et corrige les erreurs récurrentes
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, '../apps/frontend/src/app/(dashboard)/dashboard');

// Composants auto-fermants (ne nécessitent pas de fermeture)
const SELF_CLOSING_COMPONENTS = [
  'Separator', 'Progress', 'Checkbox', 'Input', 'Textarea'
];

// Patterns d'erreurs récurrentes et leurs corrections
const ERROR_PATTERNS = {
  // Supprimer les fermetures pour les composants auto-fermants
  self_closing_close: {
    pattern: /<\/(Separator|Progress|Checkbox|Input|Textarea)>/g,
    fix: (match, component) => {
      // Supprimer la fermeture - ces composants sont auto-fermants
      return '';
    }
  },
  
  // Corriger les fermetures Button en trop
  excess_button_close: {
    detect: (content) => {
      const buttonOpen = (content.match(/<Button[^>]*>/g) || []).length;
      const buttonClose = (content.match(/<\/Button>/g) || []).length;
      return buttonClose > buttonOpen;
    },
    fix: (content) => {
      const lines = content.split('\n');
      const buttonOpen = [];
      const buttonClose = [];
      
      lines.forEach((line, idx) => {
        if (line.includes('<Button') && !line.includes('</Button>')) {
          buttonOpen.push(idx);
        }
        if (line.includes('</Button>')) {
          buttonClose.push(idx);
        }
      });
      
      // Retirer les fermetures en trop (commencer par la fin)
      const excess = buttonClose.length - buttonOpen.length;
      if (excess > 0) {
        for (let i = 0; i < excess && buttonClose.length > 0; i++) {
          const lineIdx = buttonClose.pop();
          if (lineIdx < lines.length) {
            lines[lineIdx] = lines[lineIdx].replace(/<\/Button>/g, '');
            // Si la ligne est maintenant vide, la supprimer
            if (!lines[lineIdx].trim()) {
              lines.splice(lineIdx, 1);
            }
          }
        }
      }
      
      return lines.join('\n');
    }
  },
  
  // Corriger les fermetures Card en trop
  excess_card_close: {
    detect: (content) => {
      const cardOpen = (content.match(/<Card[^>]*>/g) || []).length;
      const cardClose = (content.match(/<\/Card>/g) || []).length;
      return cardClose > cardOpen;
    },
    fix: (content) => {
      const lines = content.split('\n');
      const cardOpen = [];
      const cardClose = [];
      
      lines.forEach((line, idx) => {
        if (line.includes('<Card') && !line.includes('</Card>') && !line.includes('<CardContent')) {
          cardOpen.push(idx);
        }
        if (line.includes('</Card>')) {
          cardClose.push(idx);
        }
      });
      
      const excess = cardClose.length - cardOpen.length;
      if (excess > 0) {
        for (let i = 0; i < excess && cardClose.length > 0; i++) {
          const lineIdx = cardClose.pop();
          if (lineIdx < lines.length) {
            lines[lineIdx] = lines[lineIdx].replace(/<\/Card>/g, '');
            if (!lines[lineIdx].trim()) {
              lines.splice(lineIdx, 1);
            }
          }
        }
      }
      
      return lines.join('\n');
    }
  },
  
  // Corriger les fermetures Badge en trop
  excess_badge_close: {
    detect: (content) => {
      const badgeOpen = (content.match(/<Badge[^>]*>/g) || []).length;
      const badgeClose = (content.match(/<\/Badge>/g) || []).length;
      return badgeClose > badgeOpen;
    },
    fix: (content) => {
      const lines = content.split('\n');
      const badgeOpen = [];
      const badgeClose = [];
      
      lines.forEach((line, idx) => {
        if (line.includes('<Badge') && !line.includes('</Badge>')) {
          badgeOpen.push(idx);
        }
        if (line.includes('</Badge>')) {
          badgeClose.push(idx);
        }
      });
      
      const excess = badgeClose.length - badgeOpen.length;
      if (excess > 0) {
        for (let i = 0; i < excess && badgeClose.length > 0; i++) {
          const lineIdx = badgeClose.pop();
          if (lineIdx < lines.length) {
            lines[lineIdx] = lines[lineIdx].replace(/<\/Badge>/g, '');
            if (!lines[lineIdx].trim()) {
              lines.splice(lineIdx, 1);
            }
          }
        }
      }
      
      return lines.join('\n');
    }
  },
  
  // Corriger les divs en trop
  excess_div_close: {
    detect: (content) => {
      const divOpen = (content.match(/<div[^>]*>/g) || []).length;
      const divClose = (content.match(/<\/div>/g) || []).length;
      return divClose > divOpen;
    },
    fix: (content) => {
      const lines = content.split('\n');
      const divOpen = [];
      const divClose = [];
      
      lines.forEach((line, idx) => {
        if (line.includes('<div') && !line.includes('</div>')) {
          divOpen.push(idx);
        }
        if (line.includes('</div>')) {
          divClose.push(idx);
        }
      });
      
      const excess = divClose.length - divOpen.length;
      if (excess > 0) {
        // Retirer les fermetures en trop de manière intelligente
        // Commencer par les fermetures qui sont seules sur une ligne
        for (let i = 0; i < excess && divClose.length > 0; i++) {
          // Trouver une fermeture seule sur une ligne
          let found = false;
          for (let j = divClose.length - 1; j >= 0; j--) {
            const lineIdx = divClose[j];
            if (lineIdx < lines.length) {
              const line = lines[lineIdx].trim();
              if (line === '</div>' || line.endsWith('</div>')) {
                lines[lineIdx] = lines[lineIdx].replace(/<\/div>/g, '');
                if (!lines[lineIdx].trim()) {
                  lines.splice(lineIdx, 1);
                }
                divClose.splice(j, 1);
                found = true;
                break;
              }
            }
          }
          if (!found && divClose.length > 0) {
            const lineIdx = divClose.pop();
            if (lineIdx < lines.length) {
              lines[lineIdx] = lines[lineIdx].replace(/<\/div>/g, '');
              if (!lines[lineIdx].trim()) {
                lines.splice(lineIdx, 1);
              }
            }
          }
        }
      }
      
      return lines.join('\n');
    }
  }
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let modified = false;
  
  // Appliquer les corrections pour les composants auto-fermants
  SELF_CLOSING_COMPONENTS.forEach(component => {
    const pattern = new RegExp(`</${component}>`, 'g');
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      modified = true;
    }
  });
  
  // Appliquer les corrections pour les erreurs récurrentes
  Object.entries(ERROR_PATTERNS).forEach(([name, pattern]) => {
    if (pattern.detect && pattern.detect(content)) {
      const newContent = pattern.fix(content);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
  });
  
  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  
  return false;
}

function findDashboardFiles(dir) {
  const files = [];
  
  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    });
  }
  
  walkDir(dir);
  return files;
}

function main() {
  console.log('🔧 Correction avancée des erreurs JSX récurrentes...\n');
  
  const files = findDashboardFiles(DASHBOARD_DIR);
  let fixedCount = 0;
  
  files.forEach(file => {
    const relativePath = path.relative(DASHBOARD_DIR, file);
    const fixed = fixFile(file);
    
    if (fixed) {
      fixedCount++;
      console.log(`✅ ${relativePath}`);
    }
  });
  
  console.log(`\n📊 ${fixedCount} fichier(s) corrigé(s) sur ${files.length}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, ERROR_PATTERNS };








