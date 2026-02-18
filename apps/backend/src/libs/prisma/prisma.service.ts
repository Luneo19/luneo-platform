import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('PrismaService');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Access to all Prisma models including DesignDNA, PromptTemplate, OutboxEvent, Artisan, WorkOrder, Payout
  constructor(private configService: ConfigService) {
    // Connection pool settings are applied via DATABASE_URL query params in production
    // (e.g. connection_limit=10&pool_timeout=20&connect_timeout=10). See .env.example and PRODUCTION_CHECKLIST.md.
    const databaseUrl = configService.get('database.url');

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: configService.get('app.nodeEnv') === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Soft-delete middleware: automatically filter deleted records
    // P2-1/P2-7: Extended to cover findUnique + aggregate + groupBy + all soft-deletable models
    this.$use(async (params, next) => {
      const softDeleteModels = [
        'User', 'Brand', 'Product', 'Design', 'Order',
        'Workspace', 'Project',
      ];
      
      if (softDeleteModels.includes(params.model || '')) {
        // For ALL find/read operations, add deletedAt: null filter
        if (['findMany', 'findFirst', 'findUnique', 'findFirstOrThrow', 'findUniqueOrThrow'].includes(params.action)) {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          // Don't override if explicitly querying for deleted records
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }
        // For count and aggregate operations
        if (['count', 'aggregate', 'groupBy'].includes(params.action)) {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }
        // Convert delete to soft delete
        if (params.action === 'delete') {
          params.action = 'update';
          if (!params.args) params.args = {};
          params.args['data'] = { deletedAt: new Date() };
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (!params.args) params.args = {};
          params.args['data'] = { deletedAt: new Date() };
        }
      }
      
      return next(params);
    });
  }

  async onModuleInit() {
    try {
      // Retry logic avec backoff exponentiel
      let retries = 3;
      let delay = 1000;
      
      while (retries > 0) {
        try {
          await this.$connect();
          logger.log('✅ Prisma connected to database');
          return;
        } catch (error: unknown) {
          retries--;
          const errMsg = error instanceof Error ? error.message : String(error);
          if (retries === 0) {
            logger.error('❌ Failed to connect to database', errMsg);
            // Ne pas throw pour permettre à l'application de démarrer en mode dégradé
            logger.warn('⚠️ Application starting in degraded mode (database unavailable)');
            return;
          }
          logger.warn(`⚠️ Database connection failed, retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Backoff exponentiel
        }
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('❌ Failed to connect to database', errMsg);
      logger.warn('⚠️ Application starting in degraded mode (database unavailable)');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Cleans the database by truncating all public tables (test env only).
   * Uses a whitelist from pg_tables and Prisma.sql/Prisma.raw to avoid SQL injection.
   */
  async cleanDatabase() {
    if (this.configService.get('app.nodeEnv') === 'test') {
      const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
      const validTableNames = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations');

      try {
        for (const tablename of validTableNames) {
          const qualifiedName = `"public"."${tablename}"`;
          await this.$executeRaw(Prisma.sql`TRUNCATE TABLE ${Prisma.raw(qualifiedName)} CASCADE`);
        }
      } catch (error) {
        logger.error('Error cleaning database', error);
      }
    }
  }
}
