import { Job, Worker } from 'bullmq';
import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

interface GenerateImageJobData {
  prompt: string;
  style: string;
  dimensions: string;
  quality: 'standard' | 'hd';
  userId: string;
  designId: string;
}

interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  metadata?: {
    dimensions: string;
    fileSize: number;
    format: string;
    generationTime: number;
  };
  error?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const QUEUE_NAME = 'image-generation';
const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

export class ImageGenerationWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(QUEUE_NAME, this.processJob.bind(this), {
      connection: REDIS_CONNECTION,
      concurrency: 3,
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    this.worker.on('completed', (job) => {
      console.log(`✅ Image generation completed for job ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Image generation failed for job ${job?.id}:`, err);
    });

    this.worker.on('error', (err) => {
      console.error('❌ Worker error:', err);
    });
  }

  private async processJob(job: Job<GenerateImageJobData>): Promise<GenerateImageResult> {
    const startTime = Date.now();
    const { prompt, style, dimensions, quality, userId, designId } = job.data;

    try {
      console.log(`🎨 Starting image generation for design ${designId}`);
      
      // Enhance prompt with style
      const enhancedPrompt = this.enhancePrompt(prompt, style);
      
      // Generate image with OpenAI DALL-E
      const response = await openai.images.generate({
        model: quality === 'hd' ? 'dall-e-3' : 'dall-e-2',
        prompt: enhancedPrompt,
        size: this.mapDimensions(dimensions),
        quality: quality === 'hd' ? 'hd' : 'standard',
        n: 1,
        response_format: 'url',
      });

      if (!response.data[0]?.url) {
        throw new Error('No image URL returned from OpenAI');
      }

      // Download and process image
      const imageUrl = response.data[0].url;
      const processedImage = await this.processImage(imageUrl, dimensions);
      
      // Save to storage
      const savedImage = await this.saveImage(processedImage, designId, userId);
      
      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(processedImage);
      const savedThumbnail = await this.saveThumbnail(thumbnail, designId, userId);

      const generationTime = Date.now() - startTime;

      console.log(`✅ Image generation completed in ${generationTime}ms`);

      return {
        success: true,
        imageUrl: savedImage.url,
        thumbnailUrl: savedThumbnail.url,
        metadata: {
          dimensions,
          fileSize: processedImage.length,
          format: 'PNG',
          generationTime,
        },
      };

    } catch (error) {
      console.error('❌ Image generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private enhancePrompt(prompt: string, style: string): string {
    const styleEnhancements: Record<string, string> = {
      moderne: 'modern, clean, minimalist design with contemporary aesthetics',
      vintage: 'vintage, retro style with classic design elements and aged textures',
      minimaliste: 'minimalist, simple, clean design with lots of white space',
      colore: 'vibrant, colorful design with bold colors and dynamic elements',
      professionnel: 'professional, corporate design suitable for business use',
      futuriste: 'futuristic, sci-fi design with technological elements',
      organique: 'organic, natural design with flowing shapes and earth tones',
      geometrique: 'geometric, structured design with precise shapes and patterns',
    };

    const styleEnhancement = styleEnhancements[style] || '';
    return `${prompt}. Style: ${styleEnhancement}. High quality, professional design.`;
  }

  private mapDimensions(dimensions: string): '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' {
    const dimensionMap: Record<string, '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'> = {
      '1024x1024': '1024x1024',
      '512x512': '512x512',
      '256x256': '256x256',
      '1792x1024': '1792x1024',
      '1024x1792': '1024x1792',
    };

    return dimensionMap[dimensions] || '1024x1024';
  }

  private async processImage(imageUrl: string, dimensions: string): Promise<Buffer> {
    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Process with Sharp
    const [width, height] = dimensions.split('x').map(Number);
    
    return await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .png({ quality: 95 })
      .toBuffer();
  }

  private async generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    return await sharp(imageBuffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  private async saveImage(imageBuffer: Buffer, designId: string, userId: string): Promise<{ url: string }> {
    // In production, save to cloud storage (S3, Cloudflare R2, etc.)
    const fileName = `${userId}/${designId}-${Date.now()}.png`;
    const filePath = path.join(process.cwd(), 'uploads', fileName);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, imageBuffer);

    // Return URL (in production, this would be a cloud storage URL)
    return {
      url: `/uploads/${fileName}`,
    };
  }

  private async saveThumbnail(thumbnailBuffer: Buffer, designId: string, userId: string): Promise<{ url: string }> {
    const fileName = `${userId}/${designId}-thumb-${Date.now()}.jpg`;
    const filePath = path.join(process.cwd(), 'uploads', 'thumbnails', fileName);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, thumbnailBuffer);

    return {
      url: `/uploads/thumbnails/${fileName}`,
    };
  }

  public async start(): Promise<void> {
    console.log('🚀 Image Generation Worker started');
  }

  public async stop(): Promise<void> {
    await this.worker.close();
    console.log('🛑 Image Generation Worker stopped');
  }
}

// Export for use in main worker file
export default ImageGenerationWorker;