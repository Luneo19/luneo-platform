'use client';

/**
 * Bracelet Customizer Page
 * 
 * Module complet de personnalisation de bracelet avec gravure et AR
 * - Saisie texte avec support accents
 * - Choix police (6 polices)
 * - Taille, alignement, position (intérieur/extérieur/face gauche/face droite)
 * - Choix couleur bracelet et finition (acier, or, cuir)
 * - Aperçu 3D temps réel (.glb)
 * - Rendu haute qualité 2D (PNG) exportable
 * - Preview AR (WebXR + Quick Look iOS)
 * 
 * @author Luneo Platform
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  RotateCw, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Minimize2,
  Type,
  Palette,
  Settings,
  Sparkles,
  CheckCircle,
  Loader2,
  AlertCircle,
  Camera,
  Box,
  Layers,
  Eye,
  Smartphone,
  Globe,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Lazy load heavy 3D components
const Bracelet3DViewer = dynamic(
  () => import('@/components/bracelet/Bracelet3DViewer').then(mod => ({ default: mod.Bracelet3DViewer })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-900 rounded-lg">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    ),
  }
);

const BraceletARViewer = dynamic(
  () => import('@/components/bracelet/BraceletARViewer').then(mod => ({ default: mod.BraceletARViewer })),
  { ssr: false }
);

const Bracelet2DPreview = dynamic(
  () => import('@/components/bracelet/Bracelet2DPreview').then(mod => ({ default: mod.Bracelet2DPreview })),
  { ssr: false }
);

// Font options
const FONT_OPTIONS = [
  { value: 'serif', label: 'Serif', family: 'Georgia, serif' },
  { value: 'sans', label: 'Sans', family: 'Arial, sans-serif' },
  { value: 'monospace', label: 'Monospace', family: 'Courier New, monospace' },
  { value: 'cursive', label: 'Cursive', family: 'Brush Script MT, cursive' },
  { value: 'times', label: 'Times New Roman', family: 'Times New Roman, serif' },
  { value: 'georgia', label: 'Georgia', family: 'Georgia, serif' },
] as const;

// Position options
const POSITION_OPTIONS = [
  { value: 'interior', label: 'Intérieur', icon: '⬅️' },
  { value: 'exterior', label: 'Extérieur', icon: '➡️' },
  { value: 'face-left', label: 'Face Gauche', icon: '⬅️' },
  { value: 'face-right', label: 'Face Droite', icon: '➡️' },
] as const;

// Alignment options
const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Gauche', icon: '◀' },
  { value: 'center', label: 'Centre', icon: '⬅➡' },
  { value: 'right', label: 'Droite', icon: '▶' },
] as const;

// Material options
const MATERIAL_OPTIONS = [
  { value: 'steel', label: 'Acier', color: '#c0c0c0', preview: 'bg-gray-300' },
  { value: 'gold', label: 'Or', color: '#ffd700', preview: 'bg-yellow-400' },
  { value: 'leather', label: 'Cuir', color: '#8b4513', preview: 'bg-amber-800' },
] as const;

// Customization state interface
interface BraceletCustomization {
  text: string;
  font: typeof FONT_OPTIONS[number]['value'];
  fontSize: number;
  alignment: typeof ALIGNMENT_OPTIONS[number]['value'];
  position: typeof POSITION_OPTIONS[number]['value'];
  color: string;
  material: typeof MATERIAL_OPTIONS[number]['value'];
}

const DEFAULT_CUSTOMIZATION: BraceletCustomization = {
  text: 'Votre texte ici',
  font: 'serif',
  fontSize: 28,
  alignment: 'center',
  position: 'exterior',
  color: '#c0c0c0',
  material: 'steel',
};

function BraceletCustomizePageContent() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [customization, setCustomization] = useState<BraceletCustomization>(DEFAULT_CUSTOMIZATION);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'3d' | '2d' | 'ar'>('3d');
  const [textureDataUrl, setTextureDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update customization
  const updateCustomization = useCallback((updates: Partial<BraceletCustomization>) => {
    setCustomization(prev => ({ ...prev, ...updates }));
  }, []);

  // Save customization
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const data = await api.post<{ id?: string }>('/api/v1/bracelet/customizations', {
        ...customization,
        texture: textureDataUrl,
        model: 'bracelet.glb',
      });
      toast({
        title: t('bracelet.configSaved'),
        description: t('bracelet.configSavedDesc'),
      });
      logger.info('Bracelet customization saved', { id: data.id });
    } catch (error) {
      logger.error('Error saving bracelet customization', {
        error,
        customization,
      });
      toast({
        title: t('common.error'),
        description: t('bracelet.saveError'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customization, textureDataUrl, toast]);

  // Export PNG
  const handleExportPNG = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await api.post<Blob>(
        '/api/v1/bracelet/render',
        {
          ...customization,
          width: 3840,
          height: 2160,
          format: 'png',
        },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bracelet-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t('bracelet.exportSuccess'),
        description: t('bracelet.exportSuccessDesc'),
      });
    } catch (error) {
      logger.error('Error exporting PNG', { error });
      toast({
        title: t('common.error'),
        description: t('bracelet.exportError'),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customization, toast]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setCustomization(DEFAULT_CUSTOMIZATION);
    toast({
      title: t('bracelet.resetDone'),
      description: t('bracelet.resetDoneDesc'),
    });
  }, [t, toast]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/products">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Personnalisation Bracelet</h1>
                <p className="text-sm text-slate-400">Gravure personnalisée avec AR</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPNG}
                disabled={isExporting}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Exporter PNG
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Editor */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Paramètres de gravure
              </h2>

              {/* Text Input */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="text" className="text-slate-300">
                  Texte de gravure
                </Label>
                <Input
                  id="text"
                  value={customization.text}
                  onChange={(e) => updateCustomization({ text: e.target.value })}
                  placeholder="Votre texte ici"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  maxLength={50}
                />
                <p className="text-xs text-slate-500">
                  {customization.text.length}/50 caractères
                </p>
              </div>

              {/* Font Selection */}
              <div className="space-y-2 mb-4">
                <Label className="text-slate-300">Police</Label>
                <Select
                  value={customization.font}
                  onValueChange={(value) => updateCustomization({ font: value as typeof customization.font })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value} className="text-white">
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="space-y-2 mb-4">
                <Label className="text-slate-300">
                  Taille: {customization.fontSize}px
                </Label>
                <Slider
                  value={[customization.fontSize]}
                  onValueChange={([value]) => updateCustomization({ fontSize: value })}
                  min={10}
                  max={80}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Alignment */}
              <div className="space-y-2 mb-4">
                <Label className="text-slate-300">Alignement</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ALIGNMENT_OPTIONS.map((align) => (
                    <Button
                      key={align.value}
                      variant={customization.alignment === align.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateCustomization({ alignment: align.value as typeof customization.alignment })}
                      className={
                        customization.alignment === align.value
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }
                    >
                      {align.icon} {align.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div className="space-y-2 mb-4">
                <Label className="text-slate-300">Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  {POSITION_OPTIONS.map((pos) => (
                    <Button
                      key={pos.value}
                      variant={customization.position === pos.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateCustomization({ position: pos.value as typeof customization.position })}
                      className={
                        customization.position === pos.value
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }
                    >
                      {pos.icon} {pos.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Material & Color */}
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-cyan-400" />
                Matériau & Couleur
              </h2>

              {/* Material */}
              <div className="space-y-2 mb-4">
                <Label className="text-slate-300">Finition</Label>
                <div className="grid grid-cols-3 gap-2">
                  {MATERIAL_OPTIONS.map((mat) => (
                    <button
                      key={mat.value}
                      onClick={() => {
                        updateCustomization({ 
                          material: mat.value as typeof customization.material,
                          color: mat.color,
                        });
                      }}
                      className={`
                        p-3 rounded-lg border-2 transition-all
                        ${customization.material === mat.value 
                          ? 'border-cyan-500 ring-2 ring-cyan-500/20' 
                          : 'border-slate-700 hover:border-slate-600'
                        }
                      `}
                    >
                      <div className={`w-full h-8 rounded ${mat.preview} mb-2`} />
                      <p className="text-xs text-slate-300">{mat.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <Label className="text-slate-300">Couleur personnalisée</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customization.color}
                    onChange={(e) => updateCustomization({ color: e.target.value })}
                    className="w-16 h-10 rounded border border-slate-700 cursor-pointer"
                  />
                  <Input
                    value={customization.color}
                    onChange={(e) => updateCustomization({ color: e.target.value })}
                    className="flex-1 bg-slate-800 border-slate-700 text-white"
                    placeholder="#c0c0c0"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
                  <TabsTrigger value="3d" className="data-[state=active]:bg-cyan-600">
                    <Box className="w-4 h-4 mr-2" />
                    3D
                  </TabsTrigger>
                  <TabsTrigger value="2d" className="data-[state=active]:bg-cyan-600">
                    <Layers className="w-4 h-4 mr-2" />
                    2D
                  </TabsTrigger>
                  <TabsTrigger value="ar" className="data-[state=active]:bg-cyan-600">
                    <Smartphone className="w-4 h-4 mr-2" />
                    AR
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="3d" className="mt-4">
                  <div className="relative w-full h-[600px] bg-slate-950 rounded-lg overflow-hidden">
                    <Bracelet3DViewer
                      customization={customization}
                      onTextureReady={setTextureDataUrl}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="2d" className="mt-4">
                  <div className="relative w-full h-[600px] bg-slate-950 rounded-lg overflow-hidden">
                    <Bracelet2DPreview
                      customization={customization}
                      onTextureReady={setTextureDataUrl}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="ar" className="mt-4">
                  <div className="relative w-full h-[600px] bg-slate-950 rounded-lg overflow-hidden">
                    <BraceletARViewer
                      customization={customization}
                      modelUrl="/models/bracelets/bracelet.glb"
                      usdzUrl="/models/bracelets/bracelet.usdz"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const MemoizedBraceletCustomizePageContent = memo(BraceletCustomizePageContent);

export default function BraceletCustomizePage() {
  return (
    <ErrorBoundary level="page" componentName="BraceletCustomizePage">
      <MemoizedBraceletCustomizePageContent />
    </ErrorBoundary>
  );
}

