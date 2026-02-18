'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PresetsManager } from '@/components/Customizer/admin/PresetsManager';
import { api } from '@/lib/trpc/client';

function PresetsManagerContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: customizer, isLoading, error } = api.visualCustomizer.customizer.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const config = (customizer as { config?: unknown })?.config as
    | {
        presets?: Array<{
          id: string;
          name: string;
          thumbnail?: string;
          isPublic?: boolean;
          category?: string;
        }>;
      }
    | undefined;

  const presets = config?.presets ?? [];

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
        <h1 className="mt-4 text-2xl font-bold">Presets Management</h1>
        <p className="text-muted-foreground">Create and manage design presets for your customizer</p>
      </div>

      <PresetsManager
        customizerId={id}
        presets={presets.map((p) => ({
          id: p.id,
          name: p.name,
          thumbnail: p.thumbnail,
          data: {},
        }))}
        onPresetUpdate={() => {
          // Refetch customizer data
          window.location.reload();
        }}
      />
    </div>
  );
}

export default function PresetsManagerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ErrorBoundary level="page" componentName="PresetsManagerPage">
      <PresetsManagerContent params={params} />
    </ErrorBoundary>
  );
}
