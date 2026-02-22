import { z } from 'zod';
import type { BlockDefinition } from '../../types';
import { BaseBlockNode } from '../../components/BaseBlockNode';

const configSchema = z.object({
  messageTemplate: z.string().default('{{response}}'),
  includeSources: z.boolean().default(true),
  typingDelay: z.number().min(0).max(5000).default(800),
});

export const SendMessageBlock: BlockDefinition = {
  id: 'action_send_message',
  name: 'Send Message',
  description: 'Send a response to the visitor',
  category: 'ACTION',
  icon: '📤',
  color: '#3B82F6',
  inputs: [{ id: 'content', label: 'Content', type: 'default' }],
  outputs: [{ id: 'sent', label: 'Sent', type: 'default' }],
  configSchema,
  defaultConfig: { messageTemplate: '{{response}}', includeSources: true, typingDelay: 800 },
  component: BaseBlockNode,
};
