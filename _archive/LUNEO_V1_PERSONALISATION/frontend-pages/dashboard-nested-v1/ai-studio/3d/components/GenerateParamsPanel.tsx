'use client';

import {
  ChevronDown,
  ChevronUp,
  Diamond,
  Lightbulb,
  Loader2,
  Sparkles,
  Wand2,
  Zap,
  Box,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/i18n/useI18n';

export type ToastFn = (opts: { title: string; description: string; variant?: 'destructive' | 'default' }) => void;

interface GenerateParamsPanelProps {
  prompt: string;
  setPrompt: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  complexity: string;
  setComplexity: (v: string) => void;
  resolution: string;
  setResolution: (v: string) => void;
  polyCount: number[];
  setPolyCount: (v: number[]) => void;
  textureQuality: number[];
  setTextureQuality: (v: number[]) => void;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  isGenerating: boolean;
  generationProgress: number;
  credits: number;
  enableBatch: boolean;
  setEnableBatch: (v: boolean) => void;
  batchCount: number;
  setBatchCount: (v: number) => void;
  handleGenerate: () => void;
  toast: ToastFn;
}

export function GenerateParamsPanel({
  prompt,
  setPrompt,
  category,
  setCategory,
  complexity,
  setComplexity,
  resolution,
  setResolution,
  polyCount,
  setPolyCount,
  textureQuality,
  setTextureQuality,
  showAdvanced,
  setShowAdvanced,
  isGenerating,
  generationProgress,
  credits,
  enableBatch,
  setEnableBatch,
  batchCount,
  setBatchCount,
  handleGenerate,
  toast,
}: GenerateParamsPanelProps) {
  const { t } = useI18n();

  const CATEGORY_OPTIONS = [
    { value: 'product', label: t('aiStudio3d.categoryProduct') },
    { value: 'furniture', label: t('aiStudio3d.categoryFurniture') },
    { value: 'jewelry', label: t('aiStudio3d.categoryJewelry') },
    { value: 'electronics', label: t('aiStudio3d.categoryElectronics') },
    { value: 'fashion', label: t('aiStudio3d.categoryFashion') },
    { value: 'automotive', label: t('aiStudio3d.categoryAutomotive') },
    { value: 'architecture', label: t('aiStudio3d.categoryArchitecture') },
    { value: 'other', label: t('aiStudio3d.categoryOther') },
  ];

  const COMPLEXITY_OPTIONS = [
    { value: 'low', label: t('aiStudio3d.complexityLow') },
    { value: 'medium', label: t('aiStudio3d.complexityMedium') },
    { value: 'high', label: t('aiStudio3d.complexityHigh') },
    { value: 'ultra', label: t('aiStudio3d.complexityUltra') },
  ];

  const RESOLUTION_OPTIONS = [
    { value: 'low', label: t('aiStudio3d.resolutionLow') },
    { value: 'medium', label: t('aiStudio3d.resolutionMedium') },
    { value: 'high', label: t('aiStudio3d.resolutionHigh') },
    { value: 'ultra', label: t('aiStudio3d.resolutionUltra') },
  ];

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-cyan-400" />
          {t('aiStudio3d.paramsTitle')}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {t('aiStudio3d.paramsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-gray-900">
            {t('aiStudio3d.modelDescription')}
          </Label>
          <Textarea
            id="prompt"
            placeholder={t('aiStudio3d.modelPlaceholder')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-white border-gray-200 text-gray-900 min-h-[100px] resize-none"
            rows={4}
          />
          <p className="text-xs text-gray-600">
            {t('aiStudio3d.charsCount', { count: prompt.length })}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-900">{t('aiStudio3d.category')}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-white border-gray-200 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-900">{t('aiStudio3d.complexity')}</Label>
          <Select value={complexity} onValueChange={setComplexity}>
            <SelectTrigger className="bg-white border-gray-200 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPLEXITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-900">{t('aiStudio3d.resolution')}</Label>
          <Select value={resolution} onValueChange={setResolution}>
            <SelectTrigger className="bg-white border-gray-200 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showAdvanced && (
          <>
            <Separator className="bg-slate-700" />
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">{t('aiStudio3d.polyCount')}</Label>
                  <span className="text-sm text-slate-400">{polyCount[0].toLocaleString()}</span>
                </div>
                <Slider
                  value={polyCount}
                  onValueChange={setPolyCount}
                  min={10000}
                  max={200000}
                  step={5000}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{t('aiStudio3d.light')}</span>
                  <span>{t('aiStudio3d.optimal')}</span>
                  <span>{t('aiStudio3d.detailed')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">{t('aiStudio3d.textureQuality')}</Label>
                  <span className="text-sm text-slate-400">{textureQuality[0]}%</span>
                </div>
                <Slider
                  value={textureQuality}
                  onValueChange={setTextureQuality}
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full border-gray-200"
        >
          {showAdvanced ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              {t('aiStudio3d.hideAdvanced')}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              {t('aiStudio3d.showAdvanced')}
            </>
          )}
        </Button>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || credits < 25}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('aiStudio3d.generating')} ({generationProgress}%)
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {t('aiStudio3d.generateButton')}
            </>
          )}
        </Button>

        {isGenerating && <Progress value={generationProgress} className="h-2" />}

        <Separator className="bg-gray-200" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-gray-900">{t('aiStudio3d.batchGeneration')}</Label>
            <Checkbox
              checked={enableBatch}
              onCheckedChange={(checked) => setEnableBatch(checked === true)}
              className="border-gray-200"
            />
          </div>
          {enableBatch && (
            <div className="space-y-3 p-3 bg-gray-100 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">{t('aiStudio3d.variantCount')}</Label>
                <Slider
                  value={[batchCount]}
                  onValueChange={(value) => setBatchCount(value[0])}
                  min={2}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{t('aiStudio3d.variants2')}</span>
                  <span className="font-semibold text-cyan-600">
                    {batchCount} {t('aiStudio3d.variants')}
                  </span>
                  <span>{t('aiStudio3d.variants10')}</span>
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                {t('aiStudio3d.totalCost', { total: batchCount * 25, count: batchCount })}
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-gray-200" />
        <div className="space-y-2">
          <Label className="text-gray-900">{t('aiStudio3d.quickActions')}</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPrompt(
                  'A detailed 3D model of a luxury watch with intricate design, premium materials, studio lighting, high quality'
                );
                setCategory('jewelry');
                setComplexity('high');
                toast({ title: t('aiStudio3d.templateLoaded'), description: t('aiStudio3d.templateLuxeDesc') });
              }}
              className="border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {t('aiStudio3d.templateLuxe')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPrompt(
                  'A modern minimalist furniture piece, clean lines, Scandinavian style, natural materials, high poly count'
                );
                setCategory('furniture');
                setComplexity('medium');
                toast({ title: t('aiStudio3d.templateLoaded'), description: t('aiStudio3d.templateModerneDesc') });
              }}
              className="border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              <Box className="w-3 h-3 mr-1" />
              {t('aiStudio3d.templateModerne')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPrompt(
                  'A futuristic electronic device, sleek design, metallic finish, LED accents, high tech aesthetic'
                );
                setCategory('electronics');
                setComplexity('high');
                toast({ title: t('aiStudio3d.templateLoaded'), description: t('aiStudio3d.templateTechDesc') });
              }}
              className="border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              <Zap className="w-3 h-3 mr-1" />
              {t('aiStudio3d.templateTech')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPrompt(
                  'A elegant piece of jewelry, precious metals, gemstones, intricate details, luxury design'
                );
                setCategory('jewelry');
                setComplexity('ultra');
                toast({ title: t('aiStudio3d.templateLoaded'), description: t('aiStudio3d.templateBijouDesc') });
              }}
              className="border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              <Diamond className="w-3 h-3 mr-1" />
              {t('aiStudio3d.templateBijou')}
            </Button>
          </div>
        </div>

        <Separator className="bg-gray-200" />
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <Label className="text-sm text-purple-300">{t('aiStudio3d.suggestionsTitle')}</Label>
            </div>
            <p className="text-xs text-gray-700 mb-2">
              {t('aiStudio3d.suggestionsDesc')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const suggestions = [
                  t('aiStudio3d.suggestion1'),
                  t('aiStudio3d.suggestion2'),
                  t('aiStudio3d.suggestion3'),
                  t('aiStudio3d.suggestion4'),
                ];
                const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
                toast({ title: t('aiStudio3d.suggestionTitle'), description: suggestion });
              }}
              className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              {t('aiStudio3d.getSuggestions')}
            </Button>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
