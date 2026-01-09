#!/usr/bin/env node

/**
 * Script d'audit des API routes frontend
 * Identifie les routes manquantes ou non connectées au backend
 */

const fs = require('fs');
const path = require('path');

const API_ROUTES_DIR = path.join(__dirname, '../apps/frontend/src/app/api');
const BACKEND_CONTROLLERS_DIR = path.join(__dirname, '../apps/backend/src/modules');

// Routes appelées depuis le frontend
const frontendCalls = new Set();
const apiRoutes = new Set();
const backendControllers = new Set();

// Analyser les appels fetch dans le frontend
function analyzeFrontendCalls(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      analyzeFrontendCalls(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Chercher les appels fetch('/api/...')
      const fetchMatches = content.matchAll(/fetch\(['"`]([^'"`]+)['"`]/g);
      for (const match of fetchMatches) {
        const url = match[1];
        if (url.startsWith('/api/')) {
          frontendCalls.add(url);
        }
      }
      
      // Chercher trpc.*.useQuery
      const trpcMatches = content.matchAll(/trpc\.([\w.]+)\.useQuery/g);
      for (const match of trpcMatches) {
        frontendCalls.add(`/trpc/${match[1]}`);
      }
    }
  }
}

// Lister toutes les API routes
function listApiRoutes(dir, prefix = '') {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      listApiRoutes(fullPath, `${prefix}/${file.name}`);
    } else if (file.name === 'route.ts') {
      const route = prefix || '/';
      apiRoutes.add(route);
    }
  }
}

// Lister tous les controllers backend
function listBackendControllers(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      listBackendControllers(fullPath);
    } else if (file.name.endsWith('.controller.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const controllerMatch = content.match(/@Controller\(['"]([^'"]+)['"]\)/);
      if (controllerMatch) {
        backendControllers.add(controllerMatch[1]);
      }
    }
  }
}

// Analyser
console.log('🔍 Analyse des API routes...\n');

analyzeFrontendCalls(path.join(__dirname, '../apps/frontend/src/app/(dashboard)'));
listApiRoutes(API_ROUTES_DIR);
listBackendControllers(BACKEND_CONTROLLERS_DIR);

// Résultats
console.log(`📊 Statistiques:`);
console.log(`- Appels frontend: ${frontendCalls.size}`);
console.log(`- API routes existantes: ${apiRoutes.size}`);
console.log(`- Controllers backend: ${backendControllers.size}\n`);

// Routes appelées mais non existantes
const missingRoutes = Array.from(frontendCalls).filter(route => {
  const routePath = route.replace('/api', '').replace('/trpc', '');
  return !Array.from(apiRoutes).some(existing => {
    const existingPath = existing.replace(/\[.*?\]/g, '*');
    return routePath.includes(existingPath) || existingPath.includes(routePath);
  });
});

console.log(`❌ Routes appelées mais non existantes (${missingRoutes.length}):`);
missingRoutes.slice(0, 20).forEach(route => console.log(`  - ${route}`));
if (missingRoutes.length > 20) {
  console.log(`  ... et ${missingRoutes.length - 20} autres`);
}

// Sauvegarder les résultats
const results = {
  frontendCalls: Array.from(frontendCalls),
  apiRoutes: Array.from(apiRoutes),
  backendControllers: Array.from(backendControllers),
  missingRoutes: missingRoutes,
  timestamp: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(__dirname, '../AUDIT_API_ROUTES.json'),
  JSON.stringify(results, null, 2)
);

console.log('\n✅ Résultats sauvegardés dans AUDIT_API_ROUTES.json');


