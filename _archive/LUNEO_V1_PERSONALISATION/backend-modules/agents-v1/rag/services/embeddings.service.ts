import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private client: OpenAI | null = null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
    this.model = this.configService.get<string>(
      'EMBEDDING_MODEL',
      'text-embedding-3-small',
    );
  }

  async embed(text: string): Promise<number[]> {
    if (!this.client) throw new Error('OpenAI client not configured for embeddings');

    const response = await this.client.embeddings.create({
      model: this.model,
      input: text.substring(0, 8000), // Limit input length
    });

    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.client) throw new Error('OpenAI client not configured for embeddings');

    const truncated = texts.map((t) => t.substring(0, 8000));
    const response = await this.client.embeddings.create({
      model: this.model,
      input: truncated,
    });

    return response.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }

  getDimensions(): number {
    return this.model.includes('3-small') || this.model.includes('3-large') ? 1536 : 1536;
  }
}
