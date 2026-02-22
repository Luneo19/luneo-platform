import { z } from 'zod';
import type { BlockDefinition } from '../../types';
import { BaseBlockNode } from '../../components/BaseBlockNode';

const configSchema = z.object({
  topK: z.number().min(1).max(20).default(5),
  scoreThreshold: z.number().min(0).max(1).default(0.7),
  knowledgeBaseIds: z.array(z.string()).default([]),
});

export const SearchKnowledgeBlock: BlockDefinition = {
  id: 'action_search_knowledge',
  name: 'Search Knowledge',
  description: 'Search the knowledge base using RAG',
  category: 'ACTION',
  icon: '🔍',
  color: '#3B82F6',
  inputs: [{ id: 'query', label: 'Query', type: 'default' }],
  outputs: [{ id: 'results', label: 'Results', type: 'default' }],
  configSchema,
  defaultConfig: { topK: 5, scoreThreshold: 0.7, knowledgeBaseIds: [] },
  component: BaseBlockNode,
};
