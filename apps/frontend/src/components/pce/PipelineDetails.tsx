'use client';

import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle, Circle, XCircle, AlertTriangle, Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePipeline, useRetryPipeline, useAdvancePipeline } from '@/hooks/usePCE';

interface PipelineDetailsProps {
  pipelineId: string;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="h-5 w-5 text-green-500" />,
  current: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
  pending: <Circle className="h-5 w-5 text-gray-300" />,
  failed: <XCircle className="h-5 w-5 text-red-500" />,
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Terminé', current: 'En cours', pending: 'En attente', failed: 'Échoué',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}min`;
  return `${Math.round(ms / 3_600_000)}h`;
}

export function PipelineDetails({ pipelineId }: PipelineDetailsProps) {
  const { data: pipeline, isLoading } = usePipeline(pipelineId);
  const retryPipeline = useRetryPipeline();
  const advancePipeline = useAdvancePipeline();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pipeline) {
    return <div className="text-center py-8 text-muted-foreground">Pipeline non trouvé</div>;
  }

  const p = pipeline as Record<string, unknown>;
  const stages = (p.stages as Array<Record<string, unknown>>) || [];
  const errors = (p.errors as Array<Record<string, unknown>>) || [];
  const currentStage = p.currentStage as string;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Commande</p>
          <p className="font-medium">{p.orderId as string}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Progression</p>
          <p className="font-medium">{p.progress as number}%</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Créé</p>
          <p className="font-medium">
            {format(new Date(p.createdAt as string), 'PPp', { locale: fr })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
          <p className="font-medium">
            {formatDistanceToNow(new Date(p.updatedAt as string), { addSuffix: true, locale: fr })}
          </p>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-medium mb-4">Étapes du pipeline</h4>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const status = stage.status as string;
            return (
              <div key={stage.id as string} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  {STAGE_ICONS[status] ?? STAGE_ICONS.pending}
                  {index < stages.length - 1 && (
                    <div className={`w-0.5 h-8 mt-2 ${status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{String(stage.name)}</p>
                      {stage.startedAt ? (
                        <p className="text-sm text-muted-foreground">
                          {status === 'completed' && stage.duration
                            ? `Complété en ${formatDuration(stage.duration as number)}`
                            : format(new Date(stage.startedAt as string), 'PPp', { locale: fr })}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant={
                      status === 'completed' ? 'default'
                        : status === 'current' ? 'secondary'
                          : status === 'failed' ? 'destructive'
                            : 'outline'
                    }>
                      {STATUS_LABELS[status] || status}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {errors.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Erreurs ({errors.length})
            </h4>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={(error.id as string) || index} className="bg-red-50 dark:bg-red-950 p-3 rounded text-sm">
                  <p className="font-medium text-red-800 dark:text-red-200">{error.stage as string}</p>
                  <p className="font-mono text-red-700 dark:text-red-300 mt-1">{error.error as string}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />
      <div className="flex justify-end gap-2">
        {currentStage === 'FAILED' && (
          <Button variant="outline" onClick={() => retryPipeline.mutate(pipelineId)} disabled={retryPipeline.isPending}>
            {retryPipeline.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Réessayer
          </Button>
        )}
        {!['COMPLETED', 'FAILED', 'CANCELLED'].includes(currentStage) && (
          <Button onClick={() => advancePipeline.mutate({ pipelineId })} disabled={advancePipeline.isPending}>
            {advancePipeline.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Avancer manuellement
          </Button>
        )}
      </div>
    </div>
  );
}
