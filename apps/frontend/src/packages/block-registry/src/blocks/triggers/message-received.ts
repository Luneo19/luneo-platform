import { z } from 'zod';
import type { BlockDefinition } from '../../types';
import { BaseBlockNode } from '../../components/BaseBlockNode';

const configSchema = z.object({
  channels: z.array(z.string()).default(['widget']),
  filterKeywords: z.array(z.string()).default([]),
});

export const MessageReceivedBlock: BlockDefinition = {
  id: 'trigger_message_received',
  name: 'Message Received',
  description: 'Triggered when a visitor sends a message',
  category: 'TRIGGER',
  icon: '💬',
  color: '#8B5CF6',
  inputs: [],
  outputs: [{ id: 'message', label: 'Message', type: 'default' }],
  configSchema,
  defaultConfig: { channels: ['widget'], filterKeywords: [] },
  component: BaseBlockNode,
};
