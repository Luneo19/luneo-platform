'use client';

import { useState, useMemo } from 'react';
import { blocksByCategory, type BlockDefinition } from '@/packages/block-registry/src';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

const categoryLabels: Record<string, { label: string; icon: string }> = {
  TRIGGER: { label: 'Triggers', icon: '⚡' },
  ACTION: { label: 'Actions', icon: '🎯' },
  CONDITION: { label: 'Conditions', icon: '🔀' },
  AI: { label: 'Intelligence', icon: '🤖' },
  INTEGRATION: { label: 'Intégrations', icon: '🔗' },
  UTILITY: { label: 'Utilitaires', icon: '🔧' },
};

const categoryOrder = ['TRIGGER', 'AI', 'ACTION', 'CONDITION', 'INTEGRATION', 'UTILITY'];

function DraggableBlock({ block }: { block: BlockDefinition }) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', block.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
        style={{ backgroundColor: block.color + '20', color: block.color }}
      >
        {block.icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">{block.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{block.description}</p>
      </div>
    </div>
  );
}

export function BlocksPanel() {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase();
    return categoryOrder
      .filter((cat) => blocksByCategory[cat])
      .map((cat) => ({
        category: cat,
        ...categoryLabels[cat],
        blocks: blocksByCategory[cat].filter(
          (b) =>
            !q ||
            b.name.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.blocks.length > 0);
  }, [search]);

  return (
    <div id="blocks-panel" className="w-64 border-r bg-white overflow-y-auto flex-shrink-0">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un bloc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="p-2 space-y-1">
        {filteredCategories.map(({ category, label, icon, blocks }) => {
          const isCollapsed = collapsed[category];
          return (
            <div key={category}>
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [category]: !c[category] }))}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                <span>{icon}</span>
                <span>{label}</span>
                <span className="ml-auto text-gray-400">{blocks.length}</span>
              </button>
              {!isCollapsed && (
                <div className="space-y-1 mt-1 mb-2">
                  {blocks.map((block) => (
                    <DraggableBlock key={block.id} block={block} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
