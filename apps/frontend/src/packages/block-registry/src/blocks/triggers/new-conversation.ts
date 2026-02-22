import { z } from 'zod';
import type { BlockDefinition } from '../../types';
import { BaseBlockNode } from '../../components/BaseBlockNode';

const configSchema = z.object({
  greetingMessage: z.string().default('Bonjour ! Comment puis-je vous aider ?'),
  delayMs: z.number().min(0).max(10000).default(500),
});

export const NewConversationBlock: BlockDefinition = {
  id: 'trigger_new_conversation',
  name: 'New Conversation',
  description: 'Triggered when a new conversation starts',
  category: 'TRIGGER',
  icon: '🆕',
  color: '#8B5CF6',
  inputs: [],
  outputs: [{ id: 'conversation', label: 'Conversation', type: 'default' }],
  configSchema,
  defaultConfig: { greetingMessage: 'Bonjour ! Comment puis-je vous aider ?', delayMs: 500 },
  component: BaseBlockNode,
};
