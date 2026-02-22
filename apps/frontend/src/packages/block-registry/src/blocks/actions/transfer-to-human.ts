import { z } from 'zod';
import type { BlockDefinition } from '../../types';
import { BaseBlockNode } from '../../components/BaseBlockNode';

const configSchema = z.object({
  transferMessage: z.string().default('Je vous transfère vers un agent humain.'),
  department: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export const TransferToHumanBlock: BlockDefinition = {
  id: 'action_transfer_to_human',
  name: 'Transfer to Human',
  description: 'Escalate the conversation to a human agent',
  category: 'ACTION',
  icon: '🧑‍💼',
  color: '#F59E0B',
  inputs: [{ id: 'trigger', label: 'Trigger', type: 'default' }],
  outputs: [{ id: 'transferred', label: 'Transferred', type: 'default' }],
  configSchema,
  defaultConfig: { transferMessage: 'Je vous transfère vers un agent humain.', priority: 'medium' },
  component: BaseBlockNode,
};
