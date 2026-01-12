import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('PrismaService');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Access to all Prisma models including DesignDNA, PromptTemplate, OutboxEvent, Artisan, WorkOrder, Payout
  constructor(private configService: ConfigService) {
    // Configuration optimisée pour Railway/PostgreSQL
    // Ajouter des paramètres de pool dans DATABASE_URL si nécessaire
    const databaseUrl = configService.get('database.url');
    
    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: configService.get('app.nodeEnv') === 'development' ? ['query', 'error', 'warn'] : ['error'],
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
        } catch (error: any) {
          retries--;
          if (retries === 0) {
            logger.error('❌ Failed to connect to database', error.message);
            // Ne pas throw pour permettre à l'application de démarrer en mode dégradé
            logger.warn('⚠️ Application starting in degraded mode (database unavailable)');
            return;
          }
          logger.warn(`⚠️ Database connection failed, retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Backoff exponentiel
        }
      }
    } catch (error: any) {
      logger.error('❌ Failed to connect to database', error.message);
      logger.warn('⚠️ Application starting in degraded mode (database unavailable)');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (this.configService.get('app.nodeEnv') === 'test') {
      const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname='public'
      `;

      const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"public"."${name}"`)
        .join(', ');

      try {
        await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      } catch (error) {
        logger.error('Error cleaning database', error);
      }
    }
  }
}
