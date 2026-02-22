/**
 * Options Editor Page - List all options across components
 */

'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Configurator3DConfig, Configurator3DComponent, Configurator3DOption } from '@/lib/configurator-3d/types/configurator.types';

export default function OptionsEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: config, isLoading } = useQuery({
    queryKey: ['configurator3d', 'config', id],
    queryFn: () => configurator3dEndpoints.configurations.get<Configurator3DConfig>(id),
  });

  const components = config?.components ?? [];

  if (isLoading || !config) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allOptions: { component: Configurator3DComponent; option: Configurator3DOption }[] = [];
  components.forEach((c) => {
    c.options?.forEach((o) => allOptions.push({ component: c, option: o }));
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/configurator-3d/${id}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Options</h1>
            <p className="text-muted-foreground">All options across components</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/configurator-3d/${id}/components`}>Edit in Components</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Options List</CardTitle>
          <CardDescription>Manage options in the Components editor</CardDescription>
        </CardHeader>
        <CardContent>
          {allOptions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <p>No options yet. Add components and options in the Components editor.</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`/dashboard/configurator-3d/${id}/components`}>Go to Components</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Option</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Price delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allOptions.map(({ component, option }) => (
                  <TableRow key={option.id}>
                    <TableCell>{component.name}</TableCell>
                    <TableCell>{option.name}</TableCell>
                    <TableCell>{option.type}</TableCell>
                    <TableCell>{option.isDefault ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{option.pricing?.priceDelta ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
