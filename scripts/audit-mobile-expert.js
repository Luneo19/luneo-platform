#!/usr/bin/env node
/**
 * AUDIT MOBILE EXPERT - Analyse responsive mobile < 640px
 * Critères: Touch targets, Typography, Layout, Navigation, Performance
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_SRC = path.join(__dirname, '../apps/frontend/src/app');
const OUTPUT_FILE = path.join(__dirname, '../AUDIT_MOBILE_EXPERT_COMPLET.md');

// Critères mobile spécifiques
const MOBILE_CHECKS = {
  // Touch targets 44px minimum
  touchTargets: /className="[^"]*\b(w-\d+|h-\d+|p-\d+|min-w-|min-h-)/g,
  
  // Typography responsive
  responsiveText: /className="[^"]*\b(text-\w+\s+sm:text-|text-xs\s+sm:)/g,
  
  // Layout responsive
  responsiveGrid: /className="[^"]*\b(grid-cols-1\s+sm:grid-cols-|flex-col\s+sm:flex-row)/g,
  
  // Padding/Margin responsive
  responsivePadding: /className="[^"]*\b(px-\d+\s+sm:px-|py-\d+\s+sm:py-|p-\d+\s+sm:p-)/g,
  
  // Gap responsive
  responsiveGap: /className="[^"]*\b(gap-\d+\s+sm:gap-|space-\w+-\d+\s+sm:space-)/g,
  
  // Hidden sur mobile
  hiddenMobile: /className="[^"]*\bhidden\s+sm:block/g,
  
  // Navigation mobile (hamburger)
  mobileMenu: /(hamburger|mobile.*menu|MenuIcon|Menu\s+icon)/gi,
  
  // Overflow mobile
  overflowIssues: /className="[^"]*\b(overflow-x-auto|scrollbar-hide)/g,
};

/**
 * Trouve toutes les pages
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
 * Analyse mobile experte
 */
function mobileExpertAnalysis(filePath) {
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
    mobileScore: 10,
    issues: [],
    recommendations: [],
    checks: {},
  };
  
  // 1. Touch Targets (min 44px)
  const smallButtons = content.match(/className="[^"]*\b(w-\[?[1-9]\]?|h-\[?[1-9]\]?|p-0|p-1)\b/g);
  if (smallButtons && smallButtons.length > 0) {
    analysis.mobileScore -= 1;
    analysis.issues.push(`${smallButtons.length} éléments trop petits pour touch (< 44px)`);
    analysis.recommendations.push('Touch targets minimum 44px: min-w-11 min-h-11 ou p-3');
  }
  
  // 2. Typography responsive
  const nonResponsiveText = content.match(/className="[^"]*\btext-[456]xl\b/g);
  const responsiveText = content.match(MOBILE_CHECKS.responsiveText);
  
  if (nonResponsiveText && nonResponsiveText.length > 5 && (!responsiveText || responsiveText.length < 3)) {
    analysis.mobileScore -= 1.5;
    analysis.issues.push('Typography non responsive pour mobile');
    analysis.recommendations.push('Textes grands: text-2xl sm:text-3xl md:text-4xl');
  }
  
  // 3. Layout responsive
  const responsiveGrid = (content.match(MOBILE_CHECKS.responsiveGrid) || []).length;
  const nonResponsiveGrid = content.match(/className="[^"]*\bgrid-cols-[234]\b/g);
  
  if (nonResponsiveGrid && nonResponsiveGrid.length > 0 && responsiveGrid < 2) {
    analysis.mobileScore -= 1;
    analysis.issues.push('Grids non responsive (risque overflow mobile)');
    analysis.recommendations.push('Grids: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3');
  }
  
  analysis.checks.responsiveGrid = responsiveGrid;
  
  // 4. Padding responsive
  const responsivePadding = (content.match(MOBILE_CHECKS.responsivePadding) || []).length;
  const largePadding = content.match(/className="[^"]*\b(px-1[0-9]|px-20|py-1[0-9]|py-20)\b/g);
  
  if (largePadding && largePadding.length > 0 && responsivePadding < 3) {
    analysis.mobileScore -= 1;
    analysis.issues.push('Padding trop large pour mobile');
    analysis.recommendations.push('Padding responsive: px-4 sm:px-6 md:px-8 lg:px-20');
  }
  
  analysis.checks.responsivePadding = responsivePadding;
  
  // 5. Navigation mobile
  const hasMobileMenu = content.match(MOBILE_CHECKS.mobileMenu);
  const hasHamburger = content.includes('MenuIcon') || content.includes('Menu from') || content.includes('X from');
  
  if (content.includes('nav') && !hasMobileMenu && !hasHamburger && content.length > 500) {
    analysis.mobileScore -= 0.5;
    analysis.recommendations.push('Ajouter hamburger menu pour navigation mobile');
  }
  
  // 6. Overflow mobile
  const hasOverflow = content.match(MOBILE_CHECKS.overflowIssues);
  analysis.checks.hasOverflowHandling = hasOverflow ? hasOverflow.length : 0;
  
  // 7. Images responsive
  const hasNextImage = content.includes('next/image');
  const hasImgTag = content.includes('<img ');
  
  if (hasImgTag && !hasNextImage) {
    analysis.mobileScore -= 1;
    analysis.issues.push('Images non optimisées pour mobile');
    analysis.recommendations.push('Utiliser next/image avec sizes responsive');
  }
  
  // 8. Hidden elements
  const hiddenMobile = (content.match(MOBILE_CHECKS.hiddenMobile) || []).length;
  analysis.checks.hiddenMobile = hiddenMobile;
  
  if (hiddenMobile > 10) {
    analysis.mobileScore -= 0.5;
    analysis.recommendations.push('Trop d\'éléments cachés sur mobile, revoir UX mobile');
  }
  
  // 9. Fixed width elements
  const fixedWidth = content.match(/className="[^"]*\bw-\[\d+px\]\b/g);
  if (fixedWidth && fixedWidth.length > 3) {
    analysis.mobileScore -= 1;
    analysis.issues.push('Éléments width fixe (risque overflow mobile)');
    analysis.recommendations.push('Utiliser w-full max-w-* au lieu de w-[fixed]');
  }
  
  // 10. Horizontal scroll
  if (!content.includes('overflow-x-auto') && content.includes('flex space-x') && content.includes('flex-nowrap')) {
    analysis.mobileScore -= 0.5;
    analysis.recommendations.push('Flex horizontal sans scroll peut déborder sur mobile');
  }
  
  // Score final
  analysis.mobileScore = Math.max(0, Math.min(10, analysis.mobileScore));
  
  // Grade
  if (analysis.mobileScore >= 9.5) analysis.grade = 'A+';
  else if (analysis.mobileScore >= 9) analysis.grade = 'A';
  else if (analysis.mobileScore >= 8) analysis.grade = 'B';
  else if (analysis.mobileScore >= 7) analysis.grade = 'C';
  else analysis.grade = 'D';
  
  return analysis;
}

/**
 * Génère le rapport mobile
 */
function generateMobileReport(results) {
  let report = `# 📱 AUDIT MOBILE EXPERT - 158 PAGES\n\n`;
  report += `**Date:** ${new Date().toLocaleDateString('fr-FR')}\n`;
  report += `**Device:** Mobile < 640px\n`;
  report += `**Standard:** Touch 44px, Typography fluid, No overflow\n\n`;
  report += `---\n\n`;
  
  // Summary
  const avgScore = results.reduce((sum, r) => sum + r.mobileScore, 0) / results.length;
  const gradeDistribution = {};
  results.forEach(r => {
    gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
  });
  
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  
  report += `## 📊 RÉSUMÉ MOBILE\n\n`;
  report += `| Métrique | Valeur |\n`;
  report += `|----------|--------|\n`;
  report += `| **Pages analysées** | ${results.length} |\n`;
  report += `| **Score mobile moyen** | ${avgScore.toFixed(1)}/10 |\n`;
  report += `| **Grade A+** | ${gradeDistribution['A+'] || 0} (${Math.round((gradeDistribution['A+'] || 0)/results.length*100)}%) |\n`;
  report += `| **Grade A** | ${gradeDistribution['A'] || 0} (${Math.round((gradeDistribution['A'] || 0)/results.length*100)}%) |\n`;
  report += `| **Grade B** | ${gradeDistribution['B'] || 0} (${Math.round((gradeDistribution['B'] || 0)/results.length*100)}%) |\n`;
  report += `| **Grade C/D** | ${(gradeDistribution['C'] || 0) + (gradeDistribution['D'] || 0)} |\n`;
  report += `| **Issues mobiles** | ${totalIssues} |\n`;
  report += `\n---\n\n`;
  
  // Pages avec issues
  const pagesWithIssues = results.filter(r => r.issues.length > 0).sort((a, b) => b.issues.length - a.issues.length);
  
  if (pagesWithIssues.length > 0) {
    report += `## 🚨 PAGES AVEC ISSUES MOBILE\n\n`;
    report += `**${pagesWithIssues.length} pages ont des problèmes mobile**\n\n`;
    
    pagesWithIssues.slice(0, 30).forEach((page, i) => {
      report += `### ${i + 1}. ${page.route} (${page.grade} - ${page.mobileScore.toFixed(1)}/10)\n\n`;
      report += `**Issues:**\n`;
      page.issues.forEach(issue => {
        report += `- 🚨 ${issue}\n`;
      });
      report += `\n**Recommandations:**\n`;
      page.recommendations.forEach(rec => {
        report += `- 💡 ${rec}\n`;
      });
      report += `\n`;
    });
    
    report += `---\n\n`;
  }
  
  // Top pages mobile
  const topMobile = results.filter(r => r.mobileScore >= 9.5).sort((a, b) => b.mobileScore - a.mobileScore);
  
  report += `## ✅ TOP PAGES MOBILE (Score >= 9.5)\n\n`;
  report += `**${topMobile.length} pages parfaites pour mobile**\n\n`;
  
  topMobile.slice(0, 20).forEach((page, i) => {
    report += `${i + 1}. **${page.route}** - ${page.mobileScore.toFixed(1)}/10 (${page.grade})\n`;
  });
  
  report += `\n---\n\n`;
  
  // Recommendations globales
  const allRecs = {};
  results.forEach(r => {
    r.recommendations.forEach(rec => {
      allRecs[rec] = (allRecs[rec] || 0) + 1;
    });
  });
  
  if (Object.keys(allRecs).length > 0) {
    report += `## 💡 RECOMMANDATIONS PRIORITAIRES MOBILE\n\n`;
    Object.entries(allRecs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([rec, count]) => {
        report += `- **${rec}** (${count} pages)\n`;
      });
    report += `\n---\n\n`;
  }
  
  return report;
}

// Main
console.log('📱 Audit Mobile Expert en cours...\n');

const pages = findAllPages(FRONTEND_SRC);
console.log(`✅ ${pages.length} pages trouvées\n`);

const results = pages.map(mobileExpertAnalysis);
console.log(`✅ Analyse mobile terminée\n`);

const report = generateMobileReport(results);
fs.writeFileSync(OUTPUT_FILE, report);

const avgScore = results.reduce((sum, r) => sum + r.mobileScore, 0) / results.length;
const issues = results.reduce((sum, r) => sum + r.issues.length, 0);
const perfect = results.filter(r => r.mobileScore >= 9.5).length;

console.log(`📊 Résultats Mobile:`);
console.log(`   Score moyen: ${avgScore.toFixed(1)}/10`);
console.log(`   Pages parfaites: ${perfect}/${results.length} (${Math.round(perfect/results.length*100)}%)`);
console.log(`   Issues: ${issues}`);
console.log(`\n✅ Rapport: AUDIT_MOBILE_EXPERT_COMPLET.md\n`);

