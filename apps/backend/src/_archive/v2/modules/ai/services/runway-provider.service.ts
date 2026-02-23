/**
 * ★★★ SERVICE - RUNWAY ML PROVIDER ★★★
 * Service for video/animation generation via Runway API (image-to-video)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RunwayProviderService {
  private readonly logger = new Logger(RunwayProviderService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.dev.runwayml.com/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RUNWAY_API_KEY') || '';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateVideo(imageUrl: string, options?: {
    promptText?: string;
    duration?: 5 | 10;
    ratio?: '16:9' | '9:16';
    model?: 'gen3a_turbo';
  }): Promise<{ taskId: string }> {
    const res = await fetch(`${this.baseUrl}/image_to_video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: options?.model || 'gen3a_turbo',
        promptImage: imageUrl,
        promptText: options?.promptText || 'Smooth product rotation, studio lighting',
        duration: options?.duration || 5,
        ratio: options?.ratio || '16:9',
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Runway API error: ${res.status} - ${error}`);
    }

    const data = await res.json();
    return { taskId: data.id };
  }

  async getTaskStatus(taskId: string): Promise<{
    id: string;
    status: 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    output?: string[];
    failure?: string;
    progress: number;
  }> {
    const res = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Runway API error: ${res.status} - ${error}`);
    }

    return res.json();
  }

  async pollUntilComplete(taskId: string, maxWaitMs = 300000): Promise<{ videoUrl: string }> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const task = await this.getTaskStatus(taskId);

      if (task.status === 'SUCCEEDED' && task.output?.length) {
        return { videoUrl: task.output[0] };
      }
      if (task.status === 'FAILED') {
        throw new Error(`Runway task failed: ${task.failure || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    throw new Error('Runway task timed out');
  }
}
