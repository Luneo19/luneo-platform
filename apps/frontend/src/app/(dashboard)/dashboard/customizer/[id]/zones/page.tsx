'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';

const AdminZoneStudio = dynamic(
  () => import('@/components/Customizer/admin/AdminZoneStudio').then(m => m.AdminZoneStudio),
  { ssr: false, loading: () => <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div> }
);

function ZonesEditorContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();

  const { data: customizer, isLoading, error } = api.visualCustomizer.customizer.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const raw = customizer as Record<string, unknown> | undefined;
  const config = (raw?.config ?? raw) as Record<string, unknown> | undefined;
  const zones = ((config?.zones ?? []) as Array<Record<string, unknown>>).map(z => ({
    id: String(z.id ?? ''),
    name: String(z.name ?? ''),
    type: String(z.type ?? 'text'),
    shape: z.shape ? String(z.shape) : undefined,
    x: Number(z.x ?? 0),
    y: Number(z.y ?? 0),
    width: Number(z.width ?? 100),
    height: Number(z.height ?? 100),
    rotation: z.rotation ? Number(z.rotation) : undefined,
    isVisible: z.isVisible !== false,
    isLocked: z.isLocked === true,
    allowText: z.allowText !== false,
    allowImages: z.allowImages !== false,
    allowShapes: z.allowShapes === true,
    allowClipart: z.allowClipart === true,
    maxElements: z.maxElements ? Number(z.maxElements) : undefined,
    priceModifier: z.priceModifier ? Number(z.priceModifier) : undefined,
    sortOrder: z.sortOrder ? Number(z.sortOrder) : undefined,
  }));
  const views = ((config?.views ?? []) as Array<Record<string, unknown>>).map(v => ({
    id: String(v.id ?? ''),
    name: String(v.name ?? ''),
    imageUrl: String(v.imageUrl ?? ''),
    thumbnailUrl: v.thumbnailUrl ? String(v.thumbnailUrl) : undefined,
    isDefault: v.isDefault === true,
    sortOrder: v.sortOrder ? Number(v.sortOrder) : undefined,
  }));
  const canvasWidth = Number(config?.canvasWidth ?? raw?.canvasWidth ?? 800);
  const canvasHeight = Number(config?.canvasHeight ?? raw?.canvasHeight ?? 600);
  const productImageUrl = (config?.productImageUrl ?? raw?.productImageUrl) as string | undefined;

  const createZoneMutation = api.visualCustomizer.zones.create.useMutation();
  const updateZoneMutation = api.visualCustomizer.zones.update.useMutation();
  const deleteZoneMutation = api.visualCustomizer.zones.delete.useMutation();

  const handleZoneAdd = async (zone: Partial<{ id: string; name: string; x: number; y: number; width: number; height: number; type: string }>) => {
    try {
      await createZoneMutation.mutateAsync({
        customizerId: id,
        name: zone.name ?? 'New Zone',
        type: zone.type ?? 'text',
        position: { x: zone.x ?? 0, y: zone.y ?? 0, width: zone.width ?? 200, height: zone.height ?? 100 },
      });
      toast({ title: 'Zone ajoutee' });
    } catch {
      toast({ title: 'Erreur lors de l\'ajout', variant: 'destructive' });
    }
  };

  const handleZoneUpdate = async (zoneId: string, updates: Record<string, unknown>) => {
    try {
      await updateZoneMutation.mutateAsync({ customizerId: id, id: zoneId, ...updates });
      toast({ title: 'Zone mise a jour' });
    } catch {
      toast({ title: 'Erreur lors de la mise a jour', variant: 'destructive' });
    }
  };

  const handleZoneDelete = async (zoneId: string) => {
    try {
      await deleteZoneMutation.mutateAsync({ customizerId: id, id: zoneId });
      toast({ title: 'Zone supprimee' });
    } catch {
      toast({ title: 'Erreur lors de la suppression', variant: 'destructive' });
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
            <p className="text-destructive">Erreur lors du chargement du customizer.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/[0.06]">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/customizer/${id}`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-bold">Zone Studio</h1>
          <p className="text-xs text-muted-foreground">Definir les zones editables</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AdminZoneStudio
          customizerId={id}
          zones={zones}
          views={views}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          productImageUrl={productImageUrl}
          onZoneAdd={handleZoneAdd}
          onZoneUpdate={handleZoneUpdate}
          onZoneDelete={handleZoneDelete}
        />
      </div>
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
