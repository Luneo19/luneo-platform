'use client';

import { useParams, useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { useBuilder } from '@/hooks/useBuilder';
import { BuilderCanvas } from '@/components/builder/BuilderCanvas';
import { BlocksPanel } from '@/components/builder/BlocksPanel';
import { ConfigPanel } from '@/components/builder/ConfigPanel';
import { ChatTestPanel } from '@/components/builder/ChatTestPanel';
import { ArrowLeft, Save, Play, Rocket, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

function BuilderContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const agentId = params.id;

  const {
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
  } = useBuilder(agentId);

  const handlePublish = async () => {
    try {
      await onPublish();
      confetti({ particleCount: 100, spread: 70 });
      toast.success('Agent publié avec succès !');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur lors de la publication';
      toast.error(msg);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/agents')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-800">
              {agent?.name || 'Chargement...'}
            </h1>
            <p className="text-[10px] text-gray-400">
              {isDirty ? 'Modifications non sauvegardées' : 'Sauvegardé'}
              {isSaving && ' • Sauvegarde...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Sauvegarder
          </button>

          <button
            id="test-button"
            onClick={() => setIsTestOpen(!isTestOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition"
          >
            <Play className="h-3.5 w-3.5" />
            Tester
          </button>

          <button
            id="publish-button"
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            <Rocket className="h-3.5 w-3.5" />
            Publier
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        <BlocksPanel />

        <div className="flex-1 relative" id="builder-canvas">
          <BuilderCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeSelect}
            onAddNode={onAddNode}
          />

          {isTestOpen && (
            <ChatTestPanel
              messages={testMessages}
              isTesting={isTesting}
              onSendMessage={onSendTestMessage}
              onClose={() => setIsTestOpen(false)}
            />
          )}
        </div>

        {selectedNode && (
          <ConfigPanel
            node={selectedNode}
            onConfigChange={onNodeConfigChange}
            onClose={() => {/* deselect handled by clicking canvas */}}
          />
        )}
      </div>
    </div>
  );
}

export default function AgentBuilderPage() {
  return (
    <ReactFlowProvider>
      <BuilderContent />
    </ReactFlowProvider>
  );
}
