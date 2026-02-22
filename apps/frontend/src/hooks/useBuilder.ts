'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNodesState, useEdgesState, addEdge, type Connection, type Node, type Edge } from '@xyflow/react';
import { useAutoSave } from './useAutoSave';
import { api } from '@/lib/api/client';
import type { BlockNodeData } from '@/packages/block-registry/src/types';
import { blockRegistry } from '@/packages/block-registry/src';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Agent {
  id: string;
  name: string;
  status: string;
  flowData?: { nodes: Node[]; edges: Edge[] } | null;
  [key: string]: unknown;
}

interface TestMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: Array<{ title: string; content: string }>;
}

export function useBuilder(agentId: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ data: Agent }>(`/api/v1/agents/${agentId}`);
        const data = (res as { data: Agent }).data ?? res;
        setAgent(data as Agent);
        if ((data as Agent).flowData) {
          const flow = (data as Agent).flowData!;
          setNodes(flow.nodes || []);
          setEdges(flow.edges || []);
        }
      } catch {
        // Agent not found
      }
    }
    load();
  }, [agentId, setNodes, setEdges]);

  useAutoSave({
    data: { nodes, edges },
    onSave: async (data) => {
      setIsSaving(true);
      try {
        await api.patch(`/api/v1/agents/${agentId}/flow`, data);
        setIsDirty(false);
      } finally {
        setIsSaving(false);
      }
    },
    delay: 2000,
    enabled: isDirty && !!agent,
  });

  useEffect(() => {
    if (agent) setIsDirty(true);
  }, [nodes, edges]); // eslint-disable-line react-hooks/exhaustive-deps

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onNodeSelect = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isSelected: n.id === node.id },
        }))
      );
    },
    [setNodes]
  );

  const onNodeConfigChange = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
        )
      );
    },
    [setNodes]
  );

  const onSendTestMessage = useCallback(
    async (message: string) => {
      setTestMessages((prev) => [...prev, { role: 'user', content: message }]);
      setIsTesting(true);

      try {
        const res = await api.post<{
          data: {
            response: string;
            sources?: Array<{ title: string; content: string }>;
            executionTrace?: Array<{ nodeId: string; result: unknown; duration: number }>;
          };
        }>(`/api/v1/agents/${agentId}/test`, { message, flow: { nodes, edges } });

        const data = (res as { data: { response: string; sources?: Array<{ title: string; content: string }>; executionTrace?: Array<{ nodeId: string }> } }).data;

        if (data.executionTrace) {
          for (const step of data.executionTrace) {
            setNodes((nds) =>
              nds.map((n) => ({
                ...n,
                data: { ...n.data, isRunning: n.id === step.nodeId },
              }))
            );
            setEdges((eds) =>
              eds.map((e) => ({
                ...e,
                data: { ...e.data, isActive: e.source === step.nodeId },
              }))
            );
            await sleep(600);
          }
        }

        setTestMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response, sources: data.sources },
        ]);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        setTestMessages((prev) => [
          ...prev,
          { role: 'system', content: `Error: ${msg}` },
        ]);
      } finally {
        setIsTesting(false);
        setNodes((nds) =>
          nds.map((n) => ({ ...n, data: { ...n.data, isRunning: false } }))
        );
        setEdges((eds) =>
          eds.map((e) => ({ ...e, data: { ...e.data, isActive: false } }))
        );
      }
    },
    [agentId, nodes, edges, setNodes, setEdges]
  );

  const onSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await api.patch(`/api/v1/agents/${agentId}/flow`, { nodes, edges });
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [agentId, nodes, edges]);

  const onPublish = useCallback(async () => {
    const hasTrigger = nodes.some(
      (n) => (n.data as BlockNodeData)?.block?.category === 'TRIGGER'
    );
    if (!hasTrigger) {
      throw new Error('Your flow needs at least one Trigger block');
    }

    await api.post(`/api/v1/agents/${agentId}/publish`, { flow: { nodes, edges } });
  }, [agentId, nodes, edges]);

  const onAddNode = useCallback(
    (blockId: string, position: { x: number; y: number }) => {
      const block = blockRegistry[blockId];
      if (!block) return;

      const newNode: Node = {
        id: `${blockId}_${Date.now()}`,
        type: blockId,
        position,
        data: {
          block,
          config: { ...block.defaultConfig },
          isSelected: false,
          isRunning: false,
        } satisfies BlockNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  return {
    agent,
    nodes,
    edges,
    selectedNode,
    isTestOpen,
    isTesting,
    isSaving,
    isDirty,
    testMessages,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeSelect,
    onNodeConfigChange,
    onSave,
    onPublish,
    onSendTestMessage,
    onAddNode,
    setIsTestOpen,
  };
}
