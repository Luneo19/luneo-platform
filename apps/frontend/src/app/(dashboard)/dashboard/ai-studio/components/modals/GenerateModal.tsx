/**
 * Modal de génération AI
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Sparkles, RefreshCw } from 'lucide-react';
import { GENERATION_TYPES, AI_MODELS, SIZE_OPTIONS, QUALITY_OPTIONS, STYLE_OPTIONS } from '../../constants/ai';
import type { GenerationType, AISettings } from '../../types';

interface GenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (prompt: string, type: GenerationType, settings: AISettings) => Promise<{ success: boolean }>;
  isGenerating: boolean;
  progress: number;
  defaultType?: GenerationType;
}

export function GenerateModal({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
  progress,
  defaultType = '2d',
}: GenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<GenerationType>(defaultType);
  const [model, setModel] = useState<AISettings['model']>('dall-e-3');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState<AISettings['quality']>('standard');
  const [style, setStyle] = useState<AISettings['style']>('vivid');

  const selectedType = GENERATION_TYPES.find((t) => t.value === type);
  const estimatedCredits = selectedType?.credits || 10;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const result = await onGenerate(prompt, type, {
      model,
      size,
      quality,
      style,
    });

    if (result.success) {
      setPrompt('');
      setTimeout(() => onOpenChange(false), 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dash-card border-white/[0.06] bg-[#12121a] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Générer avec l'IA</DialogTitle>
          <DialogDescription className="text-white/60">
            Décrivez votre idée et l'IA créera un design pour vous
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-white/80 mb-2 block">Type de génération</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {GENERATION_TYPES.map((genType) => {
                const Icon = genType.icon as React.ComponentType<{ className?: string }>;
                return (
                  <button
                    key={genType.value}
                    onClick={() => setType(genType.value)}
                    className={`p-3 rounded-xl border-2 transition-colors text-left ${
                      type === genType.value
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-white/[0.08] bg-white/[0.04] hover:border-white/[0.12]'
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5 mb-2 text-purple-400" />}
                    <p className="text-sm font-medium text-white">{genType.label}</p>
                    <p className="text-xs text-white/60">{genType.description}</p>
                    <p className="text-xs text-[#fbbf24] mt-1">{genType.credits} crédits</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label htmlFor="prompt" className="text-white/80">
              Décrivez votre design
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Un logo moderne pour une startup tech avec des couleurs bleu et blanc..."
              className="dash-input mt-2 min-h-[120px] text-white placeholder:text-white/40 border-white/[0.08] bg-white/[0.04]"
              disabled={isGenerating}
            />
            <p className="text-xs text-white/40 mt-1">
              {prompt.length} / 1000 caractères • ~{estimatedCredits} crédits estimés
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/80">Modèle IA</Label>
              <Select value={model} onValueChange={(v) => setModel(v as AISettings['model'])}>
                <SelectTrigger className="dash-input border-white/[0.08] bg-white/[0.04] text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dash-card border-white/[0.06] bg-[#1a1a2e]">
                  {AI_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-white focus:bg-white/[0.06]">
                      <div>
                        <p className="font-medium text-white">{m.label}</p>
                        <p className="text-xs text-white/40">{m.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/80">Taille</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="dash-input border-white/[0.08] bg-white/[0.04] text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dash-card border-white/[0.06] bg-[#1a1a2e]">
                  {SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-white focus:bg-white/[0.06]">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/80">Qualité</Label>
              <Select value={quality} onValueChange={(v) => setQuality(v as AISettings['quality'])}>
                <SelectTrigger className="dash-input border-white/[0.08] bg-white/[0.04] text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dash-card border-white/[0.06] bg-[#1a1a2e]">
                  {QUALITY_OPTIONS.map((q) => (
                    <SelectItem key={q.value} value={q.value} className="text-white focus:bg-white/[0.06]">
                      {q.label} ({q.credits}x crédits)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/80">Style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as AISettings['style'])}>
                <SelectTrigger className="dash-input border-white/[0.08] bg-white/[0.04] text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dash-card border-white/[0.06] bg-[#1a1a2e]">
                  {STYLE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-white focus:bg-white/[0.06]">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-white/40 text-center">
                Génération en cours... {progress}%
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/[0.08] text-white hover:bg-white/[0.04]" disabled={isGenerating}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer (~{estimatedCredits} crédits)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
