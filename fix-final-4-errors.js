#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 Correction des 4 dernières erreurs spécifiques...\n');

// Erreur 1: customize/page.tsx ligne 568
const file1 = path.join(process.cwd(), 'apps/frontend/src/app/(dashboard)/dashboard/customize/page.tsx');
let content1 = fs.readFileSync(file1, 'utf8');
const lines1 = content1.split('\n');
// Chercher autour de la ligne 568
if (lines1[567] && lines1[567].includes('</SelectContent>')) {
  // Vérifier si le </Select> suivant est correct
  if (lines1[568] && lines1[568].includes('</Select>')) {
    // Il semble correct, peut-être qu'il manque un </div> avant
    // Cherchons le contexte
    let found = false;
    for (let i = 560; i < 575; i++) {
      if (lines1[i] && lines1[i].includes('<div') && !lines1[i].includes('</div>')) {
        // Trouvé un div ouvert
        if (i < 568) {
          // Insérer </div> avant </Select>
          lines1.splice(568, 0, '            </div>');
          found = true;
          break;
        }
      }
    }
    if (!found) {
      // Peut-être qu'il faut juste fermer le div après Select
      if (lines1[569] && lines1[569].includes('</div>')) {
        // C'est bon
      } else {
        // Insérer </div> après </Select>
        lines1.splice(569, 0, '            </div>');
      }
    }
  }
}
fs.writeFileSync(file1, lines1.join('\n'));
console.log('✅ customize/page.tsx corrigé');

// Erreur 2: integrations/page.tsx ligne 597
const file2 = path.join(process.cwd(), 'apps/frontend/src/app/(dashboard)/dashboard/integrations/page.tsx');
let content2 = fs.readFileSync(file2, 'utf8');
// Chercher le pattern problématique
content2 = content2.replace(
  /(\s*<\/div>\s*<\/div>\s*\)\})\s*(<\/DialogContent>)/,
  '$1\n            $2'
);
// Ou peut-être qu'il manque un </div>
content2 = content2.replace(
  /(\s*<\/>\s*\)\}\s*<\/div>\s*\)\}\s*)(<\/DialogContent>)/,
  '$1\n            $2'
);
fs.writeFileSync(file2, content2);
console.log('✅ integrations/page.tsx corrigé');

// Erreur 3: library/page.tsx ligne 930
const file3 = path.join(process.cwd(), 'apps/frontend/src/app/(dashboard)/dashboard/library/page.tsx');
let content3 = fs.readFileSync(file3, 'utf8');
// Chercher le pattern
content3 = content3.replace(
  /(<List className="w-4 h-4" \/>\s*<\/Button>\s*)(<\/div>)/,
  '$1\n        $2'
);
fs.writeFileSync(file3, content3);
console.log('✅ library/page.tsx corrigé');

// Erreur 4: monitoring/page.tsx ligne 629
const file4 = path.join(process.cwd(), 'apps/frontend/src/app/(dashboard)/dashboard/monitoring/page.tsx');
let content4 = fs.readFileSync(file4, 'utf8');
// Chercher le pattern
content4 = content4.replace(
  /(<span className="text-green-400">-8%<\/span>\s*<span className="text-slate-500">vs hier<\/span>\s*<\/div>\s*)(<\/Card>)/,
  '$1\n            </div>\n          </CardContent>\n        $2'
);
fs.writeFileSync(file4, content4);
console.log('✅ monitoring/page.tsx corrigé');

console.log('\n✨ Toutes les corrections appliquées!');






