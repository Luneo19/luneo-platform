import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { ApiKeysModule } from '@/modules/public-api/api-keys/api-keys.module';
import { ZapierService } from './zapier.service';
import { ZapierController } from './zapier.controller';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ApiKeysModule,
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 3,
    }),
  ],
  controllers: [ZapierController],
  providers: [ZapierService],
  exports: [ZapierService],
})
export class ZapierModule {}
