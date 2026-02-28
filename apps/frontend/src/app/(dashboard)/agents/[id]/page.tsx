'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { endpoints } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Bot,
  BookOpen,
  MessageSquare,
  Send,
  Settings,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  Workflow,
  Play,
  Pause,
  AlertTriangle,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: string;
  model: string;
  temperature: number;
  greeting: string | null;
  systemPrompt: string | null;
  channels: Array<{ id: string; type: string; status: string; widgetId?: string }>;
  agentKnowledgeBases?: Array<{
    knowledgeBase: { id: string; name: string; status: string; documentsCount: number };
  }>;
}

interface AgentReadiness {
  ready: boolean;
  checklist: {
    hasKnowledgeBase: boolean;
    hasChannel: boolean;
    hasFlowTrigger: boolean;
    statusEligible: boolean;
    requireFlowTrigger: boolean;
  };
  missing: string[];
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', greeting: '' });
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState<{ response: string; sources?: Array<{ title: string; preview?: string }> } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<Array<{ id: string; name: string }>>([]);
  const [kbLoading, setKbLoading] = useState<string | null>(null);
  const [channelLoading, setChannelLoading] = useState(false);
  const [copiedWidgetId, setCopiedWidgetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'publish' | 'pause' | 'duplicate' | 'delete' | null>(null);
  const [activeTab, setActiveTab] = useState('config');
  const [readiness, setReadiness] = useState<AgentReadiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

  const fetchAgent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await endpoints.agents.get(id);
      const data = (res as { data?: Agent })?.data ?? (res as Agent);
      setAgent(data);
      setEditForm({
        name: data.name ?? '',
        description: data.description ?? '',
        greeting: data.greeting ?? '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger l\'agent');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReadiness = useCallback(async () => {
    if (!id) return;
    setReadinessLoading(true);
    try {
      const res = await endpoints.agents.readiness(id);
      setReadiness((res as { data?: AgentReadiness })?.data ?? (res as AgentReadiness));
    } catch {
      setReadiness(null);
    } finally {
      setReadinessLoading(false);
    }
  }, [id]);

  const fetchKnowledgeBases = useCallback(async () => {
    try {
      const res = await endpoints.knowledge.bases.list();
      const bases = (res as { data?: Array<{ id: string; name: string }> })?.data ?? (res as Array<{ id: string; name: string }>);
      setKnowledgeBases(Array.isArray(bases) ? bases : []);
    } catch {
      setKnowledgeBases([]);
    }
  }, []);

  useEffect(() => {
    fetchAgent();
    fetchKnowledgeBases();
    fetchReadiness();
  }, [fetchAgent, fetchKnowledgeBases, fetchReadiness]);

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      await endpoints.agents.update(agent.id, editForm);
      await fetchAgent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!agent || !testMessage.trim()) return;
    setTestLoading(true);
    setTestResponse(null);
    try {
      const res = await endpoints.agents.test(agent.id, { message: testMessage.trim() });
      const data = (res as { data?: { response: string; sources?: Array<{ title: string; preview?: string }> } })?.data ?? (res as { response: string; sources?: Array<{ title: string; preview?: string }> });
      setTestResponse({ response: data.response, sources: data.sources });
    } catch (err) {
      setTestResponse({ response: `Erreur: ${err instanceof Error ? err.message : 'Échec du test'}` });
    } finally {
      setTestLoading(false);
    }
  };

  const attachedKBs = agent?.agentKnowledgeBases ?? [];

  const handleAttachKB = async (kbId: string) => {
    if (!agent) return;
    setKbLoading(kbId);
    try {
      await endpoints.agents.attachKnowledgeBase(agent.id, kbId);
      await fetchAgent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'attachement');
    } finally {
      setKbLoading(null);
    }
  };

  const handleDetachKB = async (kbId: string) => {
    if (!agent) return;
    setKbLoading(kbId);
    try {
      await endpoints.agents.detachKnowledgeBase(agent.id, kbId);
      await fetchAgent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du détachement');
    } finally {
      setKbLoading(null);
    }
  };

  const handleCreateWidgetChannel = async () => {
    if (!agent) return;
    setChannelLoading(true);
    try {
      await endpoints.channels.create({ agentId: agent.id, type: 'WIDGET' });
      await fetchAgent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du canal');
    } finally {
      setChannelLoading(false);
    }
  };

  const handleCopyEmbed = (widgetId: string) => {
    const code = `<script src="https://luneo.app/widget.js" data-widget="${widgetId}" async></script>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedWidgetId(widgetId);
      setTimeout(() => setCopiedWidgetId(null), 2000);
    });
  };

  const handlePublish = async () => {
    if (!agent) return;
    setActionLoading('publish');
    try {
      await endpoints.agents.publish(agent.id);
      await fetchAgent();
      await fetchReadiness();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de publication');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async () => {
    if (!agent) return;
    setActionLoading('pause');
    try {
      await endpoints.agents.pause(agent.id);
      await fetchAgent();
      await fetchReadiness();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de pause');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async () => {
    if (!agent) return;
    setActionLoading('duplicate');
    try {
      const res = await endpoints.agents.duplicate(agent.id);
      const duplicatedId = (res as { id?: string; data?: { id?: string } })?.id ?? (res as { data?: { id?: string } })?.data?.id;
      if (duplicatedId) {
        router.push(`/agents/${duplicatedId}`);
        return;
      }
      await fetchAgent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de duplication');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!agent) return;
    if (!confirm(`Supprimer l'agent "${agent.name}" ?`)) return;
    setActionLoading('delete');
    try {
      await endpoints.agents.delete(agent.id);
      router.push('/agents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const goToKnowledgeStep = () => setActiveTab('knowledge');
  const goToChannelsStep = () => setActiveTab('channels');

  const readinessLabelMap: Record<string, string> = {
    knowledge_base: 'Ajouter au moins une base de connaissance',
    channel: 'Créer au moins un canal',
    status: "L'agent doit être dans un statut publiable",
    flow_trigger: 'Ajouter un Trigger dans le flow builder',
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="space-y-6">
        <Link href="/agents" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Retour aux agents
        </Link>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-red-400">{error ?? 'Agent introuvable'}</p>
          <Button variant="outline" onClick={() => router.push('/agents')} className="mt-4 border-white/20 text-white">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/agents" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Retour aux agents
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/[0.06]">
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
              <p className="text-sm text-white/50">{agent.description || 'Sans description'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleDuplicate}
              disabled={actionLoading !== null}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {actionLoading === 'duplicate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
              Dupliquer
            </Button>
            {agent.status === 'ACTIVE' ? (
              <Button
                variant="outline"
                onClick={handlePause}
                disabled={actionLoading !== null}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {actionLoading === 'pause' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pause className="mr-2 h-4 w-4" />}
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handlePublish}
                disabled={actionLoading !== null || Boolean(readiness && !readiness.ready)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {actionLoading === 'publish' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Publier
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={actionLoading !== null}
              className="border-red-500/30 text-red-300 hover:bg-red-500/10"
            >
              {actionLoading === 'delete' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Supprimer
            </Button>
            <Button
              onClick={() => router.push(`/agents/${agent.id}/builder`)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
            >
              <Workflow className="mr-2 h-4 w-4" />
              Visual Builder
            </Button>
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              {agent.status}
            </span>
          </div>
        </div>
      </div>

      {agent.status !== 'ACTIVE' && (
        <div className="rounded-2xl border border-white/[0.06] bg-gray-900/50 p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Tunnel d&apos;activation</h3>
              <p className="text-sm text-white/60">Create -&gt; Connect -&gt; Publish</p>
            </div>
            {readinessLoading ? (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Vérification...
              </div>
            ) : readiness?.ready ? (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                Prêt à publier
              </span>
            ) : (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                Prérequis manquants
              </span>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <button
              onClick={goToKnowledgeStep}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                readiness?.checklist.hasKnowledgeBase
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <p className="text-sm font-medium text-white">1. Connect Knowledge</p>
              <p className="mt-1 text-xs text-white/60">
                {readiness?.checklist.hasKnowledgeBase ? 'OK' : 'Ajouter une base'}
              </p>
            </button>
            <button
              onClick={goToChannelsStep}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                readiness?.checklist.hasChannel
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <p className="text-sm font-medium text-white">2. Connect Channel</p>
              <p className="mt-1 text-xs text-white/60">
                {readiness?.checklist.hasChannel ? 'OK' : 'Créer un canal widget'}
              </p>
            </button>
            <button
              onClick={handlePublish}
              disabled={actionLoading !== null || Boolean(readiness && !readiness.ready)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                readiness?.ready
                  ? 'border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20'
                  : 'border-white/[0.08] bg-white/[0.03] opacity-80'
              }`}
            >
              <p className="text-sm font-medium text-white">3. Publish</p>
              <p className="mt-1 text-xs text-white/60">
                {readiness?.ready ? 'Publier maintenant' : 'Bloqué tant que les étapes 1-2 ne sont pas complètes'}
              </p>
            </button>
          </div>

          {readiness && !readiness.ready && readiness.missing.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <p className="mb-2 flex items-center gap-2 text-sm text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                Points à corriger avant publication
              </p>
              <ul className="space-y-1 text-xs text-amber-200/90">
                {readiness.missing.map((item) => (
                  <li key={item}>• {readinessLabelMap[item] ?? item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-900 border border-white/[0.06] p-1 rounded-xl">
          <TabsTrigger value="config" className="data-[state=active]:bg-white/[0.1] data-[state=active]:text-white rounded-lg px-4 py-2">
            <Settings className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="data-[state=active]:bg-white/[0.1] data-[state=active]:text-white rounded-lg px-4 py-2">
            <BookOpen className="mr-2 h-4 w-4" />
            Knowledge
          </TabsTrigger>
          <TabsTrigger value="channels" className="data-[state=active]:bg-white/[0.1] data-[state=active]:text-white rounded-lg px-4 py-2">
            <MessageSquare className="mr-2 h-4 w-4" />
            Canaux
          </TabsTrigger>
          <TabsTrigger value="test" className="data-[state=active]:bg-white/[0.1] data-[state=active]:text-white rounded-lg px-4 py-2">
            <Send className="mr-2 h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-gray-900/50 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Détails de l&apos;agent</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-white/70">Nom</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 bg-white/[0.03] border-white/[0.06] text-white"
                />
              </div>
              <div>
                <Label className="text-white/70">Description</Label>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 bg-white/[0.03] border-white/[0.06] text-white"
                />
              </div>
              <div>
                <Label className="text-white/70">Message d&apos;accueil</Label>
                <Input
                  value={editForm.greeting}
                  onChange={(e) => setEditForm((f) => ({ ...f, greeting: e.target.value }))}
                  className="mt-1 bg-white/[0.03] border-white/[0.06] text-white"
                  placeholder="Bonjour ! Comment puis-je vous aider ?"
                />
              </div>
              <div className="pt-2">
                <p className="text-xs text-white/40">Modèle: {agent.model} · Température: {agent.temperature}</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-gray-900/50 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Bases de connaissances attachées</h3>
            {attachedKBs.length === 0 ? (
              <p className="text-sm text-white/50">Aucune base attachée. Utilisez l&apos;API pour associer des bases.</p>
            ) : (
              <ul className="space-y-2">
                {attachedKBs.map((akb) => (
                  <li
                    key={akb.knowledgeBase.id}
                    className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.04] px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">{akb.knowledgeBase.name}</p>
                      <p className="text-xs text-white/40">{akb.knowledgeBase.documentsCount} documents · {akb.knowledgeBase.status}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDetachKB(akb.knowledgeBase.id)}
                      disabled={kbLoading === akb.knowledgeBase.id}
                    >
                      {kbLoading === akb.knowledgeBase.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-sm text-white/50 mb-2">Bases disponibles</p>
              {knowledgeBases.length === 0 ? (
                <p className="text-xs text-white/40">Aucune base créée. Créez-en une dans la section Knowledge.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {knowledgeBases.filter((kb) => !attachedKBs.some((a) => a.knowledgeBase.id === kb.id)).map((kb) => (
                    <Button
                      key={kb.id}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => handleAttachKB(kb.id)}
                      disabled={kbLoading === kb.id}
                    >
                      {kbLoading === kb.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="mr-1 h-3 w-3" />
                      )}
                      Attacher
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-gray-900/50 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Canaux configurés</h3>
            {agent.channels.length === 0 ? (
              <p className="text-sm text-white/50">Aucun canal. Créez un canal widget pour déployer l&apos;agent.</p>
            ) : (
              <ul className="space-y-2">
                {agent.channels.map((ch) => (
                  <li
                    key={ch.id}
                    className="flex flex-col gap-3 rounded-lg bg-white/[0.03] border border-white/[0.04] px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{ch.type}</p>
                        <p className="text-xs text-white/40">ID: {ch.widgetId ?? ch.id} · {ch.status}</p>
                      </div>
                    </div>
                    {ch.type === 'WIDGET' && ch.widgetId && (
                      <div className="rounded-lg bg-black/30 p-3 font-mono text-xs text-white/80">
                        <p className="mb-2 text-white/50">Code d&apos;intégration :</p>
                        <code className="block break-all">
                          {`<script src="https://luneo.app/widget.js" data-widget="${ch.widgetId}" async></script>`}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 border-white/20 text-white hover:bg-white/10"
                          onClick={() => handleCopyEmbed(ch.widgetId!)}
                        >
                          {copiedWidgetId === ch.widgetId ? (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              Copié
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1 h-3 w-3" />
                              Copier
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Button
              className="mt-4 bg-purple-600 hover:bg-purple-500 text-white"
              onClick={handleCreateWidgetChannel}
              disabled={channelLoading || agent.channels.some((ch) => ch.type === 'WIDGET')}
            >
              {channelLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Créer un canal widget
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-gray-900/50 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Sandbox de test</h3>
            <p className="mb-4 text-sm text-white/50">Envoyez un message pour tester les réponses de l&apos;agent.</p>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTest()}
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-white/[0.03] border-white/[0.06] text-white"
                />
                <Button
                  onClick={handleTest}
                  disabled={testLoading || !testMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              {testResponse && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4 space-y-3">
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{testResponse.response}</p>
                  {testResponse.sources && testResponse.sources.length > 0 && (
                    <div className="pt-2 border-t border-white/[0.04]">
                      <p className="text-xs font-medium text-white/50 mb-2">Sources</p>
                      <ul className="space-y-1">
                        {testResponse.sources.map((s, i) => (
                          <li key={i} className="text-xs text-white/60">
                            {s.title}{s.preview ? ` — ${s.preview}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
