#!/usr/bin/env node
/**
 * AUDIT EXPERT DASHBOARD - Analyse UX/UI/Dev professionnelle
 * Critères: Fonctionnalité, Navigation, UX, UI, Responsive, Cohérence, Performance
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, '../apps/frontend/src/app/(dashboard)');
const COMPONENTS_DIR = path.join(__dirname, '../apps/frontend/src/components');
const OUTPUT_FILE = path.join(__dirname, '../AUDIT_DASHBOARD_EXPERT_COMPLET.md');

/**
 * Critères d'évaluation expert (0-10 par critère)
 */
const CRITERIA = {
  FUNCTIONALITY: 'Fonctionnalité',
  NAVIGATION: 'Navigation & Routing',
  UX: 'Expérience Utilisateur',
  UI: 'Interface & Design',
  RESPONSIVE: 'Responsive Design',
  CONSISTENCY: 'Cohérence',
  PERFORMANCE: 'Performance',
  ACCESSIBILITY: 'Accessibilité',
};

/**
 * Trouve tous les fichiers dans dashboard
 */
function findDashboardFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findDashboardFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Analyse experte d'une page dashboard
 */
function expertAnalysis(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(DASHBOARD_DIR, '');
  const fileName = path.basename(filePath);
  
  const route = relativePath
    .replace('/page.tsx', '')
    .replace('//', '/') || '/overview';
  
  const analysis = {
    route,
    file: relativePath,
    fileName,
    lines: content.split('\n').length,
    scores: {},
    issues: [],
    recommendations: [],
  };
  
  // 1. FUNCTIONALITY (0-10)
  let funcScore = 10;
  const hasUseClient = content.includes("'use client'");
  const hasUseEffect = content.includes('useEffect');
  const hasUseState = content.includes('useState');
  const hasAsyncFunctions = content.includes('async ');
  const hasErrorHandling = content.includes('try {') && content.includes('catch');
  const hasSupabase = content.includes('supabase');
  const hasAPI = content.includes('fetch(') || content.includes('axios');
  
  if (content.includes('// TODO') || content.includes('// FIXME')) {
    funcScore -= 2;
    analysis.issues.push('TODOs ou FIXMEs non résolus');
  }
  
  if (!hasErrorHandling && hasAsyncFunctions) {
    funcScore -= 1;
    analysis.issues.push('Pas de gestion d\'erreur pour async functions');
  }
  
  analysis.scores.FUNCTIONALITY = funcScore;
  
  // 2. NAVIGATION (0-10)
  let navScore = 10;
  const hasLink = content.includes('Link');
  const hasRouter = content.includes('useRouter');
  const hasRedirect = content.includes('redirect(');
  const hasBreadcrumbs = content.includes('breadcrumb') || content.includes('Breadcrumb');
  const hasBackButton = content.includes('ArrowLeft') || content.includes('ChevronLeft');
  
  if (content.includes('href="/dashboard"')) {
    navScore -= 2;
    analysis.issues.push('Utilise /dashboard au lieu de /overview');
  }
  
  if (!hasLink && !hasRouter && content.includes('button')) {
    navScore -= 1;
    analysis.recommendations.push('Ajouter navigation avec Link ou useRouter');
  }
  
  analysis.scores.NAVIGATION = navScore;
  
  // 3. UX (0-10)
  let uxScore = 10;
  const hasLoading = content.includes('isLoading') || content.includes('loading');
  const hasEmptyState = content.includes('empty') || content.includes('No data') || content.includes('Aucun');
  const hasFeedback = content.includes('toast') || content.includes('notification');
  const hasValidation = content.includes('validate') || content.includes('schema');
  const hasPlaceholder = content.includes('placeholder');
  const hasTooltip = content.includes('Tooltip') || content.includes('title=');
  
  if (!hasLoading && hasAsyncFunctions) {
    uxScore -= 2;
    analysis.issues.push('Pas d\'état de chargement pour async');
    analysis.recommendations.push('Ajouter loading state et skeleton');
  }
  
  if (!hasEmptyState && (content.includes('map(') || content.includes('.length'))) {
    uxScore -= 1;
    analysis.recommendations.push('Ajouter empty state pour listes vides');
  }
  
  if (!hasFeedback && hasAsyncFunctions) {
    uxScore -= 1;
    analysis.recommendations.push('Ajouter toast/notification pour feedback utilisateur');
  }
  
  analysis.scores.UX = uxScore;
  
  // 4. UI (0-10)
  let uiScore = 10;
  const hasCard = content.includes('Card');
  const hasButton = content.includes('Button');
  const hasIcons = content.includes('lucide-react');
  const hasGradients = content.includes('gradient');
  const hasShadows = content.includes('shadow');
  const hasAnimations = content.includes('motion') || content.includes('animate');
  const hasColors = content.includes('bg-') || content.includes('text-');
  
  if (!hasIcons) {
    uiScore -= 1;
    analysis.recommendations.push('Ajouter icônes lucide-react pour meilleure UI');
  }
  
  if (!hasAnimations && content.length > 1000) {
    uiScore -= 0.5;
    analysis.recommendations.push('Ajouter animations Framer Motion pour UX premium');
  }
  
  if (content.includes('className="') && !content.includes('dark:')) {
    uiScore -= 1;
    analysis.issues.push('Pas de support dark mode explicite');
  }
  
  analysis.scores.UI = uiScore;
  
  // 5. RESPONSIVE (0-10)
  const responsiveClasses = (content.match(/(sm:|md:|lg:|xl:|2xl:)/g) || []).length;
  let respScore = Math.min(10, responsiveClasses / 5);
  
  if (responsiveClasses < 5) {
    analysis.issues.push(`Seulement ${responsiveClasses} classes responsive`);
    analysis.recommendations.push('Ajouter breakpoints sm:, md:, lg: pour mobile/tablet/desktop');
  }
  
  if (content.includes('grid-cols-') && !content.includes('sm:grid-cols-')) {
    respScore -= 1;
    analysis.recommendations.push('Grids doivent être responsive (cols-1 sm:cols-2 lg:cols-3)');
  }
  
  if (content.includes('w-[') && !content.includes('max-w-')) {
    respScore -= 0.5;
    analysis.recommendations.push('Utiliser max-w- au lieu de w-[fixed] pour responsive');
  }
  
  analysis.scores.RESPONSIVE = Math.max(0, respScore);
  
  // 6. CONSISTENCY (0-10)
  let consistencyScore = 10;
  const hasLuneoMention = content.toLowerCase().includes('luneo');
  const hasDarkTheme = content.includes('bg-gray-900') || content.includes('bg-black');
  const usesTailwind = content.includes('className="');
  const usesComponents = content.includes('@/components/ui/');
  
  if (!hasDarkTheme && fileName === 'page.tsx') {
    consistencyScore -= 2;
    analysis.issues.push('Dashboard devrait avoir un thème cohérent');
  }
  
  if (!usesComponents && content.length > 500) {
    consistencyScore -= 1;
    analysis.recommendations.push('Utiliser components UI réutilisables (@/components/ui/)');
  }
  
  analysis.scores.CONSISTENCY = consistencyScore;
  
  // 7. PERFORMANCE (0-10)
  let perfScore = 10;
  const hasLazyLoad = content.includes('dynamic(') || content.includes('lazy');
  const hasMemo = content.includes('useMemo') || content.includes('useCallback');
  const hasHeavyLibs = content.includes('konva') || content.includes('three') || content.includes('mediapipe');
  
  if (hasHeavyLibs && !hasLazyLoad) {
    perfScore -= 3;
    analysis.issues.push('Bibliothèque lourde sans lazy loading');
    analysis.recommendations.push('Implémenter dynamic import pour Konva/Three.js');
  }
  
  if (content.includes('map(') && !hasMemo && content.length > 1000) {
    perfScore -= 1;
    analysis.recommendations.push('Ajouter useMemo pour optimiser re-renders');
  }
  
  if (content.includes('<img ') && !content.includes('next/image')) {
    perfScore -= 2;
    analysis.issues.push('Utilise <img> au lieu de next/image');
  }
  
  analysis.scores.PERFORMANCE = Math.max(0, perfScore);
  
  // 8. ACCESSIBILITY (0-10)
  let a11yScore = 10;
  const hasAriaLabels = content.includes('aria-label');
  const hasAlt = content.includes('alt=');
  const hasSemanticHTML = content.includes('<section') || content.includes('<article');
  const hasFormLabels = !content.includes('<input') || content.includes('<Label');
  
  if (content.includes('<button') && !content.includes('aria-label')) {
    a11yScore -= 1;
    analysis.recommendations.push('Ajouter aria-label sur boutons pour accessibilité');
  }
  
  if (content.includes('Image') && !content.includes('alt=')) {
    a11yScore -= 1;
    analysis.recommendations.push('Ajouter alt sur toutes les images');
  }
  
  analysis.scores.ACCESSIBILITY = a11yScore;
  
  // Score global
  const totalScore = Object.values(analysis.scores).reduce((sum, score) => sum + score, 0) / Object.keys(analysis.scores).length;
  analysis.totalScore = Math.round(totalScore * 10) / 10;
  
  // Grade
  if (analysis.totalScore >= 9) analysis.grade = 'A+';
  else if (analysis.totalScore >= 8) analysis.grade = 'A';
  else if (analysis.totalScore >= 7) analysis.grade = 'B';
  else if (analysis.totalScore >= 6) analysis.grade = 'C';
  else analysis.grade = 'D';
  
  return analysis;
}

/**
 * Génère le rapport expert
 */
function generateExpertReport(results) {
  const dashboardPages = results.filter(r => r.fileName === 'page.tsx');
  const components = results.filter(r => r.fileName !== 'page.tsx');
  
  let report = `# 🔍 AUDIT EXPERT DASHBOARD - POST-AUTHENTIFICATION\n\n`;
  report += `**Date:** ${new Date().toLocaleDateString('fr-FR')}\n`;
  report += `**Expert:** AI Senior Developer + UX/UI Designer\n`;
  report += `**Scope:** Toutes pages dashboard après login\n\n`;
  report += `---\n\n`;
  
  // Summary
  const avgScore = results.reduce((sum, r) => sum + r.totalScore, 0) / results.length;
  const gradeDistribution = {};
  results.forEach(r => {
    gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
  });
  
  report += `## 📊 RÉSUMÉ EXÉCUTIF\n\n`;
  report += `| Métrique | Valeur |\n`;
  report += `|----------|--------|\n`;
  report += `| **Pages dashboard** | ${dashboardPages.length} |\n`;
  report += `| **Components** | ${components.length} |\n`;
  report += `| **Score moyen** | ${avgScore.toFixed(1)}/10 |\n`;
  report += `| **Grade A+** | ${gradeDistribution['A+'] || 0} pages |\n`;
  report += `| **Grade A** | ${gradeDistribution['A'] || 0} pages |\n`;
  report += `| **Grade B** | ${gradeDistribution['B'] || 0} pages |\n`;
  report += `| **Grade C/D** | ${(gradeDistribution['C'] || 0) + (gradeDistribution['D'] || 0)} pages |\n`;
  report += `\n---\n\n`;
  
  // Détail par page
  report += `## 📄 ANALYSE PAR PAGE (${dashboardPages.length} pages)\n\n`;
  
  dashboardPages
    .sort((a, b) => b.totalScore - a.totalScore)
    .forEach((page, i) => {
      report += `### ${i + 1}. ${page.route} (${page.grade} - ${page.totalScore}/10)\n\n`;
      report += `**Fichier:** \`${page.file}\` (${page.lines} lignes)\n\n`;
      
      // Scores détaillés
      report += `**Scores par critère:**\n`;
      report += `| Critère | Score |\n`;
      report += `|---------|-------|\n`;
      Object.entries(CRITERIA).forEach(([key, label]) => {
        const score = page.scores[key] || 0;
        const emoji = score >= 9 ? '🟢' : score >= 7 ? '🟡' : '🔴';
        report += `| ${label} | ${emoji} ${score.toFixed(1)}/10 |\n`;
      });
      report += `\n`;
      
      // Issues
      if (page.issues.length > 0) {
        report += `**🚨 Issues critiques:**\n`;
        page.issues.forEach(issue => {
          report += `- ❌ ${issue}\n`;
        });
        report += `\n`;
      }
      
      // Recommendations
      if (page.recommendations.length > 0) {
        report += `**💡 Recommandations:**\n`;
        page.recommendations.forEach(rec => {
          report += `- ✨ ${rec}\n`;
        });
        report += `\n`;
      }
      
      report += `---\n\n`;
    });
  
  // Top issues
  const allIssues = {};
  results.forEach(r => {
    r.issues.forEach(issue => {
      allIssues[issue] = (allIssues[issue] || 0) + 1;
    });
  });
  
  if (Object.keys(allIssues).length > 0) {
    report += `## 🚨 ISSUES RÉCURRENTES\n\n`;
    Object.entries(allIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([issue, count]) => {
        report += `- **${issue}** (${count} pages)\n`;
      });
    report += `\n---\n\n`;
  }
  
  // Top recommendations
  const allRecs = {};
  results.forEach(r => {
    r.recommendations.forEach(rec => {
      allRecs[rec] = (allRecs[rec] || 0) + 1;
    });
  });
  
  if (Object.keys(allRecs).length > 0) {
    report += `## 💡 RECOMMANDATIONS PRIORITAIRES\n\n`;
    Object.entries(allRecs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([rec, count]) => {
        report += `- **${rec}** (${count} pages)\n`;
      });
    report += `\n---\n\n`;
  }
  
  return report;
}

// Main
console.log('🔍 Audit Expert Dashboard en cours...\n');

const files = findDashboardFiles(DASHBOARD_DIR);
console.log(`✅ ${files.length} fichiers trouvés dans dashboard\n`);

const results = files.map(expertAnalysis);
console.log(`✅ Analyse experte terminée\n`);

const report = generateExpertReport(results);
fs.writeFileSync(OUTPUT_FILE, report);

const avgScore = results.reduce((sum, r) => sum + r.totalScore, 0) / results.length;
const pages = results.filter(r => r.fileName === 'page.tsx');

console.log(`📊 Résultats:`);
console.log(`   Pages dashboard: ${pages.length}`);
console.log(`   Score moyen: ${avgScore.toFixed(1)}/10`);
console.log(`   Issues: ${results.reduce((sum, r) => sum + r.issues.length, 0)}`);
console.log(`\n✅ Rapport: AUDIT_DASHBOARD_EXPERT_COMPLET.md\n`);

