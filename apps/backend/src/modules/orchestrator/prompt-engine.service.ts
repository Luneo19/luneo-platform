import { Injectable } from '@nestjs/common';
import { ConversationContext } from './context-builder.service';

interface PromptBuildInput {
  basePrompt: string;
  customInstructions?: string | null;
  tone?: string | null;
  languageInstruction: string;
  context: ConversationContext;
}

@Injectable()
export class PromptEngineService {
  buildPrompt(input: PromptBuildInput): string {
    let prompt = input.basePrompt?.trim()
      ? input.basePrompt
      : 'Tu es un assistant IA professionnel.';

    if (input.customInstructions?.trim()) {
      prompt += `\n\nInstructions:\n${input.customInstructions.trim()}`;
    }

    if (input.context.verticalContext) {
      prompt += `\n\nContexte vertical:\n${input.context.verticalContext}`;
    }

    if (input.context.ragContext) {
      prompt += `\n\nConnaissance pertinente:\n${input.context.ragContext}`;
    }

    if (input.context.memoryContext) {
      prompt += `\n\nMemoire conversationnelle:\n${input.context.memoryContext}`;
    }

    prompt += `\n\nTon attendu: ${input.tone ?? 'PROFESSIONAL'}`;
    prompt += `\n${input.languageInstruction}`;
    prompt += '\nSi une information manque, indique-le clairement sans inventer.';
    prompt += '\nQuand possible, reponds de maniere actionnable et concise.';

    return prompt;
  }
}
