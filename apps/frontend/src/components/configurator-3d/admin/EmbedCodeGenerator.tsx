'use client';

import React, { useState, useCallback } from 'react';
import { Copy, Check, Code, Frame, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface EmbedCodeGeneratorProps {
  configId: string;
  baseUrl?: string;
  className?: string;
}

export function EmbedCodeGenerator({
  configId,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com',
  className,
}: EmbedCodeGeneratorProps) {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [theme, setTheme] = useState('light');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const embedUrl = `${baseUrl}/configurator-3d/embed/${configId}?width=${width}&height=${height}&theme=${theme}`;

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allowfullscreen
  allow="xr-spatial-tracking"
  title="3D Configurator"
></iframe>`;

  const jsCode = `// Load configurator in a container
const container = document.getElementById('configurator');
const iframe = document.createElement('iframe');
iframe.src = '${embedUrl}';
iframe.width = '${width}';
iframe.height = '${height}';
iframe.frameBorder = '0';
iframe.allowFullscreen = true;
iframe.title = '3D Configurator';
container.appendChild(iframe);

// Listen for messages from configurator
window.addEventListener('message', (event) => {
  if (event.origin !== '${baseUrl}') return;
  const { type, payload } = event.data || {};
  switch (type) {
    case 'LOADED':
      console.log('Configurator ready', payload);
      break;
    case 'PRICE_UPDATED':
      console.log('Price:', payload?.price);
      break;
    case 'ADD_TO_CART':
      console.log('Add to cart', payload);
      break;
  }
});`;

  const reactCode = `import { useEffect, useRef } from 'react';

export function EmbeddedConfigurator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const configId = '${configId}';

  useEffect(() => {
    if (!containerRef.current) return;
    const iframe = document.createElement('iframe');
    iframe.src = \`\${window.location.origin}/configurator-3d/embed/\${configId}?width=800&height=600&theme=${theme}\`;
    iframe.width = '800';
    iframe.height = '600';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.title = '3D Configurator';
    containerRef.current.appendChild(iframe);

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const { type, payload } = event.data || {};
      // Handle LOADED, PRICE_UPDATED, ADD_TO_CART, etc.
    };
    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
      containerRef.current?.removeChild(iframe);
    };
  }, [configId]);

  return <div ref={containerRef} className="w-full aspect-video" />;
}`;

  const copyToClipboard = useCallback(async (text: string, tab: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  }, []);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          Embed Code
        </CardTitle>
        <CardDescription>
          Copy the code to embed this configurator on your site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Width</Label>
            <Input
              type="number"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value, 10) || 800)}
              min={320}
              max={1920}
            />
          </div>
          <div className="space-y-2">
            <Label>Height</Label>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value, 10) || 600)}
              min={240}
              max={1080}
            />
          </div>
          <div className="space-y-2">
            <Label>Theme</Label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        <Tabs defaultValue="iframe">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="iframe" className="flex items-center gap-2">
              <Frame className="h-4 w-4" />
              iframe
            </TabsTrigger>
            <TabsTrigger value="js" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              JavaScript
            </TabsTrigger>
            <TabsTrigger value="react" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              React
            </TabsTrigger>
          </TabsList>
          <TabsContent value="iframe" className="mt-4">
            <CodeBlock
              code={iframeCode}
              onCopy={() => copyToClipboard(iframeCode, 'iframe')}
              copied={copiedTab === 'iframe'}
            />
          </TabsContent>
          <TabsContent value="js" className="mt-4">
            <CodeBlock
              code={jsCode}
              onCopy={() => copyToClipboard(jsCode, 'js')}
              copied={copiedTab === 'js'}
            />
          </TabsContent>
          <TabsContent value="react" className="mt-4">
            <CodeBlock
              code={reactCode}
              onCopy={() => copyToClipboard(reactCode, 'react')}
              copied={copiedTab === 'react'}
            />
          </TabsContent>
        </Tabs>

        <div className="rounded-lg border bg-muted/30 p-4">
          <Label className="text-muted-foreground">Preview</Label>
          <iframe
            src={embedUrl}
            width={Math.min(width, 400)}
            height={Math.min(height, 300)}
            className="mt-2 rounded border"
            title="Embed preview"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CodeBlock({
  code,
  onCopy,
  copied,
}: {
  code: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-sm">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="secondary"
        className="absolute right-2 top-2"
        onClick={onCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
