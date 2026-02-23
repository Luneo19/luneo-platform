'use client';

import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import type { BlockNodeData } from '../types';

export interface BaseBlockNodeProps {
  data: BlockNodeData;
}

function BaseBlockNodeInner({ data }: BaseBlockNodeProps) {
  const { block, isSelected, isRunning } = data;

  return (
    <div
      className={`
        min-w-[180px] rounded-xl border-2 bg-white shadow-md transition-all duration-200
        ${isSelected ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-gray-200'}
        ${isRunning ? 'border-green-500 shadow-lg shadow-green-500/30 animate-pulse' : ''}
      `}
    >
      {block.inputs.length > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ backgroundColor: block.color + '20', color: block.color }}
          >
            {block.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{block.name}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{block.category}</p>
          </div>
        </div>
      </div>

      {block.outputs.map((output, i) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Bottom}
          id={output.id}
          className="!w-3 !h-3 !border-2 !border-white"
          style={{
            backgroundColor: output.type === 'success' ? '#10B981' : output.type === 'failure' ? '#EF4444' : block.color,
            left: block.outputs.length > 1 ? `${((i + 1) / (block.outputs.length + 1)) * 100}%` : '50%',
          }}
        />
      ))}
    </div>
  );
}

export const BaseBlockNode = memo(BaseBlockNodeInner);
