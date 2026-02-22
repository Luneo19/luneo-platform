import { z } from 'zod';
import type { BlockDefinition } from '../../types';
import { BaseBlockNode } from '../../components/BaseBlockNode';

const configSchema = z.object({
  threshold: z.number().min(0).max(1).default(0.7),
});

export const ConfidenceCheckBlock: BlockDefinition = {
  id: 'condition_confidence_check',
  name: 'Confidence Check',
  description: 'Branch based on AI confidence score',
  category: 'CONDITION',
  icon: '📊',
  color: '#F97316',
  inputs: [{ id: 'input', label: 'Input', type: 'default' }],
  outputs: [
    { id: 'confident', label: 'Confident', type: 'success' },
    { id: 'uncertain', label: 'Uncertain', type: 'failure' },
  ],
  configSchema,
  defaultConfig: { threshold: 0.7 },
  component: BaseBlockNode,
};
