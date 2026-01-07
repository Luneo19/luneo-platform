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
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Générer avec l'IA</DialogTitle>
          <DialogDescription className="text-gray-400">
            Décrivez votre idée et l'IA créera un design pour vous
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-gray-300 mb-2 block">Type de génération</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {GENERATION_TYPES.map((genType) => {
                const Icon = genType.icon;
                return (
                  <button
                    key={genType.value}
                    onClick={() => setType(genType.value)}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      type === genType.value
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-600 bg-gray-900/50 hover:border-gray-500'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2 text-purple-400" />
                    <p className="text-sm font-medium text-white">{genType.label}</p>
                    <p className="text-xs text-gray-400">{genType.description}</p>
                    <p className="text-xs text-yellow-400 mt-1">{genType.credits} crédits</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label htmlFor="prompt" className="text-gray-300">
              Décrivez votre design
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Un logo moderne pour une startup tech avec des couleurs bleu et blanc..."
              className="bg-gray-900 border-gray-600 text-white mt-2 min-h-[120px]"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-400 mt-1">
              {prompt.length} / 1000 caractères • ~{estimatedCredits} crédits estimés
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Modèle IA</Label>
              <Select value={model} onValueChange={(v) => setModel(v as AISettings['model'])}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div>
                        <p className="font-medium">{m.label}</p>
                        <p className="text-xs text-gray-400">{m.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Taille</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Qualité</Label>
              <Select value={quality} onValueChange={(v) => setQuality(v as AISettings['quality'])}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_OPTIONS.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label} ({q.credits}x crédits)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as AISettings['style'])}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
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
              <p className="text-xs text-gray-400 text-center">
                Génération en cours... {progress}%
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-600" disabled={isGenerating}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
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


