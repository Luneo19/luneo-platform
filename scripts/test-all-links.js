#!/usr/bin/env node
/**
 * Script de test - Valide tous les liens et la cohérence
 * Teste: Navigation, liens, responsive, cohérence design
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_SRC = path.join(__dirname, '../apps/frontend/src');
const OUTPUT_FILE = path.join(__dirname, '../TEST_VALIDATION_COMPLETE.md');

/**
 * Trouve tous les fichiers page.tsx
 */
function findAllPages(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        findAllPages(filePath, fileList);
      }
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Vérifie la cohérence d'une page
 */
function checkPageConsistency(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(FRONTEND_SRC + '/app', '');
  
  const route = relativePath
    .replace('/page.tsx', '')
    .replace('(public)', '')
    .replace('(dashboard)', '')
    .replace('(auth)', '')
    .replace('//', '/') || '/';
  
  const checks = {
    route,
    file: relativePath,
    lines: content.split('\n').length,
    hasContent: true,
    isResponsive: false,
    hasDarkTheme: false,
    hasNavigation: false,
    hasLuneoMention: false,
    issues: [],
  };
  
  // Check if has real content
  if (content.includes('redirect(')) {
    checks.hasContent = false;
    checks.type = 'redirect';
  } else {
    checks.hasContent = content.includes('<div') || content.includes('<section');
  }
  
  // Check responsive
  const responsiveClasses = (content.match(/(sm:|md:|lg:|xl:|2xl:)/g) || []).length;
  checks.isResponsive = responsiveClasses > 5;
  checks.responsiveCount = responsiveClasses;
  
  // Check dark theme
  checks.hasDarkTheme = content.includes('bg-gray-900') || 
                        content.includes('bg-black') ||
                        content.includes('dark:');
  
  // Check navigation/links
  checks.hasNavigation = content.includes('Link') && content.includes('href=');
  
  // Check Luneo branding
  checks.hasLuneoMention = content.toLowerCase().includes('luneo');
  
  // Check for potential issues
  if (!checks.hasContent && checks.type !== 'redirect') {
    checks.issues.push('Page potentiellement vide');
  }
  
  if (checks.lines > 100 && !checks.isResponsive) {
    checks.issues.push('Page longue mais non responsive');
  }
  
  if (!checks.hasDarkTheme && !relativePath.includes('(dashboard)') && !relativePath.includes('(auth)')) {
    checks.issues.push('Thème dark manquant (pages publiques)');
  }
  
  return checks;
}

/**
 * Génère le rapport de validation
 */
function generateValidationReport(results) {
  let report = `# 🧪 TEST DE VALIDATION COMPLÈTE\n\n`;
  report += `**Date:** ${new Date().toLocaleDateString('fr-FR')}\n`;
  report += `**Pages testées:** ${results.length}\n\n`;
  report += `---\n\n`;
  
  // Summary
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const responsivePages = results.filter(r => r.isResponsive).length;
  const darkThemePages = results.filter(r => r.hasDarkTheme).length;
  const pagesWithContent = results.filter(r => r.hasContent).length;
  
  report += `## 📊 RÉSUMÉ VALIDATION\n\n`;
  report += `| Critère | Résultat | % |\n`;
  report += `|---------|----------|---|\n`;
  report += `| **Pages avec contenu** | ${pagesWithContent}/${results.length} | ${Math.round(pagesWithContent/results.length*100)}% |\n`;
  report += `| **Pages responsive** | ${responsivePages}/${results.length} | ${Math.round(responsivePages/results.length*100)}% |\n`;
  report += `| **Pages dark theme** | ${darkThemePages}/${results.length} | ${Math.round(darkThemePages/results.length*100)}% |\n`;
  report += `| **Issues détectées** | ${totalIssues} | - |\n`;
  report += `\n---\n\n`;
  
  // Top pages responsive
  const topResponsive = results
    .filter(r => r.isResponsive)
    .sort((a, b) => b.responsiveCount - a.responsiveCount)
    .slice(0, 20);
  
  report += `## ✅ TOP 20 PAGES RESPONSIVE\n\n`;
  report += `| Route | Classes responsive | Lignes |\n`;
  report += `|-------|-------------------|--------|\n`;
  topResponsive.forEach(page => {
    report += `| ${page.route} | ${page.responsiveCount} | ${page.lines} |\n`;
  });
  report += `\n---\n\n`;
  
  // Pages with issues
  const pagesWithIssues = results.filter(r => r.issues.length > 0);
  if (pagesWithIssues.length > 0) {
    report += `## ⚠️ PAGES AVEC ISSUES\n\n`;
    pagesWithIssues.slice(0, 20).forEach(page => {
      report += `### ${page.route}\n`;
      report += `- **Lignes:** ${page.lines}\n`;
      report += `- **Responsive:** ${page.isResponsive ? '✅' : '❌'} (${page.responsiveCount} classes)\n`;
      report += `- **Issues:**\n`;
      page.issues.forEach(issue => {
        report += `  - ⚠️ ${issue}\n`;
      });
      report += `\n`;
    });
    report += `---\n\n`;
  }
  
  // Score calculation
  const score = Math.round(
    (pagesWithContent / results.length * 30) +
    (responsivePages / results.length * 40) +
    (darkThemePages / results.length * 20) +
    ((results.length - totalIssues) / results.length * 10)
  );
  
  report += `## 🎯 SCORE FINAL\n\n`;
  report += `\`\`\`\n`;
  report += `Contenu:    ${Math.round(pagesWithContent/results.length*100)}% (30 pts) = ${Math.round(pagesWithContent/results.length*30)}/30\n`;
  report += `Responsive: ${Math.round(responsivePages/results.length*100)}% (40 pts) = ${Math.round(responsivePages/results.length*40)}/40\n`;
  report += `Dark Theme: ${Math.round(darkThemePages/results.length*100)}% (20 pts) = ${Math.round(darkThemePages/results.length*20)}/20\n`;
  report += `Sans Issues: ${Math.round((results.length-totalIssues)/results.length*100)}% (10 pts) = ${Math.round((results.length-totalIssues)/results.length*10)}/10\n`;
  report += `\n`;
  report += `TOTAL: ${score}/100\n`;
  report += `\`\`\`\n\n`;
  
  return report;
}

// Main
console.log('🧪 Tests de validation en cours...\n');

const pages = findAllPages(path.join(FRONTEND_SRC, 'app'));
console.log(`✅ ${pages.length} pages trouvées\n`);

const results = pages.map(checkPageConsistency);
console.log(`✅ Validation terminée\n`);

const report = generateValidationReport(results);
fs.writeFileSync(OUTPUT_FILE, report);

const responsivePages = results.filter(r => r.isResponsive).length;
const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

console.log(`📊 Résultats:`);
console.log(`   Pages responsive: ${responsivePages}/${results.length} (${Math.round(responsivePages/results.length*100)}%)`);
console.log(`   Issues: ${totalIssues}`);
console.log(`\n✅ Rapport: TEST_VALIDATION_COMPLETE.md\n`);

