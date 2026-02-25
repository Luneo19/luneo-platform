'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Bot, BookOpen, MessageSquare, BarChart3, Globe } from 'lucide-react';

interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  done: boolean;
}

export function OverviewChecklist({
  agentCount = 0,
  hasKnowledgeBase = false,
  hasConversation = false,
  hasChannel = false,
  hasAnalytics = false,
}: {
  agentCount?: number;
  hasKnowledgeBase?: boolean;
  hasConversation?: boolean;
  hasChannel?: boolean;
  hasAnalytics?: boolean;
}) {
  const steps: ChecklistStep[] = [
    {
      id: 'agent',
      label: 'Créez votre premier agent IA',
      description: 'Configurez un agent pour répondre à vos visiteurs',
      href: '/agents/new',
      icon: Bot,
      done: agentCount > 0,
    },
    {
      id: 'knowledge',
      label: 'Ajoutez une base de connaissances',
      description: 'Importez vos FAQ, docs ou site web',
      href: '/knowledge',
      icon: BookOpen,
      done: hasKnowledgeBase,
    },
    {
      id: 'channel',
      label: 'Installez le widget sur votre site',
      description: 'Copiez le script ou utilisez un SDK',
      href: '/agents',
      icon: Globe,
      done: hasChannel,
    },
    {
      id: 'conversation',
      label: 'Première conversation',
      description: 'Un visiteur interagit avec votre agent',
      href: '/conversations',
      icon: MessageSquare,
      done: hasConversation,
    },
    {
      id: 'analytics',
      label: 'Consultez vos analytics',
      description: 'Suivez les performances et l\'impact business',
      href: '/analytics',
      icon: BarChart3,
      done: hasAnalytics,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  if (allDone) return null;

  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="dash-card rounded-2xl p-5 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Démarrage rapide</h2>
          <p className="text-sm text-white/40 mt-0.5">Votre agent IA opérationnel en 5 étapes</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/60">{completedCount}/{steps.length}</span>
          <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isNext = !step.done && (i === 0 || steps[i - 1].done);

          return (
            <Link key={step.id} href={step.href}>
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
                step.done
                  ? 'bg-green-500/5 border border-green-500/10'
                  : isNext
                    ? 'bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10'
                    : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] opacity-60'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  step.done
                    ? 'bg-green-500/20'
                    : isNext
                      ? 'bg-purple-500/20'
                      : 'bg-white/[0.06]'
                }`}>
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isNext ? 'text-purple-400' : 'text-white/40'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.done ? 'text-green-400 line-through' : 'text-white'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-white/40">{step.description}</p>
                </div>
                {!step.done && isNext && (
                  <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
