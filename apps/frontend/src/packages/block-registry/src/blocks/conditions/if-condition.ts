import { z } from 'zod';
import type { BlockDefinition } from '../../types';
import { BaseBlockNode } from '../../components/BaseBlockNode';

const configSchema = z.object({
  variable: z.string().default(''),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty']).default('equals'),
  value: z.string().default(''),
});

export const IfConditionBlock: BlockDefinition = {
  id: 'condition_if',
  name: 'If / Else',
  description: 'Branch based on a condition',
  category: 'CONDITION',
  icon: '🔀',
  color: '#F97316',
  inputs: [{ id: 'input', label: 'Input', type: 'default' }],
  outputs: [
    { id: 'true', label: 'True', type: 'true' },
    { id: 'false', label: 'False', type: 'false' },
  ],
  configSchema,
  defaultConfig: { variable: '', operator: 'equals', value: '' },
  component: BaseBlockNode,
};
