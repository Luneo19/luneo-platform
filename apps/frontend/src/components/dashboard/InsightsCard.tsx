'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface Insight {
  emoji: string;
  title: string;
  description: string;
  action?: { label: string; url: string };
}

export function InsightsCard() {
  const router = useRouter();

  const { data: insights, isLoading } = useQuery<Insight[]>({
    queryKey: ['insights'],
    queryFn: async () => {
      const res = await api.get('/api/v1/agent-analytics/insights');
      return res.data;
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">Insights IA</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      ) : insights && insights.length > 0 ? (
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xl">{insight.emoji}</span>
                <h4 className="font-medium text-white">{insight.title}</h4>
              </div>
              <p className="text-sm text-gray-400">{insight.description}</p>
              {insight.action && (
                <button
                  onClick={() => router.push(insight.action!.url)}
                  className="mt-2 flex items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  {insight.action.label}
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-gray-500">
          Les insights seront disponibles après vos premières conversations.
        </p>
      )}
    </div>
  );
}
