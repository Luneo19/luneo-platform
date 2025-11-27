/**
 * Global Setup pour les tests Playwright
 * Exécuté une seule fois avant tous les tests
 */

import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Global Setup - Préparation des tests E2E...\n');
  
  // Créer les dossiers nécessaires
  const authDir = path.join(__dirname, '../../.playwright/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Lancer un navigateur pour des vérifications préliminaires
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Vérifier que le serveur est accessible
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
    console.log(`📡 Vérification de ${baseURL}...`);
    
    const response = await page.goto(baseURL, { timeout: 30000 });
    
    if (response?.ok()) {
      console.log('✅ Serveur accessible\n');
    } else {
      console.warn(`⚠️ Serveur accessible mais status: ${response?.status()}\n`);
    }
    
    // Vérifier les routes critiques
    const criticalRoutes = ['/login', '/register', '/pricing'];
    for (const route of criticalRoutes) {
      try {
        const routeResponse = await page.goto(`${baseURL}${route}`, { timeout: 10000 });
        const status = routeResponse?.status() || 'N/A';
        console.log(`  ${status === 200 ? '✓' : '✗'} ${route} (${status})`);
      } catch {
        console.log(`  ✗ ${route} (timeout)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du setup:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ Global Setup terminé\n');
}

export default globalSetup;

