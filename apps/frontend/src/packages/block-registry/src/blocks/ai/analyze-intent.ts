import { z } from 'zod';
import type { BlockDefinition } from '../../types';
import { BaseBlockNode } from '../../components/BaseBlockNode';

const configSchema = z.object({
  intents: z.array(z.object({
    name: z.string(),
    description: z.string(),
    examples: z.array(z.string()).default([]),
  })).default([
    { name: 'support', description: 'Customer needs help', examples: [] },
    { name: 'sales', description: 'Customer wants to buy', examples: [] },
    { name: 'other', description: 'Anything else', examples: [] },
  ]),
  confidenceThreshold: z.number().min(0).max(1).default(0.6),
});

export const AnalyzeIntentBlock: BlockDefinition = {
  id: 'ai_analyze_intent',
  name: 'Analyze Intent',
  description: 'Classify the user intent using AI',
  category: 'AI',
  icon: '🧠',
  color: '#6366F1',
  inputs: [{ id: 'message', label: 'Message', type: 'default' }],
  outputs: [{ id: 'intent', label: 'Intent', type: 'default' }],
  configSchema,
  defaultConfig: {
    intents: [
      { name: 'support', description: 'Customer needs help', examples: [] },
      { name: 'sales', description: 'Customer wants to buy', examples: [] },
      { name: 'other', description: 'Anything else', examples: [] },
    ],
    confidenceThreshold: 0.6,
  },
  component: BaseBlockNode,
};
