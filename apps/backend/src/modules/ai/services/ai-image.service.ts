/**
 * AI Image Processing Service
 * Handles upscale, background removal, extract colors, smart crop
 */

import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreditsService } from '@/libs/credits/credits.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';
import axios from 'axios';
import sharp from 'sharp';

@Injectable()
export class AIImageService {
  private readonly logger = new Logger(AIImageService.name);
  private readonly replicateApiKey: string;
  private readonly cloudinaryCloudName: string;
  private readonly cloudinaryApiKey: string;
  private readonly cloudinaryApiSecret: string;

  constructor(
    private readonly creditsService: CreditsService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // PRODUCTION FIX: Standardize on REPLICATE_API_TOKEN (matches configuration.ts)
    this.replicateApiKey = this.configService.get<string>('REPLICATE_API_TOKEN') || this.configService.get<string>('ai.replicate.apiToken') || '';
    this.cloudinaryCloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || '';
    this.cloudinaryApiKey = this.configService.get<string>('CLOUDINARY_API_KEY') || '';
    this.cloudinaryApiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET') || '';
  }

  /**
   * Upscale image using Real-ESRGAN via Replicate or Cloudinary
   */
  async upscale(
    imageUrl: string,
    scale: '2' | '4' = '2',
    enhanceDetails: boolean = true,
    currentUser: CurrentUser,
  ): Promise<{ url: string; width: number; height: number }> {
    const creditsRequired = scale === '2' ? 2 : 4;

    // Check credits
    const creditsCheck = await this.creditsService.checkCredits(currentUser.id, 'ai/upscale', creditsRequired);
    if (!creditsCheck.sufficient) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${creditsRequired}, Available: ${creditsCheck.balance}`,
      );
    }

    try {
      let upscaledUrl: string | undefined;
      let width: number = 0;
      let height: number = 0;

      // Try Replicate first if API key is configured
      if (this.replicateApiKey) {
        try {
          const response = await axios.post(
            'https://api.replicate.com/v1/predictions',
            {
              version: 'db21a45d67f2db9e6c38d20d6d4d67f3f5b0e1c5',
              input: {
                image: imageUrl,
                scale: parseInt(scale),
                face_enhance: enhanceDetails,
              },
            },
            {
              headers: {
                Authorization: `Token ${this.replicateApiKey}`,
                'Content-Type': 'application/json',
              },
            },
          );

          // Poll for result
          let prediction = response.data;
          while (prediction.status === 'starting' || prediction.status === 'processing') {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const statusResponse = await axios.get(prediction.urls.get, {
              headers: { Authorization: `Token ${this.replicateApiKey}` },
            });
            prediction = statusResponse.data;
          }

          if (prediction.status === 'succeeded') {
            const outputUrl = prediction.output;
            if (typeof outputUrl !== 'string') throw new InternalServerErrorException('Invalid upscale output');
            upscaledUrl = outputUrl;
            // Get dimensions from image
            const imageResponse = await axios.get(upscaledUrl, { responseType: 'arraybuffer' });
            const metadata = await sharp(Buffer.from(imageResponse.data)).metadata();
            width = metadata.width || 0;
            height = metadata.height || 0;
          } else {
            this.logger.error('Replicate upscale failed', { predictionError: prediction.error });
            throw new InternalServerErrorException('Image processing failed. Please try again.');
          }
        } catch (replicateError) {
          this.logger.warn('Replicate upscale failed, falling back to Cloudinary', replicateError);
          // Fall through to Cloudinary
        }
      }

      // Fallback to Cloudinary
      if (!upscaledUrl && this.cloudinaryCloudName) {
        const scaleValue = scale === '2' ? 200 : 400;
        upscaledUrl = `https://res.cloudinary.com/${this.cloudinaryCloudName}/image/fetch/q_auto,f_auto,w_${scaleValue}/${imageUrl}`;
        
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const metadata = await sharp(Buffer.from(imageResponse.data)).metadata();
        width = (metadata.width || 0) * parseInt(scale);
        height = (metadata.height || 0) * parseInt(scale);
      } else if (!upscaledUrl) {
        throw new BadRequestException('No upscale service configured');
      }

      // Deduct credits
      await this.creditsService.deductCredits(currentUser.id, 'ai/upscale', {
        scale,
        enhanceDetails,
        originalUrl: imageUrl,
        upscaledUrl: upscaledUrl!,
      });

      return { url: upscaledUrl!, width, height };
    } catch (error) {
      this.logger.error('AI image upscale failed', { error });
      throw new InternalServerErrorException('Image processing failed. Please try again.');
    }
  }

  /**
   * Remove background from image using Replicate rembg
   */
  async removeBackground(
    imageUrl: string,
    mode: 'auto' | 'person' | 'product' | 'animal' = 'auto',
    currentUser: CurrentUser,
  ): Promise<{ url: string }> {
    const creditsRequired = 1;

    // Check credits
    const creditsCheck = await this.creditsService.checkCredits(currentUser.id, 'ai/background-removal', creditsRequired);
    if (!creditsCheck.sufficient) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${creditsRequired}, Available: ${creditsCheck.balance}`,
      );
    }

    try {
      let resultUrl: string;

      if (this.replicateApiKey) {
        const _modelMap = {
          auto: 'cjwbw/rembg',
          person: 'cjwbw/rembg',
          product: 'cjwbw/rembg',
          animal: 'cjwbw/rembg',
        };

        const response = await axios.post(
          'https://api.replicate.com/v1/predictions',
          {
            version: 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
            input: {
              image: imageUrl,
            },
          },
          {
            headers: {
              Authorization: `Token ${this.replicateApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );

        // Poll for result
        let prediction = response.data;
        while (prediction.status === 'starting' || prediction.status === 'processing') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const statusResponse = await axios.get(prediction.urls.get, {
            headers: { Authorization: `Token ${this.replicateApiKey}` },
          });
          prediction = statusResponse.data;
        }

        if (prediction.status === 'succeeded') {
          resultUrl = prediction.output;
        } else {
          this.logger.error('Replicate background removal failed', { predictionError: prediction.error });
          throw new InternalServerErrorException('Image processing failed. Please try again.');
        }
      } else {
        throw new BadRequestException('Replicate API key not configured');
      }

      // Deduct credits
      await this.creditsService.deductCredits(currentUser.id, 'ai/background-removal', {
        mode,
        originalUrl: imageUrl,
        resultUrl,
      });

      return { url: resultUrl };
    } catch (error) {
      this.logger.error('AI image processing failed', { error });
      throw new BadRequestException('Image processing failed. Please try again.');
    }
  }

  /**
   * Extract colors from image using Sharp
   */
  async extractColors(
    imageUrl: string,
    maxColors: number = 6,
    includeNeutral: boolean = false,
    currentUser: CurrentUser,
  ): Promise<{
    colors: Array<{
      hex: string;
      rgb: { r: number; g: number; b: number };
      hsl: { h: number; s: number; l: number };
      percentage: number;
    }>;
  }> {
    const creditsRequired = 1;

    // Check credits
    const creditsCheck = await this.creditsService.checkCredits(currentUser.id, 'ai/extract-colors', creditsRequired);
    if (!creditsCheck.sufficient) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${creditsRequired}, Available: ${creditsCheck.balance}`,
      );
    }

    try {
      // Download and process image
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(imageResponse.data);

      // Resize for faster processing
      const resized = await sharp(imageBuffer)
        .resize(200, 200, { fit: 'inside' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = resized;
      const pixels = new Uint8Array(data);
      const colorMap = new Map<string, number>();

      // Count color occurrences (quantized)
      for (let i = 0; i < pixels.length; i += info.channels) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // Quantize colors (reduce palette)
        const quantizedR = Math.floor(r / 32) * 32;
        const quantizedG = Math.floor(g / 32) * 32;
        const quantizedB = Math.floor(b / 32) * 32;

        const key = `${quantizedR},${quantizedG},${quantizedB}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }

      // Convert to array and sort by frequency
      const totalPixels = pixels.length / info.channels;
      const colorArray = Array.from(colorMap.entries())
        .map(([key, count]) => {
          const [r, g, b] = key.split(',').map(Number);
          const percentage = (count / totalPixels) * 100;
          
          // Filter out neutral colors if requested
          if (!includeNeutral) {
            const saturation = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
            if (saturation < 30) return null; // Neutral color
          }

          return {
            hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
            rgb: { r, g, b },
            hsl: this.rgbToHsl(r, g, b),
            percentage,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b!.percentage - a!.percentage)
        .slice(0, maxColors);

      // Deduct credits
      await this.creditsService.deductCredits(currentUser.id, 'ai/extract-colors', {
        maxColors,
        includeNeutral,
        colorsFound: colorArray.length,
      });

      return { colors: colorArray as Array<{ hex: string; rgb: { r: number; g: number; b: number }; hsl: { h: number; s: number; l: number }; percentage: number }> };
    } catch (error) {
      this.logger.error('Extract colors failed', { error });
      throw new InternalServerErrorException('Image processing failed. Please try again.');
    }
  }

  /**
   * Generate image with DALL-E 3
   */
  async generate(
    prompt: string,
    size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024',
    quality: 'standard' | 'hd' = 'standard',
    style: 'vivid' | 'natural' = 'vivid',
    currentUser: CurrentUser,
  ): Promise<{ url: string; revisedPrompt?: string }> {
    const creditsRequired = size === '1024x1024' ? 5 : 7;
    const qualityMultiplier = quality === 'hd' ? 2 : 1;
    const totalCreditsRequired = creditsRequired * qualityMultiplier;

    // Check credits
    const creditsCheck = await this.creditsService.checkCredits(
      currentUser.id,
      'ai/generate',
      totalCreditsRequired,
    );
    if (!creditsCheck.sufficient) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${totalCreditsRequired}, Available: ${creditsCheck.balance}`,
      );
    }

    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new BadRequestException('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt,
          n: 1,
          size,
          quality,
          style,
        },
        {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const imageUrl = response.data.data[0].url;
      const revisedPrompt = response.data.data[0].revised_prompt;

      // Deduct credits
      await this.creditsService.deductCredits(currentUser.id, 'ai/generate', {
        credits: totalCreditsRequired,
        size,
        quality,
        style,
        revisedPrompt,
      });

      return { url: imageUrl, revisedPrompt };
    } catch (error) {
      this.logger.error('AI image generation failed', { error });
      throw new InternalServerErrorException('Image generation failed. Please try again.');
    }
  }

  /**
   * Smart crop image to target aspect ratio
   */
  async smartCrop(
    imageUrl: string,
    targetAspectRatio: '1:1' | '16:9' | '9:16' | '4:3' = '1:1',
    focusPoint: 'auto' | 'face' | 'center' | 'product' = 'auto',
    currentUser: CurrentUser,
  ): Promise<{
    url: string;
    cropArea: { x: number; y: number; width: number; height: number };
    originalSize: { width: number; height: number };
    newSize: { width: number; height: number };
  }> {
    const creditsRequired = 1;

    // Check credits
    const creditsCheck = await this.creditsService.checkCredits(currentUser.id, 'ai/smart-crop', creditsRequired);
    if (!creditsCheck.sufficient) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${creditsRequired}, Available: ${creditsCheck.balance}`,
      );
    }

    try {
      const aspectRatioMap: Record<string, { width: number; height: number }> = {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1920, height: 1080 },
        '9:16': { width: 1080, height: 1920 },
        '4:3': { width: 1600, height: 1200 },
      };

      // Download image
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(imageResponse.data);
      const metadata = await sharp(imageBuffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new BadRequestException('Invalid image metadata');
      }

      const targetSize = aspectRatioMap[targetAspectRatio];
      const targetAspect = targetSize.width / targetSize.height;
      const sourceAspect = metadata.width / metadata.height;

      let cropX = 0;
      let cropY = 0;
      let cropWidth = metadata.width;
      let cropHeight = metadata.height;

      // Calculate crop area
      let focusY = 0.5; // Default center
      if (focusPoint !== 'center' && focusPoint !== 'auto') {
        // Use specified focus point
        focusY = focusPoint === 'face' ? 0.3 : 0.5; // Face typically upper third
      } else if (focusPoint === 'auto') {
        // Auto-detect focus point
        focusY = await this.detectFocusPoint(imageUrl, targetAspect);
      }

      if (sourceAspect > targetAspect) {
        // Image wider, crop horizontally
        cropWidth = Math.round(metadata.height * targetAspect);
        cropX = Math.round((metadata.width - cropWidth) * 0.5); // Center horizontally
      } else {
        // Image taller, crop vertically
        cropHeight = Math.round(metadata.width / targetAspect);
        // Use detected focus point for vertical positioning
        cropY = Math.round((metadata.height - cropHeight) * focusY);
      }

      // Apply crop and resize
      const croppedBuffer = await sharp(imageBuffer)
        .extract({
          left: cropX,
          top: cropY,
          width: cropWidth,
          height: cropHeight,
        })
        .resize(targetSize.width, targetSize.height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 90 })
        .toBuffer();

      // Upload to Cloudinary if configured
      let resultUrl: string;
      if (this.cloudinaryCloudName && this.cloudinaryApiKey) {
        try {
          const { v2: cloudinary } = await import('cloudinary');
          cloudinary.config({
            cloud_name: this.cloudinaryCloudName,
            api_key: this.cloudinaryApiKey,
            api_secret: this.cloudinaryApiSecret,
          });

          const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: 'luneo/ai-studio/crops',
                  public_id: `${currentUser.id}/${Date.now()}`,
                  resource_type: 'image',
                  format: 'webp',
                },
                (error, result) => {
                  if (error) reject(error);
                  else if (result?.secure_url) resolve({ secure_url: result.secure_url });
                  else reject(new Error('Cloudinary upload failed: no URL returned'));
                },
              )
              .end(croppedBuffer);
          });

          resultUrl = uploadResult.secure_url;
        } catch (cloudinaryError) {
          this.logger.warn('Cloudinary upload failed, using data URL', { error: cloudinaryError });
          // Fallback to base64 data URL
          resultUrl = `data:image/webp;base64,${croppedBuffer.toString('base64')}`;
        }
      } else {
        // Fallback to base64
        resultUrl = `data:image/webp;base64,${croppedBuffer.toString('base64')}`;
      }

      // Deduct credits
      await this.creditsService.deductCredits(currentUser.id, 'ai/smart-crop', {
        targetAspectRatio,
        focusPoint,
        cropArea: { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
      });

      return {
        url: resultUrl,
        cropArea: { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
        originalSize: { width: metadata.width, height: metadata.height },
        newSize: targetSize,
      };
    } catch (error) {
      this.logger.error('Smart crop failed', { error });
      throw new InternalServerErrorException('Image processing failed. Please try again.');
    }
  }

  /**
   * Détecte le point focal (visage ou produit) pour smart crop
   */
  private async detectFocusPoint(
    imageUrl: string,
    _aspectRatio: number,
  ): Promise<number> {
    try {
      // Utiliser Replicate pour détection visage/produit si disponible
      if (this.replicateApiKey) {
        try {
          // Détection visage avec MediaPipe ou modèle similaire
          const faceDetectionResponse = await axios.post(
            'https://api.replicate.com/v1/predictions',
            {
              model: 'cjwbw/face-detection',
              input: {
                image: imageUrl,
              },
            },
            {
              headers: {
                Authorization: `Token ${this.replicateApiKey}`,
                'Content-Type': 'application/json',
              },
            },
          );

          // Poll for result
          let prediction = faceDetectionResponse.data;
          let attempts = 0;
          while ((prediction.status === 'starting' || prediction.status === 'processing') && attempts < 30) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const statusResponse = await axios.get(prediction.urls.get, {
              headers: { Authorization: `Token ${this.replicateApiKey}` },
            });
            prediction = statusResponse.data;
            attempts++;
          }

          if (prediction.status === 'succeeded' && prediction.output) {
            // Si visage détecté, calculer position Y centrée sur le visage
            const faces = Array.isArray(prediction.output) ? prediction.output : [prediction.output];
            if (faces.length > 0) {
              const face = faces[0];
              // Retourner position Y normalisée (0-1) centrée sur le visage
              return face.y ? Math.max(0, Math.min(1, face.y)) : 0.5;
            }
          }
        } catch (faceError) {
          this.logger.debug('Face detection failed, trying product detection', faceError);
        }

        // Fallback: détection produit avec modèle object detection
        try {
          const productDetectionResponse = await axios.post(
            'https://api.replicate.com/v1/predictions',
            {
              model: 'yolov8',
              input: {
                image: imageUrl,
              },
            },
            {
              headers: {
                Authorization: `Token ${this.replicateApiKey}`,
                'Content-Type': 'application/json',
              },
            },
          );

          let prediction = productDetectionResponse.data;
          let attempts = 0;
          while ((prediction.status === 'starting' || prediction.status === 'processing') && attempts < 30) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const statusResponse = await axios.get(prediction.urls.get, {
              headers: { Authorization: `Token ${this.replicateApiKey}` },
            });
            prediction = statusResponse.data;
            attempts++;
          }

          if (prediction.status === 'succeeded' && prediction.output) {
            const detections = Array.isArray(prediction.output) ? prediction.output : [prediction.output];
            if (detections.length > 0) {
              // Prendre le premier objet détecté et centrer sur lui
              const detection = detections[0];
              return detection.y ? Math.max(0, Math.min(1, detection.y)) : 0.5;
            }
          }
        } catch (productError) {
          this.logger.debug('Product detection failed, using center crop', productError);
        }
      }

      // Fallback: utiliser Sharp pour détecter la région la plus intéressante (saliency)
      try {
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data);
        const _metadata = await sharp(imageBuffer).metadata();

        // Simple heuristic: centre de l'image si pas de détection
        // Pour améliorer, on pourrait utiliser sharp pour analyser la composition
        return 0.5; // Centre par défaut
      } catch (sharpError) {
        this.logger.warn('Failed to analyze image for focus point', sharpError);
        return 0.5; // Centre par défaut
      }
    } catch (error) {
      this.logger.warn(`Focus point detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 0.5; // Centre par défaut si échec
    }
  }

  /**
   * Helper: Convert RGB to HSL
   */
  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }
}
