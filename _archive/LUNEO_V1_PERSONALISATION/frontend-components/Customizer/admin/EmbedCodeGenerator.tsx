'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Plus, Trash2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface EmbedCodeGeneratorProps {
  customizerId: string;
  productId?: string;
}

export function EmbedCodeGenerator({ customizerId, productId }: EmbedCodeGeneratorProps) {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const embedUrl = productId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/customize/${productId}?embed=true&theme=${theme}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/customizer/${customizerId}?embed=true&theme=${theme}`;

  const htmlSnippet = `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allowfullscreen
></iframe>`;

  const jsSnippet = `<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${embedUrl}';
    iframe.width = '${width}';
    iframe.height = '${height}';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.style.border = 'none';
    document.getElementById('customizer-container').appendChild(iframe);
    
    // Listen for messages from iframe
    window.addEventListener('message', function(event) {
      if (event.origin !== '${typeof window !== 'undefined' ? window.location.origin : ''}') return;
      console.log('Message from customizer:', event.data);
    });
  })();
</script>
<div id="customizer-container"></div>`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAddDomain = () => {
    if (newDomain.trim() && !allowedDomains.includes(newDomain.trim())) {
      setAllowedDomains([...allowedDomains, newDomain.trim()]);
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== domain));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Embed Code Generator</h2>
        <p className="text-muted-foreground">Generate embed code for your customizer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Configure the embed settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 800)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 600)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allowed Domains</CardTitle>
              <CardDescription>Restrict embedding to specific domains</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                />
                <Button onClick={handleAddDomain}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {allowedDomains.length > 0 && (
                <div className="space-y-2">
                  {allowedDomains.map((domain) => (
                    <div
                      key={domain}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <Badge variant="outline">{domain}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveDomain(domain)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Direct URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={embedUrl} readOnly className="font-mono text-sm" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(embedUrl, 'url')}
                >
                  {copied === 'url' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Code */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded overflow-hidden bg-muted/20">
                <iframe
                  src={embedUrl}
                  width={width}
                  height={height}
                  className="border-0"
                  style={{ maxWidth: '100%' }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HTML Snippet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={htmlSnippet}
                readOnly
                className="font-mono text-sm h-32"
              />
              <Button
                className="w-full"
                onClick={() => handleCopy(htmlSnippet, 'html')}
              >
                {copied === 'html' ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy HTML
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JavaScript Snippet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={jsSnippet}
                readOnly
                className="font-mono text-sm h-40"
              />
              <Button
                className="w-full"
                onClick={() => handleCopy(jsSnippet, 'js')}
              >
                {copied === 'js' ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy JavaScript
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
