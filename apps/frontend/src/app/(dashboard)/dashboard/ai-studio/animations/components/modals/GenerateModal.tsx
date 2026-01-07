/**
 * Modal de génération d'animation
 */

'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import type { AnimationStyle } from '../../types';

interface GenerateModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (
    prompt: string,
    duration: number,
    style: AnimationStyle,
    fps: number,
    resolution: string
  ) => void;
  isGenerating: boolean;
  progress: number;
}

export function GenerateModal({
  open,
  onClose,
  onGenerate,
  isGenerating,
  progress,
}: GenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('5');
  const [style, setStyle] = useState<AnimationStyle>('smooth');
  const [fps, setFps] = useState([24]);
  const [resolution, setResolution] = useState('1080p');

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt, Number(duration), style, fps[0] || 24, resolution);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Générer une Animation</DialogTitle>
          <DialogDescription className="text-gray-400">
            Décrivez l'animation que vous souhaitez créer
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt" className="text-gray-300">
              Prompt
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Logo qui apparaît avec un effet de zoom fluide..."
              className="bg-gray-900 border-gray-600 text-white mt-1"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration" className="text-gray-300">
                Durée (secondes)
              </Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                max="30"
                className="bg-gray-900 border-gray-600 text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="style" className="text-gray-300">
                Style
              </Label>
              <Select value={style} onValueChange={(v) => setStyle(v as AnimationStyle)}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smooth">Fluide</SelectItem>
                  <SelectItem value="bounce">Rebond</SelectItem>
                  <SelectItem value="fade">Fondu</SelectItem>
                  <SelectItem value="slide">Glissement</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">FPS: {fps[0] || 24}</Label>
              <Slider
                value={fps}
                onValueChange={setFps}
                min={12}
                max={60}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="resolution" className="text-gray-300">
                Résolution
              </Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                  <SelectItem value="4k">4K</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Génération en cours...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating} className="border-gray-600">
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? 'Génération...' : 'Générer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


