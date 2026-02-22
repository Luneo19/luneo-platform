import { z } from 'zod';
import type { BlockDefinition } from '../../types';
import { BaseBlockNode } from '../../components/BaseBlockNode';

const configSchema = z.object({
  model: z.string().default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(50).max(4096).default(1024),
  systemPromptOverride: z.string().optional(),
  useKnowledgeBase: z.boolean().default(true),
  language: z.string().default('fr'),
});

export const GenerateResponseBlock: BlockDefinition = {
  id: 'ai_generate_response',
  name: 'Generate Response',
  description: 'Generate an AI response using RAG + LLM',
  category: 'AI',
  icon: '🤖',
  color: '#6366F1',
  inputs: [{ id: 'context', label: 'Context', type: 'default' }],
  outputs: [{ id: 'response', label: 'Response', type: 'default' }],
  configSchema,
  defaultConfig: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1024,
    useKnowledgeBase: true,
    language: 'fr',
  },
  component: BaseBlockNode,
};
