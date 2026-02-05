/**
 * ★★★ MODULE - AR STUDIO ★★★
 * Module NestJS pour AR Studio
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ArStudioController } from './ar-studio.controller';
import { ArStudioService } from './ar-studio.service';
import { ArIntegrationsController } from './controllers/ar-integrations.controller';
import { ArCollaborationController } from './controllers/ar-collaboration.controller';
import { ArIntegrationsService } from './services/ar-integrations.service';
import { ArCollaborationService } from './services/ar-collaboration.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';

@Module({
  imports: [PrismaModule, ConfigModule, StorageModule, HttpModule],
  controllers: [
    ArStudioController,
    ArIntegrationsController,
    ArCollaborationController,
  ],
  providers: [
    ArStudioService,
    ArIntegrationsService,
    ArCollaborationService,
  ],
  exports: [
    ArStudioService,
    ArIntegrationsService,
    ArCollaborationService,
  ],
})
export class ArStudioModule {}

