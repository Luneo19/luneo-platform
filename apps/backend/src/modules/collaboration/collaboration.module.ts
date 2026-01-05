/**
 * ★★★ MODULE - COLLABORATION ★★★
 * Module NestJS pour la collaboration
 * Respecte les patterns existants du projet
 */

import { Module } from '@nestjs/common';
import { CollaborationService } from './services/collaboration.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}








