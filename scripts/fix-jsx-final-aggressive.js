#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'ab-testing/page.tsx',
  'affiliate/page.tsx',
  'ai-studio/animations/page.tsx',
  'ai-studio/page.tsx',
];

const dashboardPath = path.join(__dirname, '../apps/frontend/src/app/(dashboard)/dashboard');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix: Missing </Button> before </div> followed by ))}
  content = content.replace(
    /(\{[^}]*\})\s*\n\s*<\/div>\s*\n\s*\)\)\}/g,
    (match) => {
      const beforeMatch = content.substring(0, content.indexOf(match));
      const lastButton = beforeMatch.lastIndexOf('<Button');
      if (lastButton > -1) {
        const afterButton = beforeMatch.substring(lastButton);
        if (!afterButton.includes('</Button>')) {
          return match.replace(/(\{[^}]*\})\s*\n\s*<\/div>\s*\n\s*\)\)\}/, '$1\n                        </Button>\n                      </div>\n                    ))}');
        }
      }
      return match;
    }
  );

  // Fix: Missing closing tags before ))}
  content = content.replace(
    /(Réutiliser|Réinitialiser|Configurer|Utiliser|Connecter|Gérer|Explorer|Créer|Activer|Appliquer)\s*\n\s*<\/div>\s*\n\s*\)\)\}/g,
    (match, text) => {
      return `${text}\n                        </Button>\n                      </div>\n                    ))}`;
    }
  );

  // Fix: Orphan </Badge> tags
  content = content.replace(/\s*<\/Badge>\s*\n\s*<\/div>\s*\n\s*<div/g, '\n                    </div>\n                    <div');

  // Fix: Missing </Button> in conditional
  content = content.replace(
    /(\{[^}]*\})\s*\n\s*\)\)\}/g,
    (match) => {
      const beforeMatch = content.substring(0, content.indexOf(match));
      if (beforeMatch.includes('<Button') && !beforeMatch.substring(beforeMatch.lastIndexOf('<Button')).includes('</Button>')) {
        return match.replace(/(\{[^}]*\})\s*\n\s*\)\)\}/, '$1\n              </Button>\n            ))}');
      }
      return match;
    }
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

console.log('🔧 Correction agressive des erreurs JSX...\n');

let fixed = 0;
files.forEach(file => {
  const filePath = path.join(dashboardPath, file);
  if (fs.existsSync(filePath)) {
    if (fixFile(filePath)) {
      console.log(`✅ ${file}`);
      fixed++;
    } else {
      console.log(`⏭️  ${file} (pas de corrections)`);
    }
  }
});

console.log(`\n📊 ${fixed} fichier(s) corrigé(s)`);







