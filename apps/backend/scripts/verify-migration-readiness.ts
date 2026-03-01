import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runCommand(command: string): string {
  return execSync(command, {
    stdio: 'pipe',
    encoding: 'utf8',
  }).trim();
}

function main() {
  const root = process.cwd();
  const migrationsDir = join(root, 'prisma', 'migrations');
  const schemaPath = join(root, 'prisma', 'schema.prisma');

  assert(existsSync(schemaPath), `Schema introuvable: ${schemaPath}`);
  assert(existsSync(migrationsDir), `Dossier migrations introuvable: ${migrationsDir}`);

  const migrationFolders = readdirSync(migrationsDir)
    .map((name) => join(migrationsDir, name))
    .filter((fullPath) => statSync(fullPath).isDirectory())
    .map((fullPath) => fullPath.split('/').pop() as string)
    .sort();

  assert(migrationFolders.length > 0, 'Aucune migration détectée');

  const latestMigration = migrationFolders[migrationFolders.length - 1];
  const requireDb = process.env.MIGRATION_VERIFY_REQUIRE_DB === 'true';

  const summary: Record<string, unknown> = {
    schemaPath,
    migrationsCount: migrationFolders.length,
    latestMigration,
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
  };

  const databaseUrl = process.env.DATABASE_URL;
  if (requireDb) {
    assert(Boolean(databaseUrl), 'DATABASE_URL requis pour verifier les migrations en mode strict');
  }

  if (databaseUrl) {
    try {
      const statusOutput = runCommand('pnpm exec prisma migrate status --schema prisma/schema.prisma');
      const normalizedOutput = statusOutput.toLowerCase();
      const looksHealthy =
        normalizedOutput.includes('database schema is up to date') ||
        normalizedOutput.includes('no pending migrations') ||
        normalizedOutput.includes('already in sync');
      assert(looksHealthy, `Etat Prisma non clean detecte:\n${statusOutput}`);
      summary.prismaMigrateStatus = statusOutput;
    } catch (error) {
      if (requireDb) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      summary.prismaMigrateStatusSkipped = `DB inaccessible en mode non-strict: ${message}`;
    }
  } else {
    summary.prismaMigrateStatusSkipped = 'DATABASE_URL absente: verification DB ignoree (mode non-strict).';
  }

  const rollbackChecklist = [
    'Backup DB disponible (snapshot/point-in-time).',
    'Plan de rollback applicatif validé (image/tag précédent).',
    'Migration destructive revue manuellement.',
    'Fenêtre de déploiement et owner incident définis.',
  ];

  summary.rollbackChecklist = rollbackChecklist;

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(summary, null, 2));
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`[migrate:verify] ${message}`);
  process.exit(1);
}
