'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreHorizontal, ChevronRight, RotateCcw, XCircle, Eye,
} from 'lucide-react';

import {
  usePipelines, useAdvancePipeline, useRetryPipeline, useCancelPipeline,
} from '@/hooks/usePCE';
import { PipelineDetails } from './PipelineDetails';

const STAGE_LABELS: Record<string, string> = {
  VALIDATION: 'Validation', RENDER: 'Rendu', PRODUCTION: 'Production',
  QUALITY_CHECK: 'Contrôle qualité', FULFILLMENT: 'Préparation',
  SHIPPING: 'Expédition', DELIVERY: 'Livraison',
  COMPLETED: 'Terminé', FAILED: 'Échoué', CANCELLED: 'Annulé',
};

const STATUS_COLORS: Record<string, string> = {
  VALIDATION: 'bg-blue-500', RENDER: 'bg-purple-500', PRODUCTION: 'bg-orange-500',
  QUALITY_CHECK: 'bg-yellow-500', FULFILLMENT: 'bg-cyan-500',
  SHIPPING: 'bg-indigo-500', DELIVERY: 'bg-teal-500',
  COMPLETED: 'bg-green-500', FAILED: 'bg-red-500', CANCELLED: 'bg-gray-500',
};

export function PipelinesList() {
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = usePipelines({
    status: statusFilter || undefined,
    limit: 50,
  });

  const advancePipeline = useAdvancePipeline();
  const retryPipeline = useRetryPipeline();
  const cancelPipeline = useCancelPipeline();

  const pipelines: Array<Record<string, unknown>> = Array.isArray(data) ? data : (data as Record<string, unknown>)?.pipelines as Array<Record<string, unknown>> ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        {[
          { value: '', label: 'Tous' },
          { value: 'IN_PROGRESS', label: 'En cours' },
          { value: 'COMPLETED', label: 'Terminés' },
          { value: 'FAILED', label: 'Échoués' },
        ].map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Commande</TableHead>
            <TableHead>Étape actuelle</TableHead>
            <TableHead>Progression</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Mis à jour</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pipelines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <p className="text-muted-foreground">Aucun pipeline trouvé</p>
              </TableCell>
            </TableRow>
          ) : (
            pipelines.map((pipeline) => {
              const order = pipeline.order as Record<string, unknown> | undefined;
              const stage = pipeline.currentStage as string;
              const progress = pipeline.progress as number;

              return (
                <TableRow key={pipeline.id as string}>
                  <TableCell className="font-medium">
                    #{(order?.orderNumber as string) || (pipeline.orderId as string).slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${STATUS_COLORS[stage] ?? 'bg-gray-500'} text-white border-0`}>
                      {STAGE_LABELS[stage] || stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="w-24" />
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{(order?.customerEmail as string) || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(pipeline.updatedAt as string), { addSuffix: true, locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedPipeline(pipeline.id as string)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir les détails
                        </DropdownMenuItem>
                        {!['COMPLETED', 'FAILED', 'CANCELLED'].includes(stage) && (
                          <DropdownMenuItem onClick={() => advancePipeline.mutate({ pipelineId: pipeline.id as string })}>
                            <ChevronRight className="mr-2 h-4 w-4" />
                            Avancer l&apos;étape
                          </DropdownMenuItem>
                        )}
                        {stage === 'FAILED' && (
                          <DropdownMenuItem onClick={() => retryPipeline.mutate(pipeline.id as string)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Réessayer
                          </DropdownMenuItem>
                        )}
                        {!['COMPLETED', 'CANCELLED'].includes(stage) && (
                          <DropdownMenuItem
                            onClick={() => cancelPipeline.mutate({ pipelineId: pipeline.id as string, reason: 'Annulé manuellement' })}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Annuler
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Dialog open={!!selectedPipeline} onOpenChange={() => setSelectedPipeline(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails du pipeline</DialogTitle>
            <DialogDescription>Suivi détaillé des étapes de traitement</DialogDescription>
          </DialogHeader>
          {selectedPipeline && <PipelineDetails pipelineId={selectedPipeline} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
