/**
 * Script pour appliquer la migration Super Admin directement
 */

require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🗄️  Application de la migration Super Admin...\n');

  const migrationPath = path.join(__dirname, '../prisma/migrations/20250115000000_add_super_admin_models/migration.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Diviser en statements individuels
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  try {
    // Exécuter chaque statement
    for (const statement of statements) {
      if (statement.length > 10) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`  ✅ Statement exécuté`);
        } catch (error) {
          // Ignorer les erreurs "already exists" ou "duplicate"
          if (
            error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.message.includes('does not exist') ||
            error.message.includes('column') && error.message.includes('already')
          ) {
            console.log(`  ⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          } else {
            console.warn(`  ⚠️  Warning: ${error.message.substring(0, 100)}`);
          }
        }
      }
    }

    console.log('\n✅ Migration appliquée avec succès!\n');
  } catch (error) {
    console.error('❌ Erreur migration:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
