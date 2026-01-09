#!/usr/bin/env node

/**
 * Script final de correction des erreurs JSX restantes
 * Corrige toutes les erreurs identifiées dans les logs de build
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, '../apps/frontend/src/app/(dashboard)/dashboard');

// Erreurs spécifiques identifiées dans les logs
const SPECIFIC_FIXES = [
  {
    file: 'ab-testing/page.tsx',
    line: 1777,
    issue: 'Unterminated regexp literal - probablement structure JSX incorrecte',
    fix: (lines) => {
      // Vérifier la structure autour de la ligne 1777
      if (lines[1776] && lines[1776].includes('})')) {
        // La structure semble correcte, peut-être un problème de caractère
        // Vérifier s'il y a des caractères spéciaux
        lines[1776] = lines[1776].replace(/[^\x20-\x7E\n\r\t]/g, '');
      }
      return lines;
    }
  },
  {
    file: 'affiliate/page.tsx',
    line: 3573,
    issue: 'Button non fermé',
    fix: (lines) => {
      if (lines[3572] && lines[3572].includes('<Button') && !lines[3572].includes('</Button>')) {
        if (lines[3573] && lines[3573].includes('Configurer')) {
          // Ajouter </Button> après "Configurer"
          const indent = '                        ';
          lines.splice(3574, 0, `${indent}</Button>\n`);
        }
      }
      return lines;
    }
  },
  {
    file: 'ai-studio/animations/page.tsx',
    line: 2739,
    issue: 'Badge non fermé',
    fix: (lines) => {
      if (lines[2738] && lines[2738].includes('<Badge') && !lines[2738].includes('</Badge>')) {
        if (lines[2738].includes('Actif')) {
          // Fermer le Badge
          const indent = '                           ';
          lines[2738] = lines[2738].replace('Actif', 'Actif</Badge>');
        }
      }
      return lines;
    }
  }
];

function fixFile(filePath, fixes) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let lines = content.split('\n');
  let modified = false;
  
  fixes.forEach(fix => {
    const before = lines.join('\n');
    lines = fix.fix(lines);
    const after = lines.join('\n');
    if (before !== after) {
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function findAndFixAllButtons(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let modified = false;
  
  // Trouver tous les Buttons non fermés
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Si la ligne contient <Button mais pas </Button> et pas />
    if (line.includes('<Button') && !line.includes('</Button>') && !line.includes('/>')) {
      // Vérifier les lignes suivantes
      let foundClose = false;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].includes('</Button>')) {
          foundClose = true;
          break;
        }
        // Si on trouve </div> ou </CardContent> avant </Button>, c'est une erreur
        if (lines[j].includes('</div>') || lines[j].includes('</CardContent>') || lines[j].includes('</Card>')) {
          // Ajouter </Button> avant cette ligne
          const indent = line.match(/^(\s*)/)[1];
          lines.splice(j, 0, `${indent}</Button>`);
          modified = true;
          foundClose = true;
          break;
        }
      }
    }
    
    // Même chose pour Badge
    if (line.includes('<Badge') && !line.includes('</Badge>') && !line.includes('/>')) {
      let foundClose = false;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].includes('</Badge>')) {
          foundClose = true;
          break;
        }
        if (lines[j].includes('</div>') || lines[j].includes('</CardContent>')) {
          const indent = line.match(/^(\s*)/)[1];
          lines.splice(j, 0, `${indent}</Badge>`);
          modified = true;
          foundClose = true;
          break;
        }
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔧 Correction finale des erreurs JSX...\n');
  
  let fixedCount = 0;
  
  // Appliquer les corrections spécifiques
  SPECIFIC_FIXES.forEach(({ file, issue, fix }) => {
    const filePath = path.join(DASHBOARD_DIR, file);
    if (fs.existsSync(filePath)) {
      const fixed = fixFile(filePath, [fix]);
      if (fixed) {
        fixedCount++;
        console.log(`✅ ${file} - ${issue}`);
      }
    }
  });
  
  // Correction générale pour tous les fichiers
  const files = [
    'ab-testing/page.tsx',
    'affiliate/page.tsx',
    'ai-studio/animations/page.tsx',
    'ai-studio/templates/page.tsx',
    'ai-studio/3d/page.tsx',
    'integrations/page.tsx',
    'ar-studio/preview/page.tsx',
    'analytics/page.tsx'
  ];
  
  files.forEach(file => {
    const filePath = path.join(DASHBOARD_DIR, file);
    if (fs.existsSync(filePath)) {
      const fixed = findAndFixAllButtons(filePath);
      if (fixed) {
        if (!SPECIFIC_FIXES.find(f => f.file === file)) {
          fixedCount++;
          console.log(`✅ ${file} - Buttons/Badges corrigés`);
        }
      }
    }
  });
  
  console.log(`\n📊 ${fixedCount} fichier(s) corrigé(s)\n`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, findAndFixAllButtons };











