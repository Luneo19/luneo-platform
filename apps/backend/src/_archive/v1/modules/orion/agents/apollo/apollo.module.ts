import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { ApolloService } from './apollo.service';
import { ApolloController } from './apollo.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ApolloController],
  providers: [ApolloService],
  exports: [ApolloService],
})
export class ApolloModule {}
