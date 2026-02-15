'use client';

import React, { useState, memo, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  ArrowLeft,
  Sparkles,
  Bot,
  Brain,
  MessageSquare,
  Send,
  Zap,
  Shield,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const agents = [
  {
    name: 'Luna',
    role: 'Business Intelligence',
    description: 'Analyse de donnees, rapports automatises, insights strategiques pour le B2B',
    icon: BarChart3,
    color: 'purple',
    greeting: 'Bonjour ! Je suis Luna, votre analyste BI. Posez-moi une question sur vos donnees.',
    examples: [
      'Quel est mon meilleur segment client ?',
      'Previsions de revenu pour Q2',
      'Analyse de la retention mensuelle',
    ],
  },
  {
    name: 'Aria',
    role: 'Creative Assistant',
    description: 'Generation de contenus, suggestions de design, optimisation creative pour le B2C',
    icon: Sparkles,
    color: 'pink',
    greeting: 'Hey ! Je suis Aria, votre assistante creative. Comment puis-je vous inspirer ?',
    examples: [
      'Suggere un design pour un t-shirt ete',
      'Optimise ma description produit',
      'Idees de collection automne',
    ],
  },
  {
    name: 'Nova',
    role: 'Support Intelligent',
    description: 'Support client automatise, resolution de problemes, FAQ dynamique avec RAG',
    icon: Shield,
    color: 'cyan',
    greeting: 'Salut ! Je suis Nova, votre support IA. Comment puis-je vous aider ?',
    examples: [
      'Comment configurer mon webhook ?',
      'Ma commande est en retard',
      'Comment exporter en haute resolution ?',
    ],
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  purple: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    gradient: 'from-purple-600 to-violet-600',
  },
  pink: {
    bg: 'bg-pink-500/20',
    border: 'border-pink-500/50',
    text: 'text-pink-400',
    gradient: 'from-pink-600 to-rose-600',
  },
  cyan: {
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/50',
    text: 'text-cyan-400',
    gradient: 'from-cyan-600 to-blue-600',
  },
};

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
}

function AIAgentsDemoPageContent() {
  const [selectedAgent, setSelectedAgent] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'agent', text: agents[0].greeting },
  ]);
  const [input, setInput] = useState('');

  const selectAgent = useCallback(
    (idx: number) => {
      setSelectedAgent(idx);
      setMessages([{ role: 'agent', text: agents[idx].greeting }]);
      setInput('');
    },
    [],
  );

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userMsg },
      {
        role: 'agent',
        text: `Merci pour votre message ! Je suis ${agents[selectedAgent].name}, votre assistante IA. J'analyse votre demande et je prepare une reponse personnalisee basee sur vos donnees. Activez votre compte pour debloquer les reponses IA en temps reel.`,
      },
    ]);
  }, [input, selectedAgent]);

  const agent = agents[selectedAgent];
  const colors = colorMap[agent.color];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demo">
            <Button variant="outline" className={`${colors.border} hover:bg-gray-800 mb-6`}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Retour
            </Button>
          </Link>

          <motion initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                <Bot className={`w-6 h-6 ${colors.text}`} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2">
                  AI Agents
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/50">
                    Demo
                  </span>
                </h1>
                <p className="text-gray-400">3 agents IA specialises - Luna, Aria, Nova</p>
              </div>
            </div>
          </motion>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Agent Selector */}
          <div className="lg:col-span-1 space-y-3">
            {agents.map((a, i) => {
              const c = colorMap[a.color];
              return (
                <button
                  key={a.name}
                  onClick={() => selectAgent(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedAgent === i
                      ? `${c.bg} ${c.border} border-2`
                      : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <a.icon className={`w-5 h-5 ${c.text}`} />
                    <span className="font-bold text-white">{a.name}</span>
                  </div>
                  <p className={`text-xs font-medium ${c.text} mb-1`}>{a.role}</p>
                  <p className="text-xs text-gray-400">{a.description}</p>
                </button>
              );
            })}
          </div>

          {/* Chat Interface */}
          <Card className="lg:col-span-3 bg-gray-900/50 border-gray-700 flex flex-col" style={{ minHeight: 500 }}>
            {/* Chat Header */}
            <div className={`p-4 border-b border-gray-700 flex items-center gap-3`}>
              <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center`}>
                <agent.icon className={`w-4 h-4 ${colors.text}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{agent.name}</p>
                <p className="text-xs text-gray-400">{agent.role}</p>
              </div>
              <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                En ligne
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-gray-700 text-white rounded-br-md'
                        : `${colors.bg} ${colors.text} rounded-bl-md`
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {agent.examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setInput(ex);
                  }}
                  className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={`Parler a ${agent.name}...`}
                className="flex-1 bg-gray-800 border-gray-700 text-white"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim()}
                className={`bg-gradient-to-r ${colors.gradient}`}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-900/50 border border-purple-500/20 rounded-lg">
            <Brain className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">RAG + Memory</h3>
            <p className="text-sm text-gray-400">
              Chaque agent dispose d&apos;une memoire contextuelle et accede a votre base de connaissances
            </p>
          </div>
          <div className="p-6 bg-gray-900/50 border border-pink-500/20 rounded-lg">
            <Zap className="w-10 h-10 text-pink-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">GPT-4 + Claude</h3>
            <p className="text-sm text-gray-400">
              Modeles IA de pointe pour des reponses precises et creatives
            </p>
          </div>
          <div className="p-6 bg-gray-900/50 border border-cyan-500/20 rounded-lg">
            <MessageSquare className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Multi-canal</h3>
            <p className="text-sm text-gray-400">
              Chat, email, in-app : vos agents sont disponibles partout
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Activez vos agents IA avec un compte Luneo</p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
            >
              Commencer Gratuitement
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const MemoizedContent = memo(AIAgentsDemoPageContent);

export default function AIAgentsDemoPage() {
  return (
    <ErrorBoundary level="page" componentName="AIAgentsDemoPage">
      <MemoizedContent />
    </ErrorBoundary>
  );
}
