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
      await this.$connect();
      logger.log('✅ Prisma connected to database');
    } catch (error) {
      logger.error('❌ Failed to connect to database', error);
      // Retry connection after 2 seconds
      setTimeout(async () => {
        try {
          await this.$connect();
          logger.log('✅ Prisma reconnected to database');
        } catch (retryError) {
          logger.error('❌ Retry connection failed', retryError);
        }
      }, 2000);
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
