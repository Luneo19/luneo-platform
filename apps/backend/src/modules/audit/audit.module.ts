import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SecurityModule } from '@/modules/security/security.module';

@Module({
  imports: [PrismaModule, SecurityModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class AuditModule {}
