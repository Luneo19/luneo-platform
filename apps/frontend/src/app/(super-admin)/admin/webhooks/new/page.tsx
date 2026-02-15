/**
 * Create Webhook - Super Admin
 * Form for creating a new webhook subscription.
 * Backend: POST /api/v1/public-api/webhooks
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Webhook, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';

export default function NewWebhookPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Webhook URL is required',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await endpoints.webhooks.create({
        name: name.trim() || `Webhook ${new Date().toLocaleDateString()}`,
        url: url.trim(),
        events: ['*'], // Subscribe to all events by default
        isActive: true,
      });

      toast({
        title: 'Success',
        description: 'Webhook created successfully',
      });

      router.push('/admin/webhooks');
    } catch (error) {
      logger.error('Failed to create webhook', error instanceof Error ? error : new Error(String(error)));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorDisplayMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/webhooks">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create Webhook</h1>
          <p className="text-zinc-400 mt-1">
            Configure a new webhook endpoint (form placeholder)
          </p>
        </div>
      </div>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Webhook details
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Configure a new webhook endpoint to receive real-time events from Luneo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">
                Webhook Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Production Events"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url" className="text-zinc-300">
                Endpoint URL *
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://your-server.com/webhooks/luneo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">
                Description (optional)
              </Label>
              <Input
                id="description"
                type="text"
                placeholder="e.g. Production events"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting || !url.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create webhook'
                )}
              </Button>
              <Link href="/admin/webhooks">
                <Button type="button" variant="outline" className="border-zinc-600 text-zinc-400" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
