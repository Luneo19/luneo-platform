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

  // Fix pattern 1: Missing </Button> before </div> followed by ))}
  content = content.replace(
    /(\{[^}]*\})\s*\n\s*<\/div>\s*\n\s*\)\)\}/g,
    (match, text) => {
      // Check if we're inside a Button
      const beforeMatch = content.substring(0, content.indexOf(match));
      const lastButton = beforeMatch.lastIndexOf('<Button');
      if (lastButton > -1) {
        const afterButton = beforeMatch.substring(lastButton);
        if (!afterButton.includes('</Button>')) {
          return `${text}\n                    </Button>\n                  </div>\n                ))}`;
        }
      }
      return match;
    }
  );

  // Fix pattern 2: Missing closing tag before </CardContent> followed by ))}
  content = content.replace(
    /<\/CardContent>\s*\n\s*<\/Card>\s*\n\s*\)\)\}/g,
    (match) => {
      const beforeMatch = content.substring(0, content.indexOf(match));
      // Check for unclosed Button
      const buttons = (beforeMatch.match(/<Button[^>]*>/g) || []).length;
      const closedButtons = (beforeMatch.match(/<\/Button>/g) || []).length;
      if (buttons > closedButtons) {
        return '</Button>\n                </CardContent>\n              </Card>\n            ))}';
      }
      return match;
    }
  );

  // Fix pattern 3: Missing </Button> after text content before </div>
  content = content.replace(
    /(Cr er une planification|Appliquer|Configurer|Utiliser|Connecter|Gérer|Explorer|Activer)\s*\n\s*<\/div>/g,
    (match, text) => {
      return `${text}\n                  </Button>\n                </div>`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

console.log('🔧 Correction finale des erreurs JSX...\n');

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







