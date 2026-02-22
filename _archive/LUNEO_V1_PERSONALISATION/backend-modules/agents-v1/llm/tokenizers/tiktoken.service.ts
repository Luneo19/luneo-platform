import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TiktokenService {
  private readonly logger = new Logger(TiktokenService.name);

  async countTokens(text: string, model = 'gpt-4o'): Promise<number> {
    try {
      const { encoding_for_model } = await import('tiktoken');
      const enc = encoding_for_model(model as Parameters<typeof encoding_for_model>[0]);
      const tokens = enc.encode(text);
      const count = tokens.length;
      enc.free();
      return count;
    } catch {
      this.logger.debug(`tiktoken unavailable for model ${model}, using estimation`);
      return this.estimateTokens(text);
    }
  }

  async countMessagesTokens(
    messages: Array<{ role: string; content: string }>,
    model = 'gpt-4o',
  ): Promise<number> {
    let total = 0;
    for (const msg of messages) {
      total += 4; // overhead per message
      total += await this.countTokens(msg.content, model);
      total += await this.countTokens(msg.role, model);
    }
    total += 2; // priming tokens
    return total;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  estimateCost(
    promptTokens: number,
    completionTokens: number,
    model: string,
  ): number {
    let costs: { input: number; output: number } | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LLM_COSTS_PER_1K_TOKENS } = require('../../services/llm-provider.enum');
      costs = LLM_COSTS_PER_1K_TOKENS[model];
    } catch {
      return 0;
    }
    if (!costs) return 0;
    return (promptTokens / 1000) * costs.input + (completionTokens / 1000) * costs.output;
  }
}
