import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaQueryHelper } from './prisma-query.helpers';

@Global()
@Module({
  providers: [PrismaService, PrismaQueryHelper],
  exports: [PrismaService, PrismaQueryHelper],
})
export class PrismaModule {}
