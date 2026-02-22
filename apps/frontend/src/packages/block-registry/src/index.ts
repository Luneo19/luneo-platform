export * from './types';

import type { BlockDefinition } from './types';

import { MessageReceivedBlock } from './blocks/triggers/message-received';
import { NewConversationBlock } from './blocks/triggers/new-conversation';
import { SearchKnowledgeBlock } from './blocks/actions/search-knowledge';
import { SendMessageBlock } from './blocks/actions/send-message';
import { TransferToHumanBlock } from './blocks/actions/transfer-to-human';
import { IfConditionBlock } from './blocks/conditions/if-condition';
import { ConfidenceCheckBlock } from './blocks/conditions/confidence-check';
import { GenerateResponseBlock } from './blocks/ai/generate-response';
import { AnalyzeIntentBlock } from './blocks/ai/analyze-intent';
import { ExtractDataBlock } from './blocks/ai/extract-data';

export const allBlocks: BlockDefinition[] = [
  MessageReceivedBlock,
  NewConversationBlock,
  SearchKnowledgeBlock,
  SendMessageBlock,
  TransferToHumanBlock,
  IfConditionBlock,
  ConfidenceCheckBlock,
  GenerateResponseBlock,
  AnalyzeIntentBlock,
  ExtractDataBlock,
];

export const blockRegistry: Record<string, BlockDefinition> = Object.fromEntries(
  allBlocks.map((block) => [block.id, block])
);

export const blocksByCategory = allBlocks.reduce<Record<string, BlockDefinition[]>>(
  (acc, block) => {
    if (!acc[block.category]) acc[block.category] = [];
    acc[block.category].push(block);
    return acc;
  },
  {}
);

export {
  MessageReceivedBlock,
  NewConversationBlock,
  SearchKnowledgeBlock,
  SendMessageBlock,
  TransferToHumanBlock,
  IfConditionBlock,
  ConfidenceCheckBlock,
  GenerateResponseBlock,
  AnalyzeIntentBlock,
  ExtractDataBlock,
};
