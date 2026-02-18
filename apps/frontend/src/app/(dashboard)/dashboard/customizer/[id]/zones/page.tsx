'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ZonesEditor } from '@/components/Customizer/admin/ZonesEditor';
import { api } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';

function ZonesEditorContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();

  const { data: customizer, isLoading, error } = api.visualCustomizer.customizer.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const config = (customizer as { config?: unknown })?.config as
    | {
        canvasWidth?: number;
        canvasHeight?: number;
        zones?: Array<{ id: string; name: string; x: number; y: number; width: number; height: number; type: string }>;
      }
    | undefined;

  const zones = config?.zones ?? [];
  const canvasWidth = config?.canvasWidth ?? 800;
  const canvasHeight = config?.canvasHeight ?? 600;

  const createZoneMutation = api.visualCustomizer.zones.create.useMutation();
  const updateZoneMutation = api.visualCustomizer.zones.update.useMutation();
  const deleteZoneMutation = api.visualCustomizer.zones.delete.useMutation();

  const handleZoneAdd = async (zone: { name: string; x: number; y: number; width: number; height: number; type: string }) => {
    try {
      await createZoneMutation.mutateAsync({
        customizerId: id,
        name: zone.name,
        type: zone.type,
        position: { x: zone.x, y: zone.y, width: zone.width, height: zone.height },
      });
      toast({ title: 'Zone added successfully' });
    } catch {
      toast({
        title: 'Failed to add zone',
        variant: 'destructive',
      });
    }
  };

  const handleZoneUpdate = async (zoneId: string, updates: Partial<typeof zones[0]>) => {
    try {
      await updateZoneMutation.mutateAsync({
        customizerId: id,
        id: zoneId,
        ...updates,
      });
      toast({ title: 'Zone updated successfully' });
    } catch {
      toast({
        title: 'Failed to update zone',
        variant: 'destructive',
      });
    }
  };

  const handleZoneDelete = async (zoneId: string) => {
    try {
      await deleteZoneMutation.mutateAsync({
        customizerId: id,
        id: zoneId,
      });
      toast({ title: 'Zone deleted successfully' });
    } catch {
      toast({
        title: 'Failed to delete zone',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !customizer) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load customizer.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/customizer/${id}`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Customizer
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-bold">Zones Editor</h1>
        <p className="text-muted-foreground">Define editable zones for your customizer</p>
      </div>

      <ZonesEditor
        zones={zones.map((z) => ({
          id: z.id,
          name: z.name,
          x: z.x,
          y: z.y,
          width: z.width,
          height: z.height,
          type: z.type as 'text' | 'image' | 'shape',
        }))}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onZoneAdd={handleZoneAdd}
        onZoneUpdate={handleZoneUpdate}
        onZoneDelete={handleZoneDelete}
      />
    </div>
  );
}

export default function ZonesEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ErrorBoundary level="page" componentName="ZonesEditorPage">
      <ZonesEditorContent params={params} />
    </ErrorBoundary>
  );
}
