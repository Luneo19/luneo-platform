/**
 * ★★★ MODULE - EDITOR ★★★
 * Module NestJS pour l'éditeur de designs
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { Module } from '@nestjs/common';
import { EditorController } from './editor.controller';
import { EditorService } from './editor.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EditorController],
  providers: [EditorService],
  exports: [EditorService],
})
export class EditorModule {}

