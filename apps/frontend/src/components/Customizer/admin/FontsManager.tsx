'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

interface Font {
  id: string;
  name: string;
  family: string;
  type: 'system' | 'custom';
  enabled: boolean;
  url?: string;
  preview?: string;
}

interface FontsManagerProps {
  customizerId: string;
}

export function FontsManager({ customizerId }: FontsManagerProps) {
  const [systemFonts, setSystemFonts] = useState<Font[]>([]);
  const [customFonts, setCustomFonts] = useState<Font[]>([]);
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');

  useEffect(() => {
    // Load system fonts
    const systemFontList: Font[] = [
      { id: 'arial', name: 'Arial', family: 'Arial, sans-serif', type: 'system', enabled: true },
      { id: 'helvetica', name: 'Helvetica', family: 'Helvetica, sans-serif', type: 'system', enabled: true },
      { id: 'times', name: 'Times New Roman', family: 'Times New Roman, serif', type: 'system', enabled: true },
      { id: 'courier', name: 'Courier New', family: 'Courier New, monospace', type: 'system', enabled: true },
      { id: 'verdana', name: 'Verdana', family: 'Verdana, sans-serif', type: 'system', enabled: true },
      { id: 'georgia', name: 'Georgia', family: 'Georgia, serif', type: 'system', enabled: true },
      { id: 'palatino', name: 'Palatino', family: 'Palatino, serif', type: 'system', enabled: true },
      { id: 'garamond', name: 'Garamond', family: 'Garamond, serif', type: 'system', enabled: true },
      { id: 'comic', name: 'Comic Sans MS', family: 'Comic Sans MS, cursive', type: 'system', enabled: false },
      { id: 'impact', name: 'Impact', family: 'Impact, sans-serif', type: 'system', enabled: true },
    ];
    setSystemFonts(systemFontList);

    // Load custom fonts
    loadCustomFonts();
  }, []);

  const loadCustomFonts = async () => {
    try {
      const fonts = await api.get<Font[]>(
        `/api/v1/customizer/configurations/${customizerId}/fonts`
      );
      setCustomFonts(fonts);
    } catch (err) {
      logger.error('Failed to load custom fonts', { error: err });
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('fonts', file);
    });

    try {
      const result = await api.post<Font[]>(
        `/api/v1/customizer/configurations/${customizerId}/fonts`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      setCustomFonts((prev) => [...prev, ...result]);
    } catch (err) {
      logger.error('Failed to upload fonts', { error: err });
    }
  };

  const handleToggleEnabled = async (fontId: string, currentEnabled: boolean, type: 'system' | 'custom') => {
    try {
      if (type === 'system') {
        // System fonts are managed locally
        setSystemFonts((prev) =>
          prev.map((f) => (f.id === fontId ? { ...f, enabled: !currentEnabled } : f))
        );
      } else {
        await api.patch(`/api/v1/customizer/configurations/${customizerId}/fonts/${fontId}`, {
          enabled: !currentEnabled,
        });
        setCustomFonts((prev) =>
          prev.map((f) => (f.id === fontId ? { ...f, enabled: !currentEnabled } : f))
        );
      }
    } catch (err) {
      logger.error('Failed to update font', { error: err });
    }
  };

  const handleDelete = async (fontId: string) => {
    if (!confirm('Are you sure you want to delete this font?')) return;

    try {
      await api.delete(`/api/v1/customizer/configurations/${customizerId}/fonts/${fontId}`);
      setCustomFonts((prev) => prev.filter((f) => f.id !== fontId));
    } catch (err) {
      logger.error('Failed to delete font', { error: err });
    }
  };

  const FontCard = ({ font }: { font: Font }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="font-medium">{font.name}</div>
            <div className="text-sm text-muted-foreground">{font.family}</div>
          </div>
          <div className="flex items-center gap-2">
            {font.enabled ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            {font.type === 'custom' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(font.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div
          className="border rounded p-3 bg-muted/30"
          style={{ fontFamily: font.family }}
        >
          {previewText}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Badge variant={font.type === 'system' ? 'secondary' : 'default'}>
            {font.type}
          </Badge>
          <div className="flex items-center gap-2">
            <Label htmlFor={`font-${font.id}`} className="text-sm">
              Enabled
            </Label>
            <Switch
              id={`font-${font.id}`}
              checked={font.enabled}
              onCheckedChange={() => handleToggleEnabled(font.id, font.enabled, font.type)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fonts</h2>
          <p className="text-muted-foreground">Manage system and custom fonts</p>
        </div>
        <div>
          <input
            type="file"
            id="font-upload"
            multiple
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button asChild>
            <label htmlFor="font-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Upload Fonts
            </label>
          </Button>
        </div>
      </div>

      {/* Preview Text */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Text</CardTitle>
          <CardDescription>Customize the preview text to see how fonts look</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Enter preview text..."
          />
        </CardContent>
      </Card>

      {/* System Fonts */}
      <div>
        <h3 className="text-lg font-semibold mb-4">System Fonts</h3>
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            {systemFonts.map((font) => (
              <FontCard key={font.id} font={font} />
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Custom Fonts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Custom Fonts</h3>
          <Badge>{customFonts.length} uploaded</Badge>
        </div>
        {customFonts.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
              {customFonts.map((font) => (
                <FontCard key={font.id} font={font} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No custom fonts uploaded yet. Click &quot;Upload Fonts&quot; to add your own fonts.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
