'use client';

import type { Node } from '@xyflow/react';
import type { BlockNodeData } from '@/packages/block-registry/src/types';
import { X } from 'lucide-react';

interface ConfigPanelProps {
  node: Node;
  onConfigChange: (nodeId: string, config: Record<string, unknown>) => void;
  onClose: () => void;
}

export function ConfigPanel({ node, onConfigChange, onClose }: ConfigPanelProps) {
  const data = node.data as BlockNodeData;
  const block = data.block;
  const config = data.config;

  const handleChange = (key: string, value: unknown) => {
    onConfigChange(node.id, { ...config, [key]: value });
  };

  return (
    <div className="w-80 border-l bg-white overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: block.color + '20' }}
          >
            <span>{block.icon}</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{block.name}</h3>
            <p className="text-[10px] text-gray-400">{block.category}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-gray-500">{block.description}</p>

        {Object.entries(config).map(([key, value]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            {typeof value === 'boolean' ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleChange(key, e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-600">{value ? 'Activé' : 'Désactivé'}</span>
              </label>
            ) : typeof value === 'number' ? (
              <input
                type="number"
                value={value}
                onChange={(e) => handleChange(key, parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            ) : typeof value === 'string' ? (
              value.length > 80 ? (
                <textarea
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              )
            ) : (
              <pre className="text-[10px] bg-gray-50 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(value, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
