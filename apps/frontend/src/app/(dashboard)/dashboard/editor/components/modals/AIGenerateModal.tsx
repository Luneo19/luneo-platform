/**
 * Modal: Generate image with AI and add to canvas
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';

interface AIGenerateModalProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (imageUrl: string) => void;
}

export function AIGenerateModal({ open, onClose, onGenerated }: AIGenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-2d', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: 'realistic',
          width: 512,
          height: 512,
          quality: 85,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Generation failed');
      }
      const data = await res.json();
      const result = data.data || data;
      const imageUrl = result.imageUrl || result.url || result.image;
      if (!imageUrl) throw new Error('No image URL returned');
      onGenerated(imageUrl);
      onClose();
      setPrompt('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Generate with AI
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Describe the image you want. It will be added to the canvas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-zinc-300">Prompt</Label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Luxury watch on marble background"
              className="mt-2 bg-zinc-800 border-zinc-600 text-zinc-200 placeholder:text-zinc-500"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-zinc-600 text-zinc-300">
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
