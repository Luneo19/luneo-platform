import { Injectable, Logger } from '@nestjs/common';
import { PromptManagerService } from './prompt-manager.service';
import { LLMMessage } from '../llm/providers/base-llm.provider';

export interface PromptContext {
  brandName?: string;
  brandId?: string;
  userName?: string;
  userId?: string;
  agentType: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  currentDate?: string;
  locale?: string;
  customVariables?: Record<string, string>;
}

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  constructor(private readonly promptManager: PromptManagerService) {}

  async buildMessages(
    userMessage: string,
    context: PromptContext,
  ): Promise<LLMMessage[]> {
    const systemPrompt = await this.buildSystemPrompt(context);
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (limited to last N messages to control tokens)
    if (context.conversationHistory?.length) {
      const history = context.conversationHistory.slice(-20); // Last 20 messages
      for (const msg of history) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    messages.push({ role: 'user', content: userMessage });
    return messages;
  }

  async buildSystemPrompt(context: PromptContext): Promise<string> {
    const resolved = await this.promptManager.getSystemPrompt(
      context.agentType,
      context.brandId,
    );

    let content = resolved.content;

    // Replace template variables
    const variables: Record<string, string> = {
      brand_name: context.brandName || 'the brand',
      user_name: context.userName || 'the user',
      current_date: context.currentDate || new Date().toISOString().split('T')[0],
      locale: context.locale || 'fr-FR',
      agent_type: context.agentType,
      ...context.customVariables,
    };

    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Append tool instructions if available
    const toolInstructions = await this.promptManager.getToolInstructions(context.agentType);
    if (toolInstructions) {
      content += `\n\n${toolInstructions}`;
    }

    return content;
  }
}
