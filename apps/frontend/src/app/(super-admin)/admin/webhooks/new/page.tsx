/**
 * Create Webhook - Super Admin
 * Form placeholder for creating a new webhook (backend endpoint not yet implemented).
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Webhook } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NewWebhookPage() {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: backend endpoint not implemented yet
    alert('Webhook creation is not available yet. Backend endpoint will be added later.');
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
            URL and optional description. Backend API for creating webhooks is not yet available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-zinc-300">
                Endpoint URL
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://your-server.com/webhooks/luneo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
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
              <Button type="submit" disabled>
                Create webhook (coming soon)
              </Button>
              <Link href="/admin/webhooks">
                <Button type="button" variant="outline" className="border-zinc-600 text-zinc-400">
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
