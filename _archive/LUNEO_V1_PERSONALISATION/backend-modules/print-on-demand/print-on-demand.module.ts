import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { PrintOnDemandController } from './print-on-demand.controller';
import { PrintOnDemandService } from './print-on-demand.service';
import { PrintfulProvider } from './providers/printful.provider';
import { PrintifyProvider } from './providers/printify.provider';
import { GelatoProvider } from './providers/gelato.provider';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [PrintOnDemandController],
  providers: [PrintOnDemandService, PrintfulProvider, PrintifyProvider, GelatoProvider],
  exports: [PrintOnDemandService],
})
export class PrintOnDemandModule {}
