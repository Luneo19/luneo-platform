#!/usr/bin/env node

/**
 * Applique la migration via l'API REST Supabase
 * Utilise le service role key pour exécuter SQL
 */

require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');

async function applyMigrationViaSupabaseAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non défini');
    console.log('\nVariables nécessaires:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL');
    console.log('  SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  console.log('🗄️  Application migration via API Supabase...\n');
  console.log(`URL: ${supabaseUrl.substring(0, 50)}...\n`);

  const migrationPath = path.join(__dirname, '../prisma/migrations/add_credits_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Utiliser l'API REST Supabase pour exécuter SQL
  // Note: Supabase n'a pas d'endpoint direct pour exécuter SQL arbitraire via REST
  // Il faut utiliser rpc ou passer par le dashboard
  
  console.log('⚠️  Supabase REST API ne permet pas d\'exécuter SQL arbitraire directement.');
  console.log('\n✅ Migration SQL prête dans:');
  console.log(`   ${migrationPath}`);
  console.log('\n📋 Pour l\'appliquer:');
  console.log('1. Aller sur Supabase Dashboard');
  console.log('2. SQL Editor → New query');
  console.log('3. Copier-coller le contenu du fichier SQL');
  console.log('4. Exécuter');
  console.log('\nOu utilisez psql si disponible:');
  console.log(`   psql "${process.env.DATABASE_URL}" -f ${migrationPath}`);
}

applyMigrationViaSupabaseAPI();



#!/usr/bin/env node

/**
 * Applique la migration via l'API REST Supabase
 * Utilise le service role key pour exécuter SQL
 */

require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');

async function applyMigrationViaSupabaseAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non défini');
    console.log('\nVariables nécessaires:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL');
    console.log('  SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  console.log('🗄️  Application migration via API Supabase...\n');
  console.log(`URL: ${supabaseUrl.substring(0, 50)}...\n`);

  const migrationPath = path.join(__dirname, '../prisma/migrations/add_credits_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Utiliser l'API REST Supabase pour exécuter SQL
  // Note: Supabase n'a pas d'endpoint direct pour exécuter SQL arbitraire via REST
  // Il faut utiliser rpc ou passer par le dashboard
  
  console.log('⚠️  Supabase REST API ne permet pas d\'exécuter SQL arbitraire directement.');
  console.log('\n✅ Migration SQL prête dans:');
  console.log(`   ${migrationPath}`);
  console.log('\n📋 Pour l\'appliquer:');
  console.log('1. Aller sur Supabase Dashboard');
  console.log('2. SQL Editor → New query');
  console.log('3. Copier-coller le contenu du fichier SQL');
  console.log('4. Exécuter');
  console.log('\nOu utilisez psql si disponible:');
  console.log(`   psql "${process.env.DATABASE_URL}" -f ${migrationPath}`);
}

applyMigrationViaSupabaseAPI();
















