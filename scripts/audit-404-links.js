#!/usr/bin/env node
/**
 * Audit 404 - Vérifie que TOUS les liens pointent vers des pages existantes
 * Détecte: 404, liens cassés, pages statiques vides, incohérences
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_SRC = path.join(__dirname, '../apps/frontend/src/app');
const OUTPUT_FILE = path.join(__dirname, '../AUDIT_404_LINKS_COMPLET.md');

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
 * Construit la map des routes existantes
 */
function buildRouteMap(pages) {
  const routes = new Map();
  
  pages.forEach(filePath => {
    const relativePath = filePath.replace(FRONTEND_SRC, '');
    const route = relativePath
      .replace('/page.tsx', '')
      .replace('(public)', '')
      .replace('(dashboard)', '')
      .replace('(auth)', '')
      .replace('//', '/')
      .replace(/\[([^\]]+)\]/g, ':$1') // Dynamic routes
      || '/';
    
    routes.set(route, filePath);
  });
  
  return routes;
}

/**
 * Extrait tous les liens d'un fichier
 */
function extractLinks(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const links = [];
  
  // href="..." ou href='...'
  const hrefPattern = /href=["']([^"']+)["']/g;
  let match;
  
  while ((match = hrefPattern.exec(content)) !== null) {
    const href = match[1];
    
    // Ignorer liens externes et anchors
    if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
      // Nettoyer query params
      const cleanHref = href.split('?')[0].split('#')[0];
      if (cleanHref && cleanHref !== '/') {
        links.push(cleanHref);
      }
    }
  }
  
  // router.push('...')
  const routerPushPattern = /router\.push\(['"]([^'"]+)['"]\)/g;
  while ((match = routerPushPattern.exec(content)) !== null) {
    const href = match[1];
    if (!href.startsWith('http') && !href.startsWith('#')) {
      const cleanHref = href.split('?')[0].split('#')[0];
      if (cleanHref && cleanHref !== '/') {
        links.push(cleanHref);
      }
    }
  }
  
  // redirect('...')
  const redirectPattern = /redirect\(['"]([^'"]+)['"]\)/g;
  while ((match = redirectPattern.exec(content)) !== null) {
    const href = match[1];
    if (!href.startsWith('http') && !href.startsWith('#')) {
      const cleanHref = href.split('?')[0].split('#')[0];
      if (cleanHref && cleanHref !== '/') {
        links.push(cleanHref);
      }
    }
  }
  
  return [...new Set(links)]; // Unique
}

/**
 * Vérifie si une route existe
 */
function routeExists(link, routeMap) {
  // Exact match
  if (routeMap.has(link)) {
    return { exists: true, type: 'exact' };
  }
  
  // Check avec trailing slash
  const withSlash = link.endsWith('/') ? link.slice(0, -1) : link + '/';
  if (routeMap.has(withSlash)) {
    return { exists: true, type: 'with-slash' };
  }
  
  // Check dynamic routes
  for (const [route, file] of routeMap.entries()) {
    if (route.includes(':')) {
      const pattern = route.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(link)) {
        return { exists: true, type: 'dynamic', matchedRoute: route };
      }
    }
  }
  
  return { exists: false };
}

/**
 * Vérifie si une page est vide/statique
 */
function isPageEmpty(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').length;
  
  // Page très courte (< 50 lignes) = potentiellement vide
  if (lines < 50) {
    // Vérifier si c'est juste un redirect
    if (content.includes('redirect(')) {
      return { isEmpty: false, type: 'redirect' };
    }
    
    // Vérifier si contenu réel
    const hasContent = content.includes('return') && (
      content.includes('<div') || 
      content.includes('<section') ||
      content.includes('Card') ||
      content.includes('Button')
    );
    
    if (!hasContent) {
      return { isEmpty: true, lines };
    }
  }
  
  return { isEmpty: false, lines };
}

/**
 * Analyse complète
 */
function fullAnalysis() {
  console.log('🔍 Audit 404 & Fonctionnalité - Niveau 2\n');
  
  // 1. Trouver toutes les pages
  const pages = findAllPages(FRONTEND_SRC);
  console.log(`✅ ${pages.length} pages trouvées\n`);
  
  // 2. Build route map
  const routeMap = buildRouteMap(pages);
  console.log(`✅ ${routeMap.size} routes mappées\n`);
  
  // 3. Analyser chaque page
  const results = {
    totalPages: pages.length,
    emptyPages: [],
    brokenLinks: [],
    potenti404: [],
    redirects: [],
    allLinks: new Set(),
  };
  
  pages.forEach(filePath => {
    const relativePath = filePath.replace(FRONTEND_SRC, '');
    const route = relativePath
      .replace('/page.tsx', '')
      .replace('(public)', '')
      .replace('(dashboard)', '')
      .replace('(auth)', '')
      .replace('//', '/')
      || '/';
    
    // Check if empty
    const emptyCheck = isPageEmpty(filePath);
    if (emptyCheck.isEmpty) {
      results.emptyPages.push({ route, ...emptyCheck });
    }
    if (emptyCheck.type === 'redirect') {
      results.redirects.push({ route, lines: emptyCheck.lines });
    }
    
    // Extract & verify links
    const links = extractLinks(filePath);
    links.forEach(link => {
      results.allLinks.add(link);
      
      const exists = routeExists(link, routeMap);
      if (!exists.exists) {
        results.brokenLinks.push({
          fromPage: route,
          brokenLink: link,
          file: relativePath
        });
      }
    });
  });
  
  // 4. Vérifier routes "suspicieuses"
  const suspiciousRoutes = [
    '/demo', '/demos',
    '/dashboard', '/app',
    '/admin', '/api',
    '/test', '/dev',
  ];
  
  suspiciousRoutes.forEach(route => {
    if (!routeMap.has(route)) {
      results.potenti404.push({
        route,
        reason: 'Route commune souvent utilisée mais absente'
      });
    }
  });
  
  return results;
}

/**
 * Génère le rapport
 */
function generateReport(results) {
  let report = `# 🔍 AUDIT 404 & LIENS - NIVEAU 2\n\n`;
  report += `**Date:** ${new Date().toLocaleDateString('fr-FR')}\n`;
  report += `**Objectif:** Détecter TOUTES les 404 et pages non fonctionnelles\n\n`;
  report += `---\n\n`;
  
  // Summary
  report += `## 📊 RÉSUMÉ\n\n`;
  report += `| Métrique | Valeur | Status |\n`;
  report += `|----------|--------|--------|\n`;
  report += `| **Pages analysées** | ${results.totalPages} | ✅ |\n`;
  report += `| **Liens uniques trouvés** | ${results.allLinks.size} | ℹ️ |\n`;
  report += `| **Liens cassés** | ${results.brokenLinks.length} | ${results.brokenLinks.length === 0 ? '✅' : '🚨'} |\n`;
  report += `| **Pages vides** | ${results.emptyPages.length} | ${results.emptyPages.length === 0 ? '✅' : '⚠️'} |\n`;
  report += `| **Redirects** | ${results.redirects.length} | ℹ️ |\n`;
  report += `\n---\n\n`;
  
  // Broken links
  if (results.brokenLinks.length > 0) {
    report += `## 🚨 LIENS CASSÉS (404 POTENTIELLES)\n\n`;
    report += `**${results.brokenLinks.length} liens cassés détectés !**\n\n`;
    
    results.brokenLinks.forEach((broken, i) => {
      if (i < 50) { // Limit to 50
        report += `### ${i + 1}. ❌ \`${broken.brokenLink}\`\n\n`;
        report += `- **Depuis:** \`${broken.fromPage}\`\n`;
        report += `- **Fichier:** \`${broken.file}\`\n`;
        report += `- **Action:** Créer la page ou corriger le lien\n\n`;
      }
    });
    
    if (results.brokenLinks.length > 50) {
      report += `\n*... et ${results.brokenLinks.length - 50} autres liens cassés*\n`;
    }
    
    report += `\n---\n\n`;
  } else {
    report += `## ✅ AUCUN LIEN CASSÉ\n\n`;
    report += `Tous les liens internes pointent vers des pages existantes !\n\n`;
    report += `---\n\n`;
  }
  
  // Empty pages
  if (results.emptyPages.length > 0) {
    report += `## ⚠️ PAGES VIDES/STATIQUES\n\n`;
    report += `**${results.emptyPages.length} pages potentiellement vides**\n\n`;
    
    results.emptyPages.forEach((page, i) => {
      report += `${i + 1}. **${page.route}** (${page.lines} lignes) - À vérifier manuellement\n`;
    });
    
    report += `\n---\n\n`;
  }
  
  // Redirects
  if (results.redirects.length > 0) {
    report += `## ℹ️ PAGES REDIRECT\n\n`;
    report += `**${results.redirects.length} pages de redirection** (normal)\n\n`;
    
    results.redirects.forEach((redir, i) => {
      report += `${i + 1}. **${redir.route}** (${redir.lines} lignes)\n`;
    });
    
    report += `\n---\n\n`;
  }
  
  // All unique links
  report += `## 📋 TOUS LES LIENS INTERNES (${results.allLinks.size})\n\n`;
  const sortedLinks = [...results.allLinks].sort();
  
  sortedLinks.slice(0, 100).forEach((link, i) => {
    report += `${i + 1}. \`${link}\`\n`;
  });
  
  if (sortedLinks.length > 100) {
    report += `\n*... et ${sortedLinks.length - 100} autres liens*\n`;
  }
  
  return report;
}

// Main
const results = fullAnalysis();
const report = generateReport(results);
fs.writeFileSync(OUTPUT_FILE, report);

console.log('\n✅ Rapport généré: AUDIT_404_LINKS_COMPLET.md\n');
console.log('📊 Résultat:');
console.log(`   Liens cassés (404): ${results.brokenLinks.length}`);
console.log(`   Pages vides: ${results.emptyPages.length}`);
console.log(`   Redirects: ${results.redirects.length}`);

if (results.brokenLinks.length === 0) {
  console.log('\n🎉 AUCUNE 404 DÉTECTÉE - TOUS LES LIENS FONCTIONNENT ! ✅\n');
} else {
  console.log(`\n🚨 ${results.brokenLinks.length} LIENS CASSÉS À CORRIGER ! 🚨\n`);
}

