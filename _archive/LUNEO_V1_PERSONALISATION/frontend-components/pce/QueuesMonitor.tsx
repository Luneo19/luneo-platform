'use client';

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Play, Pause, RotateCcw, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { useQueues, usePauseQueue, useResumeQueue, useRetryFailedJobs } from '@/hooks/usePCE';

interface QueuesMonitorProps {
  queues: Record<string, unknown>;
}

const QUEUE_LABELS: Record<string, string> = {
  'pce:pipeline': 'Pipeline',
  'pce:fulfillment': 'Fulfillment',
};

const QUEUE_DESCRIPTIONS: Record<string, string> = {
  'pce:pipeline': 'Orchestration des pipelines de commandes',
  'pce:fulfillment': 'Préparation et expédition',
};

export function QueuesMonitor({ queues: initialQueues }: QueuesMonitorProps) {
  const { data: liveQueues } = useQueues();
  const pauseQueue = usePauseQueue();
  const resumeQueue = useResumeQueue();
  const retryFailed = useRetryFailedJobs();

  const queues = (liveQueues ?? initialQueues ?? {}) as Record<string, Record<string, unknown>>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(queues).map(([name, stats]) => (
        <QueueCard
          key={name}
          name={name}
          stats={stats}
          onPause={() => pauseQueue.mutate(name)}
          onResume={() => resumeQueue.mutate(name)}
          onRetryFailed={() => retryFailed.mutate({ queueName: name })}
          isLoading={pauseQueue.isPending || resumeQueue.isPending || retryFailed.isPending}
        />
      ))}
    </div>
  );
}

function QueueCard({
  name, stats, onPause, onResume, onRetryFailed, isLoading,
}: {
  name: string;
  stats: Record<string, unknown>;
  onPause: () => void;
  onResume: () => void;
  onRetryFailed: () => void;
  isLoading: boolean;
}) {
  const waiting = (stats?.waiting as number) ?? 0;
  const active = (stats?.active as number) ?? 0;
  const failed = (stats?.failed as number) ?? 0;
  const completed = (stats?.completed as number) ?? 0;
  const delayed = (stats?.delayed as number) ?? 0;
  const isPaused = !!stats?.paused;

  const totalPending = waiting + active + delayed;
  const hasFailures = failed > 0;

  let health: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (failed > 100) health = 'critical';
  else if (hasFailures || waiting > 1000) health = 'warning';

  const healthIcon = health === 'healthy'
    ? <CheckCircle className="h-4 w-4 text-green-500" />
    : <AlertTriangle className={`h-4 w-4 ${health === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />;

  return (
    <Card className={isPaused ? 'opacity-60' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{QUEUE_LABELS[name] || name}</CardTitle>
            {healthIcon}
          </div>
          {isPaused && <Badge variant="secondary">En pause</Badge>}
        </div>
        <CardDescription className="text-xs">{QUEUE_DESCRIPTIONS[name] || ''}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatBox label="En attente" value={waiting} color="text-blue-600" />
          <StatBox label="Actifs" value={active} color="text-green-600" />
          <StatBox label="Échoués" value={failed} color="text-red-600" highlight={hasFailures} />
        </div>

        {totalPending > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Jobs en cours</span>
              <span>{active} / {totalPending}</span>
            </div>
            <Progress value={totalPending > 0 ? (active / totalPending) * 100 : 0} />
          </div>
        )}

        <div className="flex gap-2">
          {isPaused ? (
            <Button size="sm" variant="outline" onClick={onResume} disabled={isLoading}>
              <Play className="h-3 w-3 mr-1" /> Reprendre
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onPause} disabled={isLoading}>
              <Pause className="h-3 w-3 mr-1" /> Pause
            </Button>
          )}

          {hasFailures && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-red-600">
                  <RotateCcw className="h-3 w-3 mr-1" /> Réessayer ({failed})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Réessayer les jobs échoués ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {failed} jobs seront remis en file d&apos;attente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={onRetryFailed}>Réessayer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="mt-3 pt-3 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Complétés (total)</span>
            <span>{completed.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value, color, highlight = false }: {
  label: string; value: number; color: string; highlight?: boolean;
}) {
  return (
    <div className={`text-center p-2 rounded ${highlight ? 'bg-red-50 dark:bg-red-950' : 'bg-gray-50 dark:bg-gray-900'}`}>
      <p className={`text-lg font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
