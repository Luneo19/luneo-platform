import { z } from 'zod';
import type { ComponentType } from 'react';

export type BlockCategory = 'TRIGGER' | 'ACTION' | 'CONDITION' | 'AI' | 'INTEGRATION' | 'UTILITY';

export interface PortDefinition {
  id: string;
  label: string;
  type: 'default' | 'success' | 'failure' | 'true' | 'false';
}

export interface BlockDefinition<TConfig = Record<string, unknown>> {
  id: string;
  name: string;
  description: string;
  category: BlockCategory;
  icon: string;
  color: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  configSchema: z.ZodType<TConfig>;
  defaultConfig: TConfig;
  component: ComponentType<{ data: BlockNodeData; [key: string]: unknown }>;
  configPanel?: ComponentType<BlockConfigProps<TConfig>>;
}

export interface BlockConfigProps<TConfig = Record<string, unknown>> {
  config: TConfig;
  onChange: (config: TConfig) => void;
}

export interface BlockNodeData {
  block: BlockDefinition;
  config: Record<string, unknown>;
  isSelected: boolean;
  isRunning: boolean;
  lastResult?: unknown;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: BlockNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: { isActive?: boolean };
}
