import { Job, Worker } from 'bullmq';
import { gltfPipeline } from 'gltf-pipeline';
import * as THREE from 'three';
import { logger } from '../utils/logger';
import { saveToStorage } from '../utils/storage';
import type { ExportGLTFJobData, ExportGLTFResult } from '../types';

export class ExportGLTFWorker {
  private worker: Worker;

  constructor(connection: any) {
    this.worker = new Worker(
      'export-gltf',
      this.processJob.bind(this),
      {
        connection,
        concurrency: 2,
        removeOnComplete: 50,
        removeOnFail: 25,
      }
    );

    this.worker.on('completed', (job) => {
      logger.info(`GLTF export completed for job ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`GLTF export failed for job ${job?.id}:`, err);
    });
  }

  private async processJob(job: Job<ExportGLTFJobData>): Promise<ExportGLTFResult> {
    const { designId, modelUrl, format, optimization } = job.data;
    
    logger.info(`Starting GLTF export for design ${designId}`);

    try {
      // Chargement du modèle 3D
      const model = await this.loadModel(modelUrl);
      
      // Conversion en GLTF
      const gltfData = await this.convertToGLTF(model, format, optimization);
      
      // Sauvegarde
      const savedUrl = await saveToStorage(
        Buffer.from(JSON.stringify(gltfData)),
        `models/${designId}/model.${format}`
      );

      return {
        success: true,
        modelUrl: savedUrl,
        format,
        size: Buffer.byteLength(JSON.stringify(gltfData)),
        metadata: {
          designId,
          format,
          optimization,
          exportedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Error in GLTF export:', error);
      throw error;
    }
  }

  private async loadModel(modelUrl: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      
      loader.load(
        modelUrl,
        (gltf) => resolve(gltf.scene),
        undefined,
        (error) => reject(error)
      );
    });
  }

  private async convertToGLTF(
    model: THREE.Group, 
    format: 'gltf' | 'glb',
    optimization: any
  ): Promise<any> {
    const exporter = new THREE.GLTFExporter();
    
    const options = {
      format: format === 'glb' ? 'glb' : 'gltf',
      ...optimization
    };

    return new Promise((resolve, reject) => {
      exporter.parse(
        model,
        (result) => {
          if (format === 'gltf') {
            // Optimisation GLTF
            gltfPipeline.processGltf(result, {
              draco: {
                compressionLevel: 7
              },
              ...optimization
            }).then((processed) => {
              resolve(processed.gltf);
            }).catch(reject);
          } else {
            resolve(result);
          }
        },
        (error) => reject(error),
        options
      );
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}


