#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 Correction des 3 dernières erreurs spécifiques...\n');

// Erreur 1: customize/page.tsx ligne 568
const file1 = path.join(process.cwd(), 'apps/frontend/src/app/(dashboard)/dashboard/customize/page.tsx');
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(
  /(<SelectContent>[\s\S]*?<\/SelectContent>\s*)(?=<Select value={statusFilter})/,
  '$1</Select>\n              '
);
fs.writeFileSync(file1, content1);
console.log('✅ customize/page.tsx corrigé');

// Erreur 2: integrations/page.tsx ligne 597
const file2 = path.join(process.cwd(), 'apps/frontend/src/app/(dashboard)/dashboard/integrations/page.tsx');
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(
  /(<\/>\s*\)\}\s*<\/div>\s*\)\}\s*)(?=\s*<DialogFooter>)/,
  '$1</div>\n            '
);
fs.writeFileSync(file2, content2);
console.log('✅ integrations/page.tsx corrigé');

// Erreur 3: library/page.tsx ligne 888
const file3 = path.join(process.cwd(), 'apps/frontend/src/app/(dashboard)/dashboard/library/page.tsx');
let content3 = fs.readFileSync(file3, 'utf8');
content3 = content3.replace(
  /(cat\.count}\s*<\/button>\s*\)\)\})\s*(<\/Card>)/,
  '$1\n        </div>\n        $2'
);
fs.writeFileSync(file3, content3);
console.log('✅ library/page.tsx corrigé');

console.log('\n✨ Toutes les corrections appliquées!');






