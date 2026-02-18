/**
 * Embed Code Page - iframe, JS snippet, React, URL, copy, domain restrictions
 */

'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Copy, Check, ExternalLink } from 'lucide-react';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { Configurator3DConfig } from '@/lib/configurator-3d/types/configurator.types';

export default function EmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['configurator3d', 'config', id],
    queryFn: () => configurator3dEndpoints.configurations.get<Configurator3DConfig>(id),
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
  const embedUrl = `${baseUrl}/c/3d/${id}`;
  const iframeUrl = `${embedUrl}?embed=1`;

  const snippets = {
    iframe: `<iframe src="${iframeUrl}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`,
    js: `const iframe = document.createElement('iframe');
iframe.src = '${iframeUrl}';
iframe.width = '${width}';
iframe.height = '${height}';
iframe.frameBorder = '0';
document.getElementById('configurator-container').appendChild(iframe);`,
    react: `import { Configurator3D } from '@luneo/configurator-3d';

<Configurator3D
  configurationId="${id}"
  width={${width}}
  height={${height}}
/>`,
    url: embedUrl,
  };

  const copyToClipboard = (text: string, tab: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopiedTab(null), 2000);
  };

  if (isLoading || !config) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">Embed</h1>
            <p className="text-muted-foreground">Embed your configurator on any website</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>Preview of embedded configurator</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <iframe
                src={iframeUrl}
                width={Math.min(width, 400)}
                height={Math.min(height, 400)}
                className="w-full"
                title="Configurator preview"
              />
            </div>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <a href={embedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Test embed
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dimensions</CardTitle>
            <CardDescription>Width and height for embed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Width</Label>
              <Input type="number" min={320} max={1920} value={width} onChange={(e) => setWidth(parseInt(e.target.value, 10) || 800)} />
            </div>
            <div className="space-y-2">
              <Label>Height</Label>
              <Input type="number" min={320} max={1080} value={height} onChange={(e) => setHeight(parseInt(e.target.value, 10) || 600)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Embed code</CardTitle>
          <CardDescription>Copy the code for your integration</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="iframe">
            <TabsList>
              <TabsTrigger value="iframe">iframe</TabsTrigger>
              <TabsTrigger value="js">JavaScript</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
              <TabsTrigger value="url">Direct URL</TabsTrigger>
            </TabsList>
            <TabsContent value="iframe" className="mt-4">
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">{snippets.iframe}</pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => copyToClipboard(snippets.iframe, 'iframe')}
                >
                  {copiedTab === 'iframe' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="js" className="mt-4">
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">{snippets.js}</pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => copyToClipboard(snippets.js, 'js')}
                >
                  {copiedTab === 'js' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="react" className="mt-4">
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">{snippets.react}</pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => copyToClipboard(snippets.react, 'react')}
                >
                  {copiedTab === 'react' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="url" className="mt-4">
              <div className="relative flex gap-2">
                <Input readOnly value={snippets.url} className="font-mono" />
                <Button variant="outline" onClick={() => copyToClipboard(snippets.url, 'url')}>
                  {copiedTab === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domain restrictions</CardTitle>
          <CardDescription>Limit where the embed can be used (configure in Settings)</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/configurator-3d/${id}/settings`}>Manage in Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
