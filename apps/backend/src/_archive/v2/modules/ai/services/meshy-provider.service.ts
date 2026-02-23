/**
 * ★★★ SERVICE - MESHY AI PROVIDER ★★★
 * Service for 3D model generation via Meshy API (text-to-3d, image-to-3d)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface MeshyGenerateResponse {
  result: string; // task ID
}

interface MeshyTaskResponse {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  model_urls?: {
    glb: string;
    fbx: string;
    usdz: string;
    obj: string;
  };
  thumbnail_url?: string;
  progress: number;
  task_error?: { message: string };
}

@Injectable()
export class MeshyProviderService {
  private readonly logger = new Logger(MeshyProviderService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.meshy.ai/v2';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MESHY_API_KEY') || '';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateFromText(prompt: string, options?: {
    artStyle?: 'realistic' | 'cartoon' | 'low-poly' | 'sculpture';
    negativePrompt?: string;
    resolution?: '1024' | '2048';
  }): Promise<{ taskId: string }> {
    const res = await fetch(`${this.baseUrl}/text-to-3d`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'preview',
        prompt,
        art_style: options?.artStyle || 'realistic',
        negative_prompt: options?.negativePrompt || '',
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Meshy API error: ${res.status} - ${error}`);
    }

    const data: MeshyGenerateResponse = await res.json();
    return { taskId: data.result };
  }

  async generateFromImage(imageUrl: string, _options?: {
    resolution?: '1024' | '2048';
  }): Promise<{ taskId: string }> {
    const res = await fetch(`${this.baseUrl}/image-to-3d`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Meshy API error: ${res.status} - ${error}`);
    }

    const data: MeshyGenerateResponse = await res.json();
    return { taskId: data.result };
  }

  async getTaskStatus(taskId: string): Promise<MeshyTaskResponse> {
    const res = await fetch(`${this.baseUrl}/text-to-3d/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Meshy API error: ${res.status} - ${error}`);
    }

    return res.json();
  }

  async pollUntilComplete(taskId: string, maxWaitMs = 300000): Promise<MeshyTaskResponse> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const task = await this.getTaskStatus(taskId);

      if (task.status === 'SUCCEEDED') return task;
      if (task.status === 'FAILED' || task.status === 'EXPIRED') {
        throw new Error(`Meshy task failed: ${task.task_error?.message || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    throw new Error('Meshy task timed out');
  }
}
