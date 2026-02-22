import { z } from 'zod';
import type { BlockDefinition } from '../../types';
import { BaseBlockNode } from '../../components/BaseBlockNode';

const configSchema = z.object({
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'email', 'phone', 'number', 'date', 'order_id']),
    required: z.boolean().default(false),
    description: z.string().optional(),
  })).default([
    { name: 'email', type: 'email' as const, required: false },
    { name: 'name', type: 'text' as const, required: false },
  ]),
});

export const ExtractDataBlock: BlockDefinition = {
  id: 'ai_extract_data',
  name: 'Extract Data',
  description: 'Extract structured data from the message',
  category: 'AI',
  icon: '📋',
  color: '#6366F1',
  inputs: [{ id: 'message', label: 'Message', type: 'default' }],
  outputs: [{ id: 'data', label: 'Extracted Data', type: 'default' }],
  configSchema,
  defaultConfig: {
    fields: [
      { name: 'email', type: 'email' as const, required: false },
      { name: 'name', type: 'text' as const, required: false },
    ],
  },
  component: BaseBlockNode,
};
