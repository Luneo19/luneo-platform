#!/usr/bin/env node
/**
 * Script d'audit automatisé - Analyse toutes les pages
 * Vérifie: Liens, imports, responsive, cohérence
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_SRC = path.join(__dirname, '../apps/frontend/src/app');
const OUTPUT_FILE = path.join(__dirname, '../AUDIT_RESULTAT_DETAILLE.md');

// Patterns à vérifier
const CHECKS = {
  // Imports potentiellement cassés
  brokenImports: /@luneo\/(virtual-try-on|ar-export|optimization|bulk-generator)/g,
  
  // Liens internes
  internalLinks: /href=["'](\/[^"']*?)["']/g,
  
  // Images non optimisées
  unoptimizedImages: /<img\s+src=/g,
  
  // Inline styles (anti-pattern)
  inlineStyles: /style={{/g,
  
  // Hardcoded URLs
  hardcodedUrls: /https?:\/\/(localhost|127\.0\.0\.1)/g,
  
  // Console.log (à retirer en prod)
  consoleLogs: /console\.(log|debug)/g,
  
  // TODOs non résolus
  todos: /\/\/\s*TODO:/gi,
  
  // Responsive classes
  responsiveClasses: /(sm:|md:|lg:|xl:|2xl:)/g,
};

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
 * Analyse un fichier
 */
function analyzePage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(FRONTEND_SRC, '');
  
  const route = relativePath
    .replace('/page.tsx', '')
    .replace('(public)', '')
    .replace('(dashboard)', '')
    .replace('(auth)', '')
    .replace('//', '/') || '/';
  
  const analysis = {
    route,
    file: relativePath,
    lines: content.split('\n').length,
    issues: [],
    warnings: [],
    links: [],
    responsive: false,
  };
  
  // Check broken package imports
  const brokenImports = content.match(CHECKS.brokenImports);
  if (brokenImports) {
    analysis.issues.push({
      type: 'BROKEN_IMPORT',
      count: brokenImports.length,
      message: `Imports @luneo/* packages qui n'existent pas dans node_modules`
    });
  }
  
  // Extract links
  const links = [...content.matchAll(CHECKS.internalLinks)];
  analysis.links = links.map(m => m[1]);
  
  // Check for potential 404 links
  const suspiciousLinks = analysis.links.filter(link => 
    link.includes('/demo') && !link.match(/\/(virtual-try-on|ar-export|bulk-generation|3d-configurator|playground)$/) && link !== '/demo'
  );
  if (suspiciousLinks.length > 0) {
    analysis.warnings.push({
      type: 'SUSPICIOUS_LINK',
      links: suspiciousLinks,
      message: 'Liens vers /demo/* qui peuvent ne pas exister'
    });
  }
  
  // Check unoptimized images
  const unoptimizedImages = content.match(CHECKS.unoptimizedImages);
  if (unoptimizedImages) {
    analysis.warnings.push({
      type: 'UNOPTIMIZED_IMAGE',
      count: unoptimizedImages.length,
      message: `Utilise <img> au lieu de next/image`
    });
  }
  
  // Check responsive
  const responsiveClasses = content.match(CHECKS.responsiveClasses);
  analysis.responsive = responsiveClasses && responsiveClasses.length > 10;
  
  if (!analysis.responsive) {
    analysis.warnings.push({
      type: 'NO_RESPONSIVE',
      message: 'Peu/pas de classes responsive (sm:, md:, lg:)'
    });
  }
  
  // Check hardcoded URLs
  const hardcodedUrls = content.match(CHECKS.hardcodedUrls);
  if (hardcodedUrls) {
    analysis.issues.push({
      type: 'HARDCODED_URL',
      count: hardcodedUrls.length,
      message: 'URLs localhost hardcodées'
    });
  }
  
  // Check console.logs
  const consoleLogs = content.match(CHECKS.consoleLogs);
  if (consoleLogs) {
    analysis.warnings.push({
      type: 'CONSOLE_LOG',
      count: consoleLogs.length,
      message: 'console.log/debug présents (à retirer en prod)'
    });
  }
  
  // Check TODOs
  const todos = content.match(CHECKS.todos);
  if (todos) {
    analysis.warnings.push({
      type: 'TODO_FOUND',
      count: todos.length,
      message: 'TODOs non résolus dans le code'
    });
  }
  
  return analysis;
}

/**
 * Génère le rapport
 */
function generateReport(results) {
  let report = `# 🔍 AUDIT AUTOMATISÉ - 185 PAGES\n\n`;
  report += `**Date:** ${new Date().toLocaleDateString('fr-FR')}\n`;
  report += `**Pages analysées:** ${results.length}\n\n`;
  report += `---\n\n`;
  
  // Summary
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const totalLines = results.reduce((sum, r) => sum + r.lines, 0);
  const responsivePages = results.filter(r => r.responsive).length;
  
  report += `## 📊 RÉSUMÉ\n\n`;
  report += `| Métrique | Valeur |\n`;
  report += `|----------|--------|\n`;
  report += `| **Pages analysées** | ${results.length} |\n`;
  report += `| **Lignes totales** | ${totalLines.toLocaleString()} |\n`;
  report += `| **Issues critiques** | ${totalIssues} |\n`;
  report += `| **Warnings** | ${totalWarnings} |\n`;
  report += `| **Pages responsive** | ${responsivePages}/${results.length} (${Math.round(responsivePages/results.length*100)}%) |\n`;
  report += `\n---\n\n`;
  
  // Issues par type
  const issuesByType = {};
  results.forEach(r => {
    r.issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = { count: 0, pages: [] };
      }
      issuesByType[issue.type].count += issue.count || 1;
      issuesByType[issue.type].pages.push(r.route);
    });
  });
  
  if (Object.keys(issuesByType).length > 0) {
    report += `## 🚨 ISSUES CRITIQUES\n\n`;
    Object.entries(issuesByType).forEach(([type, data]) => {
      report += `### ${type} (${data.count} occurrences)\n\n`;
      report += `Pages affectées: ${data.pages.slice(0, 10).join(', ')}\n`;
      if (data.pages.length > 10) {
        report += `... et ${data.pages.length - 10} autres\n`;
      }
      report += `\n`;
    });
    report += `---\n\n`;
  }
  
  // Détails par page (top issues)
  report += `## 📄 DÉTAILS PAR PAGE\n\n`;
  report += `### Pages avec issues critiques\n\n`;
  
  const pagesWithIssues = results.filter(r => r.issues.length > 0);
  pagesWithIssues.slice(0, 20).forEach(page => {
    report += `#### ${page.route}\n`;
    report += `- **Fichier:** \`${page.file}\`\n`;
    report += `- **Lignes:** ${page.lines}\n`;
    report += `- **Issues:**\n`;
    page.issues.forEach(issue => {
      report += `  - ❌ ${issue.type}: ${issue.message}\n`;
    });
    if (page.warnings.length > 0) {
      report += `- **Warnings:**\n`;
      page.warnings.forEach(warning => {
        report += `  - ⚠️ ${warning.type}: ${warning.message}\n`;
      });
    }
    report += `\n`;
  });
  
  // Toutes les pages (résumé)
  report += `\n---\n\n## 📋 LISTE COMPLÈTE DES PAGES\n\n`;
  report += `| Route | Lignes | Responsive | Issues | Warnings |\n`;
  report += `|-------|--------|------------|--------|----------|\n`;
  results.slice(0, 50).forEach(page => {
    const responsive = page.responsive ? '✅' : '❌';
    report += `| ${page.route} | ${page.lines} | ${responsive} | ${page.issues.length} | ${page.warnings.length} |\n`;
  });
  
  if (results.length > 50) {
    report += `\n*... et ${results.length - 50} autres pages*\n`;
  }
  
  return report;
}

// Main
console.log('🔍 Audit automatisé - Analyse en cours...\n');

const pages = findAllPages(FRONTEND_SRC);
console.log(`✅ ${pages.length} fichiers page.tsx trouvés\n`);

const results = pages.map(analyzePage);
console.log(`✅ Analyse terminée\n`);

const report = generateReport(results);
fs.writeFileSync(OUTPUT_FILE, report);

console.log(`✅ Rapport généré: AUDIT_RESULTAT_DETAILLE.md`);
console.log(`\n📊 Résumé:`);
console.log(`   Pages: ${results.length}`);
console.log(`   Issues: ${results.reduce((sum, r) => sum + r.issues.length, 0)}`);
console.log(`   Warnings: ${results.reduce((sum, r) => sum + r.warnings.length, 0)}`);
console.log(`   Responsive: ${results.filter(r => r.responsive).length}/${results.length}`);

