/**
 * AR Worker Entry Point
 * Standalone NestJS application for AR conversion and optimization workers.
 * Runs in a separate Docker container (Ubuntu + Blender).
 */

import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { ConversionWorker } from './conversion.worker';
import { OptimizationWorker } from './optimization.worker';
import { AnalyticsAggregationWorker } from './analytics-aggregation.worker';
import { FbxToGltfConverter } from '../conversion/converters/fbx-to-gltf.converter';
import { GltfToUsdzConverter } from '../conversion/converters/gltf-to-usdz.converter';
import { DracoEncoderService } from '../conversion/optimization/draco-encoder.service';
import { LODGeneratorService } from '../conversion/optimization/lod-generator.service';
import { TextureCompressorService } from '../conversion/optimization/texture-compressor.service';
import { MeshOptimizerService } from '../conversion/optimization/mesh-optimizer.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'ar-conversion' },
      { name: 'ar-optimization' },
      { name: 'ar-analytics' },
    ),
  ],
  providers: [
    ConversionWorker,
    OptimizationWorker,
    AnalyticsAggregationWorker,
    FbxToGltfConverter,
    GltfToUsdzConverter,
    DracoEncoderService,
    LODGeneratorService,
    TextureCompressorService,
    MeshOptimizerService,
  ],
})
class ARWorkerModule {}

async function bootstrap() {
  const logger = new Logger('ARWorker');

  const app = await NestFactory.createApplicationContext(ARWorkerModule);

  logger.log('AR Worker started successfully');
  logger.log('Listening on queues: ar-conversion, ar-optimization, ar-analytics');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down...');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  const logger = new Logger('ARWorker');
  logger.error('Failed to start AR Worker', err);
  process.exit(1);
});
