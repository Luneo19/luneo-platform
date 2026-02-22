import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorService } from './vector.service';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';

@Module({
  imports: [ConfigModule, PrismaOptimizedModule],
  providers: [VectorService],
  exports: [VectorService],
})
export class VectorModule {}
