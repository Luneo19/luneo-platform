'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2, Save, Trash2, Archive } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/trpc/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function SettingsContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const { data: customizer, isLoading, error } = api.visualCustomizer.customizer.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const updateMutation = api.visualCustomizer.customizer.update.useMutation();
  const deleteMutation = api.visualCustomizer.customizer.delete.useMutation();

  const handleSave = async () => {
    // Settings form submission would go here
    toast({ title: 'Settings saved successfully' });
  };

  const handleArchive = async () => {
    try {
      await updateMutation.mutateAsync({
        id,
        status: 'ARCHIVED',
      });
      toast({ title: 'Customizer archived successfully' });
      router.push('/dashboard/customizer');
    } catch {
      toast({
        title: 'Failed to archive customizer',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: 'Customizer deleted successfully' });
      router.push('/dashboard/customizer');
    } catch {
      toast({
        title: 'Failed to delete customizer',
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

  const config = (customizer as { config?: unknown })?.config as
    | {
        pricing?: {
          basePrice?: number;
          currency?: string;
        };
        moderation?: {
          enableModeration?: boolean;
          blockProfanity?: boolean;
          requireApproval?: boolean;
        };
      }
    | undefined;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/customizer/${id}`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Customizer
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure customizer options and preferences</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic customizer configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              defaultValue={(customizer as { name?: string }).name ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              defaultValue={(customizer as { description?: string }).description ?? ''}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Configure pricing for this customizer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price</Label>
            <Input
              id="basePrice"
              type="number"
              defaultValue={config?.pricing?.basePrice ?? 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              defaultValue={config?.pricing?.currency ?? 'EUR'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Moderation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation</CardTitle>
          <CardDescription>Control content moderation settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Moderation</Label>
              <p className="text-sm text-muted-foreground">
                Review designs before they are published
              </p>
            </div>
            <Switch defaultChecked={config?.moderation?.enableModeration ?? false} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Block Profanity</Label>
              <p className="text-sm text-muted-foreground">
                Automatically filter inappropriate content
              </p>
            </div>
            <Switch defaultChecked={config?.moderation?.blockProfanity ?? false} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Approval</Label>
              <p className="text-sm text-muted-foreground">
                All designs must be manually approved
              </p>
            </div>
            <Switch defaultChecked={config?.moderation?.requireApproval ?? false} />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Archive Customizer</h4>
              <p className="text-sm text-muted-foreground">
                Archive this customizer. It will no longer be accessible to users.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive Customizer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to archive this customizer? It will no longer be accessible to users.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-destructive">Delete Customizer</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this customizer and all associated data. This action cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Customizer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this customizer? This action cannot be undone and will permanently delete all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ErrorBoundary level="page" componentName="SettingsPage">
      <SettingsContent params={params} />
    </ErrorBoundary>
  );
}
