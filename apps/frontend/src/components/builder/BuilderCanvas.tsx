'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { blockRegistry } from '@/packages/block-registry/src';
import { BaseBlockNode } from '@/packages/block-registry/src/components/BaseBlockNode';
import { MousePointerClick } from 'lucide-react';
import type { BlockNodeData } from '@/packages/block-registry/src/types';

const nodeTypes = Object.fromEntries(
  Object.values(blockRegistry).map((block) => [block.id, BaseBlockNode])
);

interface BuilderCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onAddNode: (blockId: string, position: { x: number; y: number }) => void;
}

export function BuilderCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onAddNode,
}: BuilderCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const blockId = event.dataTransfer.getData('application/reactflow');
      if (!blockId || !blockRegistry[blockId]) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      onAddNode(blockId, position);
    },
    [screenToFlowPosition, onAddNode]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      nodeTypes={nodeTypes}
      fitView
      snapToGrid
      snapGrid={[15, 15]}
      className="bg-gray-50"
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={15} size={1} color="#e5e7eb" variant={BackgroundVariant.Dots} />
      <Controls className="bg-white rounded-lg shadow-md" />
      <MiniMap
        className="bg-white rounded-lg shadow-md"
        nodeColor={(node) => (node.data as BlockNodeData)?.block?.color ?? '#999'}
      />

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <MousePointerClick className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-500">
              Glissez des blocs ici pour construire votre agent
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Commencez par un bloc Trigger
            </p>
          </div>
        </div>
      )}
    </ReactFlow>
  );
}
