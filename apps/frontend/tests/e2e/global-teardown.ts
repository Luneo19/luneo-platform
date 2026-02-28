/**
 * Global Teardown pour les tests Playwright
 * Exécuté une seule fois après tous les tests
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(_config: FullConfig) {
  console.log('\n🧹 Global Teardown - Nettoyage...\n');
  
  // Nettoyer les fichiers d'authentification
  const authDir = path.join(__dirname, '../../.playwright/.auth');
  if (fs.existsSync(authDir)) {
    try {
      // Supprimer uniquement les fichiers temporaires, garder la structure
      const files = fs.readdirSync(authDir);
      for (const file of files) {
        if (file.endsWith('.json') && !file.includes('keep')) {
          fs.unlinkSync(path.join(authDir, file));
          console.log(`  ✓ Supprimé: ${file}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors du nettoyage:', error);
    }
  }
  
  // Afficher un résumé
  const reportPath = path.join(__dirname, '../../playwright-report/index.html');
  if (fs.existsSync(reportPath)) {
    console.log(`\n📊 Rapport disponible: ${reportPath}`);
  }
  
  console.log('\n✅ Global Teardown terminé\n');
}

export default globalTeardown;

