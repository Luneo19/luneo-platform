#!/usr/bin/env node
/**
 * AUDIT COMPLET - PRE & POST LOGIN
 * Audite TOUTES les pages (publiques + dashboard)
 */

const fs = require('fs');
const path = require('path');

const results = {
  public: { total: 0, issues: [], perfect: 0 },
  dashboard: { total: 0, issues: [], perfect: 0 },
  auth: { total: 0, issues: [], perfect: 0 }
};

// Critères d'audit mobile
const MOBILE_CRITERIA = [
  { name: 'min-w-11 présent', pattern: /min-w-11/g, severity: 'ERROR' },
  { name: 'w-12 sans responsive', pattern: /w-12\s+h-12(?![^"]*sm:w)/g, severity: 'WARNING' },
  { name: 'w-16 sans responsive', pattern: /w-16\s+h-16(?![^"]*sm:w)/g, severity: 'WARNING' },
  { name: 'grid-cols-3+ sans mobile', pattern: /grid-cols-[3-9](?![^"]*grid-cols-1)/g, severity: 'ERROR' },
  { name: 'p-8 sans responsive', pattern: /\bp-8\b(?![^"]*p-4)/g, severity: 'WARNING' },
  { name: 'gap-8 sans responsive', pattern: /\bgap-8\b(?![^"]*gap-4)/g, severity: 'WARNING' },
  { name: 'text-5xl+ sans responsive', pattern: /text-[56]xl(?![^"]*text-2xl|text-3xl)/g, severity: 'WARNING' },
  { name: 'px-8 sans responsive', pattern: /\bpx-8\b(?![^"]*px-4)/g, severity: 'WARNING' },
  { name: 'py-20 sans responsive', pattern: /\bpy-20\b(?![^"]*py-12)/g, severity: 'WARNING' },
  { name: 'table sans overflow', pattern: /<table(?![^>]*overflow)/g, severity: 'INFO' },
];

function auditFile(filePath, category) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    let errorCount = 0;
    let warningCount = 0;
    
    MOBILE_CRITERIA.forEach(criterion => {
      const matches = content.match(criterion.pattern);
      if (matches) {
        issues.push({
          criterion: criterion.name,
          count: matches.length,
          severity: criterion.severity
        });
        if (criterion.severity === 'ERROR') errorCount += matches.length;
        if (criterion.severity === 'WARNING') warningCount += matches.length;
      }
    });
    
    const score = Math.max(0, 10 - (errorCount * 0.5) - (warningCount * 0.2));
    
    results[category].total++;
    
    if (issues.length > 0) {
      results[category].issues.push({
        file: path.relative(process.cwd(), filePath),
        issues,
        score: score.toFixed(1),
        errors: errorCount,
        warnings: warningCount
      });
    } else {
      results[category].perfect++;
    }
  } catch (error) {
    // Ignore
  }
}

function scanDirectory(dir, category) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      scanDirectory(fullPath, category);
    } else if (file.name === 'page.tsx' || file.name === 'layout.tsx') {
      auditFile(fullPath, category);
    }
  });
}

// Scan
console.log('🔍 AUDIT COMPLET - PRE & POST LOGIN...\n');

scanDirectory('apps/frontend/src/app/(public)', 'public');
scanDirectory('apps/frontend/src/app/(dashboard)', 'dashboard');
scanDirectory('apps/frontend/src/app/(auth)', 'auth');

// Rapport
console.log('📊 RÉSULTATS AUDIT:\n');

['public', 'dashboard', 'auth'].forEach(cat => {
  const data = results[cat];
  const totalIssues = data.issues.reduce((sum, i) => sum + i.errors + i.warnings, 0);
  const avgScore = data.issues.length > 0 
    ? (data.issues.reduce((sum, i) => sum + parseFloat(i.score), 0) / data.issues.length).toFixed(1)
    : '10.0';
  
  console.log(`${cat.toUpperCase()}:`);
  console.log(`  Pages: ${data.total}`);
  console.log(`  Parfaites: ${data.perfect}/${data.total} (${((data.perfect/data.total)*100).toFixed(0)}%)`);
  console.log(`  Avec issues: ${data.issues.length}`);
  console.log(`  Total issues: ${totalIssues}`);
  console.log(`  Score moyen: ${avgScore}/10\n`);
});

// Top problèmes
console.log('🚨 TOP 10 PAGES AVEC PROBLÈMES:\n');
const allIssues = [...results.public.issues, ...results.dashboard.issues, ...results.auth.issues];
allIssues
  .sort((a, b) => (b.errors + b.warnings) - (a.errors + a.warnings))
  .slice(0, 10)
  .forEach((item, i) => {
    console.log(`${i + 1}. ${item.file} (${item.score}/10)`);
    console.log(`   Errors: ${item.errors}, Warnings: ${item.warnings}`);
  });

// Sauvegarder rapport
const report = {
  date: new Date().toISOString(),
  results,
  summary: {
    totalPages: results.public.total + results.dashboard.total + results.auth.total,
    perfectPages: results.public.perfect + results.dashboard.perfect + results.auth.perfect,
    pagesWithIssues: results.public.issues.length + results.dashboard.issues.length + results.auth.issues.length,
    totalIssues: allIssues.reduce((sum, i) => sum + i.errors + i.warnings, 0)
  }
};

fs.writeFileSync('AUDIT_FINAL_PRE_POST_LOGIN.json', JSON.stringify(report, null, 2));
console.log('\n✅ Rapport sauvegardé: AUDIT_FINAL_PRE_POST_LOGIN.json');

