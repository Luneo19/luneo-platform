import { Module } from '@nestjs/common';
import { DesignDNAService } from './design-dna.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DesignDNAService],
  exports: [DesignDNAService],
})
export class DesignDNAModule {}




























