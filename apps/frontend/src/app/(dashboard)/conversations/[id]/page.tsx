'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { endpoints } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  MessageSquare,
  User,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  Star,
} from 'lucide-react';
import { MessageCorrection } from '@/components/conversations/MessageCorrection';

interface Message {
  id: string;
  role: string;
  content: string;
  sourcesUsed?: unknown;
  createdAt: string;
}

interface Conversation {
  id: string;
  status: string;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorPhone?: string | null;
  satisfactionRating: number | null;
  channelType: string;
  agent: { id: string; name: string };
  channel?: { id: string; type: string } | null;
  messages: Message[];
  createdAt: string;
  summary?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Actif', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ESCALATED: { label: 'Escaladé', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  RESOLVED: { label: 'Résolu', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  CLOSED: { label: 'Fermé', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
};

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversation = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await endpoints.conversations.get(id);
      const data = (res as { data?: Conversation })?.data ?? (res as Conversation);
      setConversation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger la conversation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSendReply = async () => {
    if (!conversation || !replyText.trim()) return;
    setSending(true);
    try {
      await endpoints.conversations.addMessage(conversation.id, {
        content: replyText.trim(),
        role: 'ASSISTANT',
      });
      setReplyText('');
      await fetchConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const handleEscalate = async () => {
    if (!conversation) return;
    setActionLoading('escalate');
    try {
      await endpoints.conversations.escalate(conversation.id);
      await fetchConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'escalade');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async () => {
    if (!conversation) return;
    setActionLoading('resolve');
    try {
      await endpoints.conversations.resolve(conversation.id);
      await fetchConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la résolution');
    } finally {
      setActionLoading(null);
    }
  };

  const parseSources = (sourcesUsed: unknown): Array<{ title?: string; url?: string; preview?: string }> => {
    if (!sourcesUsed) return [];
    if (Array.isArray(sourcesUsed)) return sourcesUsed as Array<{ title?: string; url?: string; preview?: string }>;
    if (typeof sourcesUsed === 'object' && sourcesUsed !== null && 'sources' in sourcesUsed) {
      const maybeSources = (sourcesUsed as { sources?: Array<{ title?: string; url?: string; preview?: string }> }).sources;
      return maybeSources ?? [];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="space-y-6">
        <Link href="/conversations" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70">
          <ArrowLeft className="h-4 w-4" />
          Retour aux conversations
        </Link>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-red-400">{error ?? 'Conversation introuvable'}</p>
          <Button variant="outline" onClick={() => router.push('/conversations')} className="mt-4 border-white/20 text-white">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[conversation.status] ?? STATUS_CONFIG.ACTIVE;

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[500px] flex-col lg:flex-row gap-6">
      {/* Main: Message thread + input */}
      <div className="flex flex-1 flex-col min-w-0 rounded-2xl border border-white/[0.06] bg-gray-900/50">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 dash-scroll">
          {conversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-12 w-12 text-white/20 mb-3" />
              <p className="text-sm text-white/50">Aucun message dans cette conversation</p>
            </div>
          ) : (
            conversation.messages.map((msg) => {
              const isUser = msg.role === 'USER';
              const isAssistant = msg.role === 'ASSISTANT';
              const sources = parseSources(msg.sourcesUsed);

              const prevMsg = conversation.messages[conversation.messages.indexOf(msg) - 1];

              return (
                <div
                  key={msg.id}
                  className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      isUser
                        ? 'bg-purple-500/20 border border-purple-500/30 text-white'
                        : 'bg-white/[0.06] border border-white/[0.06] text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isUser ? (
                        <User className="h-4 w-4 text-purple-400" />
                      ) : (
                        <Bot className="h-4 w-4 text-cyan-400" />
                      )}
                      <span className="text-xs font-medium text-white/60">
                        {isUser ? 'Visiteur' : conversation.agent.name}
                      </span>
                      <span className="text-xs text-white/40">
                        {new Date(msg.createdAt).toLocaleString('fr-FR')}
                      </span>
                      {isAssistant && (
                        <MessageCorrection
                          agentId={conversation.agent.id}
                          messageId={msg.id}
                          conversationId={conversation.id}
                          originalContent={msg.content}
                          userQuestion={prevMsg?.role === 'USER' ? prevMsg.content : undefined}
                        />
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {isAssistant && sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">Sources</p>
                        <ul className="space-y-0.5">
                          {sources.map((s, i) => (
                            <li key={i} className="text-xs text-white/50">
                              {s.title ?? s.url ?? 'Source'}{s.preview ? ` — ${String(s.preview).slice(0, 80)}...` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {conversation.status === 'ACTIVE' && (
          <div className="border-t border-white/[0.06] p-4">
            <div className="flex gap-2">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                placeholder="Répondre à la conversation..."
                className="flex-1 bg-white/[0.03] border-white/[0.06] text-white"
              />
              <Button
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar: Metadata */}
      <div className="w-full lg:w-80 flex-shrink-0 rounded-2xl border border-white/[0.06] bg-gray-900/50 p-6 space-y-6">
        <div>
          <Link href="/conversations" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <h2 className="text-lg font-semibold text-white">Détails</h2>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Visiteur</p>
            <p className="mt-1 font-medium text-white">
              {conversation.visitorName || conversation.visitorEmail || 'Anonyme'}
            </p>
            {conversation.visitorEmail && (
              <p className="text-sm text-white/50">{conversation.visitorEmail}</p>
            )}
            {conversation.visitorPhone && (
              <p className="text-sm text-white/50">{conversation.visitorPhone}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Agent</p>
            <p className="mt-1 text-white">{conversation.agent.name}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Canal</p>
            <p className="mt-1 text-white">{conversation.channelType}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Statut</p>
            <span className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>

          {conversation.satisfactionRating != null && (
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Satisfaction</p>
              <p className="mt-1 flex items-center gap-1 text-white">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                {conversation.satisfactionRating}/5
              </p>
            </div>
          )}

          {conversation.summary && (
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Résumé</p>
              <p className="mt-1 text-sm text-white/70 line-clamp-3">{conversation.summary}</p>
            </div>
          )}

          <p className="text-xs text-white/30">
            Créé le {new Date(conversation.createdAt).toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Actions */}
        {conversation.status === 'ACTIVE' && (
          <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.06]">
            <Button
              onClick={handleEscalate}
              disabled={!!actionLoading}
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              {actionLoading === 'escalate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              Escalader
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!!actionLoading}
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              {actionLoading === 'resolve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Résoudre
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
