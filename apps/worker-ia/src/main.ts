import { ImageGenerationWorker } from './jobs/generateImage';
import { UpscaleWorker } from './jobs/upscale';
import { BlendTextureWorker } from './jobs/blendTexture';
import { ExportGLTFWorker } from './jobs/exportGLTF';
import { ARPreviewWorker } from './jobs/arPreview';

class LuneoAIWorker {
  private workers: Array<{ name: string; worker: any }> = [];

  constructor() {
    this.initializeWorkers();
  }

  private async initializeWorkers(): Promise<void> {
    try {
      console.log('🚀 Initializing Luneo AI Workers...');

      // Initialize all workers
      const imageWorker = new ImageGenerationWorker();
      const upscaleWorker = new UpscaleWorker();
      const blendWorker = new BlendTextureWorker();
      const gltfWorker = new ExportGLTFWorker();
      const arWorker = new ARPreviewWorker();

      this.workers = [
        { name: 'ImageGeneration', worker: imageWorker },
        { name: 'Upscale', worker: upscaleWorker },
        { name: 'BlendTexture', worker: blendWorker },
        { name: 'ExportGLTF', worker: gltfWorker },
        { name: 'ARPreview', worker: arWorker },
      ];

      // Start all workers
      for (const { name, worker } of this.workers) {
        await worker.start();
        console.log(`✅ ${name} Worker started`);
      }

      console.log('🎉 All AI Workers initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize workers:', error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    console.log('🌟 Luneo AI Worker Service Starting...');
    
    // Handle graceful shutdown
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    
    console.log('✅ Luneo AI Worker Service is running');
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      // Stop all workers
      for (const { name, worker } of this.workers) {
        await worker.stop();
        console.log(`✅ ${name} Worker stopped`);
      }
      
      console.log('✅ All workers stopped gracefully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the worker service
const luneoWorker = new LuneoAIWorker();
luneoWorker.start().catch((error) => {
  console.error('❌ Failed to start Luneo AI Worker:', error);
  process.exit(1);
});



