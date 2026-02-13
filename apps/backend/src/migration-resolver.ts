import { Logger } from '@nestjs/common';

const execSync = require('child_process').execSync;
const path = require('path');
const fs = require('fs');

/**
 * Runs database migrations (prisma migrate deploy) and resolves common issues
 * (P3015 missing migration file, P3009 failed migrations).
 * Does not use PrismaClient; column verification is in ensureCriticalColumns().
 */
export function runDatabaseMigrations(logger: Logger): void {
  const backendDir = path.join(__dirname, '../..');
  const prismaBin = path.join(__dirname, '../../node_modules/.bin/prisma');
  const prismaBinAlt = path.join(backendDir, 'node_modules/.bin/prisma');
  const prismaBinRoot = '/app/node_modules/.bin/prisma';

  let prismaCmd: string | null = null;

  if (fs.existsSync(prismaBinRoot)) {
    prismaCmd = `${prismaBinRoot} migrate deploy`;
    logger.log(`Using Prisma binary from: ${prismaBinRoot}`);
  } else if (fs.existsSync(prismaBin)) {
    prismaCmd = `${prismaBin} migrate deploy`;
    logger.log(`Using Prisma binary from: ${prismaBin}`);
  } else if (fs.existsSync(prismaBinAlt)) {
    prismaCmd = `${prismaBinAlt} migrate deploy`;
    logger.log(`Using Prisma binary from: ${prismaBinAlt}`);
  } else {
    prismaCmd = 'npx --yes prisma@5.22.0 migrate deploy';
    logger.warn(`Prisma binary not found, using npx with version 5.22.0 (may install package)`);
  }

  logger.log(`Executing: ${prismaCmd} in ${backendDir}`);
  try {
    const output = execSync(prismaCmd, {
      stdio: 'pipe',
      env: { ...process.env, PATH: process.env.PATH },
      cwd: backendDir,
      encoding: 'utf8',
    });
    logger.log(output);
    logger.log('✅ Database migrations completed successfully');
    return;
  } catch (migrationError: unknown) {
    const err = migrationError as { stderr?: { toString: () => string }; stdout?: { toString: () => string }; message?: string };
    const errorOutput =
      err.stderr?.toString() ||
      err.stdout?.toString() ||
      err.message ||
      '';

    logger.warn(`Migration error output: ${errorOutput.substring(0, 500)}`);

    if (
      errorOutput.includes('P3015') ||
      errorOutput.includes('Could not find the migration file')
    ) {
      logger.warn('⚠️ P3015: Migration file missing');
      logger.warn('Attempting to automatically resolve by marking migration as applied...');
      try {
        const migrationMatch = errorOutput.match(
          /migrations\/([^\/]+)\/migration\.sql/
        );
        if (migrationMatch && migrationMatch[1]) {
          const missingMigration = migrationMatch[1];
          logger.log(`Resolving missing migration: ${missingMigration}`);
          const resolveCmdBase = prismaCmd!.replace(
            /migrate deploy.*$/,
            'migrate resolve --applied'
          );
          const resolveCmd = `${resolveCmdBase} ${missingMigration}`;
          logger.log(`Executing: ${resolveCmd}`);
          try {
            execSync(resolveCmd, {
              stdio: 'pipe',
              env: { ...process.env, PATH: process.env.PATH },
              cwd: backendDir,
              encoding: 'utf8',
            });
            logger.log(`✅ Resolved missing migration: ${missingMigration}`);
            logger.log('🔄 Retrying migrations after resolving missing migration...');
            const retryOutput = execSync(prismaCmd!, {
              stdio: 'pipe',
              env: { ...process.env, PATH: process.env.PATH },
              cwd: backendDir,
              encoding: 'utf8',
            });
            logger.log(retryOutput);
            logger.log(
              '✅ Database migrations completed successfully after resolving missing migration'
            );
            return;
          } catch (resolveError: unknown) {
            logger.warn(
              `⚠️ Could not resolve migration ${missingMigration}, continuing anyway`
            );
          }
        } else {
          logger.warn('⚠️ Could not extract migration name from P3015 error');
        }
      } catch (resolveError: unknown) {
        const re = resolveError as { message?: string };
        logger.warn(
          `⚠️ Failed to auto-resolve P3015: ${re.message?.substring(0, 100) ?? 'unknown'}`
        );
      }
      return;
    }

    if (
      errorOutput.includes('P3009') ||
      errorOutput.includes('failed migrations in the target database')
    ) {
      logger.warn('⚠️ P3009: Failed migrations detected in database');
      logger.warn('Attempting to automatically resolve failed migrations...');
      try {
        const migrationMatch = errorOutput.match(/The `([^`]+)` migration/);
        if (migrationMatch && migrationMatch[1]) {
          const failedMigration = migrationMatch[1];
          logger.log(`Resolving failed migration: ${failedMigration}`);
          const resolveCmdBase = prismaCmd!.replace(
            /migrate deploy.*$/,
            'migrate resolve --applied'
          );
          const resolveCmd = `${resolveCmdBase} ${failedMigration}`;
          logger.log(`Executing: ${resolveCmd}`);
          execSync(resolveCmd, {
            stdio: 'inherit',
            env: { ...process.env, PATH: process.env.PATH },
            cwd: backendDir,
          });
          logger.log(`✅ Resolved failed migration: ${failedMigration}`);
        } else {
          logger.warn('⚠️ Could not extract migration name from error');
          throw migrationError;
        }

        logger.log('🔄 Retrying migrations after resolving failed migration...');
        let retryAttempts = 0;
        const maxRetries = 5;

        while (retryAttempts < maxRetries) {
          try {
            const retryOutput = execSync(prismaCmd!, {
              stdio: 'pipe',
              env: { ...process.env, PATH: process.env.PATH },
              cwd: backendDir,
              encoding: 'utf8',
            });
            logger.log(retryOutput);
            logger.log(
              '✅ Database migrations completed successfully after auto-resolution'
            );
            return;
          } catch (retryError: unknown) {
            const re = retryError as { stderr?: { toString: () => string }; stdout?: { toString: () => string }; message?: string };
            const retryErrorOutput =
              re.stderr?.toString() ||
              re.stdout?.toString() ||
              re.message ||
              '';

            if (
              retryErrorOutput.includes('P3009') ||
              retryErrorOutput.includes('P3018') ||
              retryErrorOutput.includes('failed migrations') ||
              retryErrorOutput.includes('failed to apply')
            ) {
              let nextFailedMigration = '';
              const nameMatch1 = retryErrorOutput.match(
                /Migration name: ([^\n]+)/
              );
              if (nameMatch1 && nameMatch1[1]) {
                nextFailedMigration = nameMatch1[1].trim();
              }
              if (!nextFailedMigration) {
                const nameMatch2 = retryErrorOutput.match(
                  /The `([^`]+)` migration/
                );
                if (nameMatch2 && nameMatch2[1]) {
                  nextFailedMigration = nameMatch2[1];
                }
              }

              if (nextFailedMigration) {
                retryAttempts++;
                logger.warn(
                  `⚠️ Another failed migration detected: ${nextFailedMigration} (attempt ${retryAttempts}/${maxRetries})`
                );
                logger.log(
                  `Resolving failed migration: ${nextFailedMigration}`
                );
                const resolveCmdBase = prismaCmd!.replace(
                  /migrate deploy.*$/,
                  'migrate resolve --applied'
                );
                const resolveCmd = `${resolveCmdBase} ${nextFailedMigration}`;
                execSync(resolveCmd, {
                  stdio: 'inherit',
                  env: { ...process.env, PATH: process.env.PATH },
                  cwd: backendDir,
                });
                logger.log(
                  `✅ Resolved failed migration: ${nextFailedMigration}`
                );
                continue;
              }
            }
            throw retryError;
          }
        }

        if (retryAttempts >= maxRetries) {
          logger.error(
            `❌ Reached maximum retry attempts (${maxRetries}). Manual intervention may be required.`
          );
          throw migrationError;
        }
      } catch (resolveError: unknown) {
        const re = resolveError as { message?: string };
        logger.error(
          `❌ Failed to auto-resolve migration: ${re.message ?? 'unknown'}`
        );
        logger.error(
          '⚠️ Manual intervention may be required to resolve failed migrations'
        );
        throw migrationError;
      }
    }

    throw migrationError;
  }
}

/**
 * Ensures critical database columns and enums exist (e.g. after migrations were
 * marked as applied but not executed). Uses PrismaClient for raw SQL.
 */
export async function ensureCriticalColumns(
  prisma: { $executeRawUnsafe: (query: string) => Promise<unknown>; $disconnect: () => Promise<void> },
  logger: Logger
): Promise<void> {
  const createColumnsQuery = `
      DO $$
      BEGIN
        -- User 2FA columns
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_2fa_enabled" BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "two_fa_secret" TEXT;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "temp_2fa_secret" TEXT;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "backup_codes" TEXT[] DEFAULT ARRAY[]::TEXT[];
        
        -- User AI credits columns
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ai_credits" INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ai_credits_purchased" INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ai_credits_used" INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_credit_purchase" TIMESTAMP(3);
        
        -- Product columns
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "baseAssetUrl" TEXT;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "baseImage" TEXT;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "baseImageUrl" TEXT;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "promptTemplate" TEXT;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "negativePrompt" TEXT;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "aiProvider" TEXT NOT NULL DEFAULT 'openai';
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "generationQuality" TEXT NOT NULL DEFAULT 'standard';
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "outputFormat" TEXT NOT NULL DEFAULT 'png';
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "outputWidth" INTEGER NOT NULL DEFAULT 1024;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "outputHeight" INTEGER NOT NULL DEFAULT 1024;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "arEnabled" BOOLEAN NOT NULL DEFAULT true;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "arTrackingType" TEXT NOT NULL DEFAULT 'surface';
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "arScale" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "arOffset" JSONB;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "category" TEXT;
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
        ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
        
        -- Brand columns
        ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
        ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "limits" JSONB;
        ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "monthlyGenerations" INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "maxMonthlyGenerations" INTEGER NOT NULL DEFAULT 100;
        ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "maxProducts" INTEGER NOT NULL DEFAULT 5;
        ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "arEnabled" BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "whiteLabel" BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
        ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
        
        -- WorkOrder columns
        ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "snapshotId" TEXT;
        
        -- Design columns
        ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "promptHash" TEXT;
        ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
        ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "renderUrl" TEXT;
        ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "canvasWidth" INTEGER;
        ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "canvasHeight" INTEGER;
        ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "canvasBackgroundColor" TEXT DEFAULT '#ffffff';
        ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "designData" JSONB;
        ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "optionsJson" JSONB;
      END $$;
    `;

  const enumQueries = [
    'DO $$ BEGIN CREATE TYPE "SubscriptionPlan" AS ENUM (\'FREE\', \'STARTER\', \'PROFESSIONAL\', \'ENTERPRISE\'); EXCEPTION WHEN duplicate_object THEN null; END $$',
    'DO $$ BEGIN CREATE TYPE "SubscriptionStatus" AS ENUM (\'ACTIVE\', \'PAST_DUE\', \'CANCELED\', \'TRIALING\'); EXCEPTION WHEN duplicate_object THEN null; END $$',
    'DO $$ BEGIN CREATE TYPE "ProductStatus" AS ENUM (\'DRAFT\', \'ACTIVE\', \'ARCHIVED\'); EXCEPTION WHEN duplicate_object THEN null; END $$',
    'DO $$ BEGIN CREATE TYPE "DesignStatus" AS ENUM (\'PENDING\', \'PROCESSING\', \'COMPLETED\', \'FAILED\', \'CANCELLED\'); EXCEPTION WHEN duplicate_object THEN null; END $$',
  ];

  const columnQueries = [
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_2fa_enabled" BOOLEAN NOT NULL DEFAULT false',
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "two_fa_secret" TEXT',
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "temp_2fa_secret" TEXT',
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "backup_codes" TEXT[] DEFAULT ARRAY[]::TEXT[]',
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ai_credits" INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ai_credits_purchased" INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ai_credits_used" INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_credit_purchase" TIMESTAMP(3)',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "baseAssetUrl" TEXT',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "baseImage" TEXT',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "baseImageUrl" TEXT',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "promptTemplate" TEXT',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "negativePrompt" TEXT',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "aiProvider" TEXT NOT NULL DEFAULT \'openai\'',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "generationQuality" TEXT NOT NULL DEFAULT \'standard\'',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "outputFormat" TEXT NOT NULL DEFAULT \'png\'',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "outputWidth" INTEGER NOT NULL DEFAULT 1024',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "outputHeight" INTEGER NOT NULL DEFAULT 1024',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "arEnabled" BOOLEAN NOT NULL DEFAULT true',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "arTrackingType" TEXT NOT NULL DEFAULT \'surface\'',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "arScale" DOUBLE PRECISION NOT NULL DEFAULT 1.0',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "arOffset" JSONB',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "category" TEXT',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[]',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3)',
    'ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT',
    'ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "limits" JSONB',
    'ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "monthlyGenerations" INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "maxMonthlyGenerations" INTEGER NOT NULL DEFAULT 100',
    'ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "maxProducts" INTEGER NOT NULL DEFAULT 5',
    'ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "arEnabled" BOOLEAN NOT NULL DEFAULT false',
    'ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "whiteLabel" BOOLEAN NOT NULL DEFAULT false',
    'ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)',
    'ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3)',
    'ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "snapshotId" TEXT',
    'ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "promptHash" TEXT',
    'ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT',
    'ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "renderUrl" TEXT',
    'ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "canvasWidth" INTEGER',
    'ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "canvasHeight" INTEGER',
    'ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "canvasBackgroundColor" TEXT DEFAULT \'#ffffff\'',
    'ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "designData" JSONB',
    'ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "optionsJson" JSONB',
  ];

  const enumColumnQueries = [
    'ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT \'FREE\'',
    'ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT \'TRIALING\'',
    'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "status" "ProductStatus" NOT NULL DEFAULT \'DRAFT\'',
    'ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "status" "DesignStatus" NOT NULL DEFAULT \'PENDING\'',
  ];

  try {
    await prisma.$executeRawUnsafe(createColumnsQuery);
    logger.log('✅ All critical columns created in single transaction');
  } catch (columnError: unknown) {
    const ce = columnError as { message?: string };
    logger.warn(
      `⚠️ Batch column creation failed, trying individual queries: ${ce.message?.substring(0, 100) ?? 'unknown'}`
    );
    for (const query of columnQueries) {
      try {
        await prisma.$executeRawUnsafe(query);
      } catch (queryError: unknown) {
        const qe = queryError as { message?: string };
        logger.debug(
          `Column check: ${qe.message?.substring(0, 100) ?? 'unknown'}`
        );
      }
    }
  }

  for (const query of enumQueries) {
    try {
      await prisma.$executeRawUnsafe(query);
    } catch (queryError: unknown) {
      const qe = queryError as { message?: string };
      logger.debug(`Enum check: ${qe.message?.substring(0, 100) ?? 'unknown'}`);
    }
  }

  for (const query of enumColumnQueries) {
    try {
      await prisma.$executeRawUnsafe(query);
    } catch (queryError: unknown) {
      const qe = queryError as { message?: string };
      logger.debug(
        `Enum column check: ${qe.message?.substring(0, 100) ?? 'unknown'}`
      );
    }
  }

  await prisma.$disconnect();
  logger.log('✅ Critical columns verified/created');
}
