/**
 * Global Setup pour les tests Playwright
 * Exécuté une seule fois avant tous les tests
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Global Setup - Préparation des tests E2E...\n');
  
  // Créer les dossiers nécessaires
  const authDir = path.join(__dirname, '../../.playwright/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  const screenshotsDir = path.join(__dirname, '../../test-results/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  console.log(`📡 BaseURL configuré: ${baseURL}`);
  
  // Attendre que le serveur soit prêt (via fetch simple)
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(baseURL, { method: 'HEAD' });
      if (response.ok || response.status < 500) {
        console.log('✅ Serveur prêt\n');
        break;
      }
    } catch {
      console.log(`⏳ Attente du serveur... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('✅ Global Setup terminé\n');
}

export default globalSetup;

