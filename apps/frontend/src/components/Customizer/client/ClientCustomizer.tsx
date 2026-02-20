'use client';

/**
 * ClientCustomizer - Enhanced client-facing product customizer
 * Canvas (react-konva) + right panel with zone editing, layers, price, add-to-cart.
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Stage, Layer, Group, Rect, Text, Image, Transformer } from 'react-konva';
import Konva from 'konva';
import {
  useCanvasStore,
  useLayersStore,
  useSessionStore,
  useSelectionStore,
  type PriceItem,
} from '@/stores/customizer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedCounter } from '@/components/ui/premium/animated-counter';
import {
  Type,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Search,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ZoneConfig {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  allowText: boolean;
  allowImages: boolean;
  allowShapes: boolean;
  allowClipart: boolean;
  maxElements: number;
  priceModifier: number;
  allowedFonts?: string[];
  allowedColors?: string[];
}

export interface ClientCustomizerProps {
  customizerId: string;
  productName: string;
  productImageUrl?: string;
  canvasWidth: number;
  canvasHeight: number;
  zones: ZoneConfig[];
  basePrice: number;
  currency: string;
  pricingEnabled: boolean;
  allowedFonts?: string[];
  onAddToCart: (designData: {
    canvasData: unknown;
    price: number;
    thumbnailUrl?: string;
  }) => void;
  onSaveDesign?: (name: string) => void;
}

interface ZoneContent {
  type: 'text' | 'image' | 'clipart';
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontStyle?: string; // 'normal' | 'bold' | 'italic' | 'underline'
  align?: string;
  src?: string;
  fit?: 'fit' | 'fill' | 'center';
}

const DEFAULT_FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana'];
const DEFAULT_COLORS = ['#000000', '#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#8b5cf6'];
const MIN_IMAGE_WIDTH = 150;
const MIN_IMAGE_HEIGHT = 150;

// Placeholder clipart categories (can be replaced with API)
const CLIPART_CATEGORIES: Record<string, { id: string; name: string; items: { id: string; url: string; name: string }[] }> = {
  icons: {
    id: 'icons',
    name: 'Icons',
    items: [
      { id: 'c1', url: '', name: 'Star' },
      { id: 'c2', url: '', name: 'Heart' },
      { id: 'c3', url: '', name: 'Check' },
    ],
  },
  shapes: {
    id: 'shapes',
    name: 'Shapes',
    items: [
      { id: 'c4', url: '', name: 'Circle' },
      { id: 'c5', url: '', name: 'Square' },
    ],
  },
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function useLoadedImage(url: string | undefined): { image: HTMLImageElement | null; loading: boolean; error: boolean } {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!url) {
      setImage(null);
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setLoading(false);
    };
    img.src = url;
    return () => { img.src = ''; };
  }, [url]);
  return { image, loading, error };
}

// -----------------------------------------------------------------------------
// Sub-components (inline to keep single file)
// -----------------------------------------------------------------------------

function TextEditor({
  zone,
  content,
  onChange,
  allowedFonts,
  allowedColors,
}: {
  zone: ZoneConfig;
  content: ZoneContent | undefined;
  onChange: (c: ZoneContent) => void;
  allowedFonts?: string[];
  allowedColors?: string[];
}) {
  const fonts = allowedFonts?.length ? allowedFonts : zone.allowedFonts ?? DEFAULT_FONTS;
  const colors = allowedColors?.length ? allowedColors : zone.allowedColors ?? DEFAULT_COLORS;
  const c = content?.type === 'text' ? content : { type: 'text' as const, text: 'Your text', fontSize: 24, fontFamily: fonts[0], fill: colors[0], fontStyle: 'normal', align: 'left' };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">Text</Label>
        <Input
          value={c.text ?? ''}
          onChange={(e) => onChange({ ...c, text: e.target.value })}
          placeholder="Enter text"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Font</Label>
        <Select value={c.fontFamily ?? fonts[0]} onValueChange={(v) => onChange({ ...c, fontFamily: v })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Size</Label>
        <Slider
          value={[c.fontSize ?? 24]}
          onValueChange={([v]) => onChange({ ...c, fontSize: v })}
          min={8}
          max={72}
          step={2}
          className="mt-2"
        />
        <span className="text-xs text-muted-foreground">{c.fontSize ?? 24}px</span>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Color</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className={cn('w-8 h-8 rounded-md border-2 transition', c.fill === color ? 'border-primary scale-110' : 'border-transparent')}
              style={{ backgroundColor: color }}
              onClick={() => onChange({ ...c, fill: color })}
              aria-label={`Color ${color}`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" variant={c.fontStyle?.includes('bold') ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => onChange({ ...c, fontStyle: c.fontStyle === 'bold' ? 'normal' : 'bold' })}><Bold className="h-4 w-4" /></Button>
        <Button type="button" variant={c.fontStyle?.includes('italic') ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => onChange({ ...c, fontStyle: c.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic className="h-4 w-4" /></Button>
        <Button type="button" variant={c.fontStyle?.includes('underline') ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => onChange({ ...c, fontStyle: c.fontStyle === 'underline' ? 'normal' : 'underline' })}><Underline className="h-4 w-4" /></Button>
      </div>
      <div className="flex gap-1">
        <Button type="button" variant={c.align === 'left' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => onChange({ ...c, align: 'left' })}><AlignLeft className="h-4 w-4" /></Button>
        <Button type="button" variant={c.align === 'center' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => onChange({ ...c, align: 'center' })}><AlignCenter className="h-4 w-4" /></Button>
        <Button type="button" variant={c.align === 'right' ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => onChange({ ...c, align: 'right' })}><AlignRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function ImageUploader({
  zone,
  content,
  onChange,
  onResolutionWarning,
}: {
  zone: ZoneConfig;
  content: ZoneContent | undefined;
  onChange: (c: ZoneContent) => void;
  onResolutionWarning: (warn: boolean) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [warning, setWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const tooSmall = img.width < MIN_IMAGE_WIDTH || img.height < MIN_IMAGE_HEIGHT;
        setWarning(tooSmall);
        onResolutionWarning(tooSmall);
        onChange({ type: 'image', src: url, fit: content?.type === 'image' ? content.fit ?? 'fit' : 'fit' });
      };
      img.src = url;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, content?.fit, onResolutionWarning]
  );

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f?.type.startsWith('image/')) handleFile(f);
        }}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">Drag & drop or click to upload</p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Choose file</Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      {content?.type === 'image' && content.src && (
        <div>
          <Label className="text-xs text-muted-foreground">Placement</Label>
          <div className="flex gap-2 mt-2">
            {(['fit', 'fill', 'center'] as const).map((fit) => (
              <Button key={fit} type="button" variant={content.fit === fit ? 'default' : 'outline'} size="sm" onClick={() => onChange({ ...content, fit })}>{fit}</Button>
            ))}
          </div>
        </div>
      )}
      {warning && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Image may look blurry (min {MIN_IMAGE_WIDTH}×{MIN_IMAGE_HEIGHT}px recommended).
        </p>
      )}
    </div>
  );
}

function ClipartGallery({ onSelect }: { onSelect: (url: string, name: string) => void }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    let items: { id: string; url: string; name: string; cat: string }[] = [];
    Object.values(CLIPART_CATEGORIES).forEach((cat) => {
      cat.items.forEach((item) => items.push({ ...item, cat: cat.name }));
    });
    if (search.trim()) items = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clipart…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>
      <ScrollArea className="h-48">
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className="border rounded-md p-2 hover:bg-muted flex flex-col items-center text-xs"
              onClick={() => item.url && onSelect(item.url, item.name)}
            >
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground">{item.cat}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function PriceSummary({
  priceBreakdown,
  total,
  currency,
}: {
  priceBreakdown: PriceItem[];
  total: number;
  currency: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Price</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {priceBreakdown.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span>{item.amount.toFixed(2)} {currency}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold pt-2 border-t">
          <span>Total</span>
          <AnimatedCounter key={total} end={total} prefix="" suffix={` ${currency}`} decimals={2} duration={300} />
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Canvas zone rect (idle / hover / active)
// -----------------------------------------------------------------------------

function ZoneRect({
  zone,
  isHovered,
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  zone: ZoneConfig;
  isHovered: boolean;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <Group onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} listening>
      <Rect
        x={zone.x}
        y={zone.y}
        width={zone.width}
        height={zone.height}
        stroke={isActive ? 'hsl(var(--primary))' : isHovered ? 'hsl(var(--primary) / 0.8)' : '#94a3b8'}
        strokeWidth={isActive ? 2 : isHovered ? 1.5 : 1}
        dash={isActive || isHovered ? undefined : [6, 4]}
        fill="transparent"
        listening
      />
      {!isActive && (
        <Group listening={false}>
          <Rect x={zone.x} y={zone.y} width={zone.width} height={20} fill="rgba(0,0,0,0.5)" />
          <Text x={zone.x + 4} y={zone.y + 2} text={zone.name} fontSize={10} fill="white" />
        </Group>
      )}
    </Group>
  );
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export function ClientCustomizer({
  customizerId,
  productName,
  productImageUrl,
  canvasWidth,
  canvasHeight,
  zones,
  basePrice,
  currency,
  pricingEnabled,
  allowedFonts,
  onAddToCart,
}: ClientCustomizerProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [zoneContents, setZoneContents] = useState<Record<string, ZoneContent>>({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolutionWarn, setResolutionWarn] = useState(false);

  const setCanvasSize = useCanvasStore((s) => s.setCanvasSize);
  const setStageRef = useCanvasStore((s) => s.setStageRef);
  const zoom = useCanvasStore((s) => s.zoom);
  const panX = useCanvasStore((s) => s.panX);
  const panY = useCanvasStore((s) => s.panY);

  const layers = useLayersStore((s) => s.layers);

  const { calculatedPrice, priceBreakdown, updatePrice, startSession } = useSessionStore();
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const select = useSelectionStore((s) => s.select);
  const deselectAll = useSelectionStore((s) => s.deselectAll);
  const setHovered = useSelectionStore((s) => s.setHovered);

  const { image: productImage, loading: imageLoading, error: imageError } = useLoadedImage(productImageUrl);

  useEffect(() => {
    setCanvasSize(canvasWidth, canvasHeight);
  }, [canvasWidth, canvasHeight, setCanvasSize]);

  useEffect(() => {
    startSession(customizerId);
  }, [customizerId, startSession]);

  useEffect(() => {
    if (stageRef.current) setStageRef(stageRef.current);
    return () => setStageRef(null);
  }, [setStageRef]);

  useEffect(() => {
    const stage = stageRef.current;
    const tr = transformerRef.current;
    if (!stage || !tr || selectedIds.length === 0) {
      if (tr) tr.nodes([]);
      return;
    }
    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];
    if (nodes.length) {
      tr.nodes(nodes);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedIds]);

  // Compute price from base + zones with content
  useEffect(() => {
    if (!pricingEnabled) return;
    const breakdown: PriceItem[] = [{ id: 'base', label: 'Base price', amount: basePrice, type: 'base' }];
    let total = basePrice;
    zones.forEach((z) => {
      const hasContent = zoneContents[z.id];
      if (hasContent && z.priceModifier) {
        total += z.priceModifier;
        breakdown.push({ id: z.id, label: z.name, amount: z.priceModifier, type: 'image' });
      }
    });
    updatePrice(total, breakdown);
  }, [basePrice, zones, zoneContents, pricingEnabled, updatePrice]);

  const activeZone = activeZoneId ? zones.find((z) => z.id === activeZoneId) : null;
  const activeContent = activeZoneId ? zoneContents[activeZoneId] : undefined;

  const setZoneContent = useCallback((zoneId: string, content: ZoneContent) => {
    setZoneContents((prev) => ({ ...prev, [zoneId]: content }));
    setError(null);
  }, []);

  const handleAddToCart = useCallback(async () => {
    setIsAddingToCart(true);
    setError(null);
    try {
      const stage = stageRef.current;
      let thumbnailUrl: string | undefined;
      if (stage) {
        try {
          thumbnailUrl = stage.toDataURL({ pixelRatio: 0.5 });
        } catch {
          // ignore
        }
      }
      const canvasData = { zones: zoneContents, layers };
      await Promise.resolve(onAddToCart({ canvasData, price: calculatedPrice, thumbnailUrl }));
    } catch (err) {
      logger.error('Add to cart failed', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  }, [onAddToCart, zoneContents, layers, calculatedPrice]);

  const scale = Math.min(zoom, 1);
  const stageScale = scale;

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[400px] w-full">
      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 p-4 overflow-auto">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {imageError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm z-10">
            <AlertCircle className="h-4 w-4" /> Failed to load product image
          </div>
        )}
        <Stage
          ref={stageRef}
          width={Math.min(canvasWidth * stageScale, typeof window !== 'undefined' ? window.innerWidth - 360 : 800)}
          height={Math.min(canvasHeight * stageScale, typeof window !== 'undefined' ? 500 : 500)}
          scaleX={stageScale}
          scaleY={stageScale}
          onClick={(e) => {
            if (e.target === e.target.getStage()) deselectAll();
          }}
        >
          <Layer>
            {productImage && (
              <Rect
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                fillPatternImage={productImage}
                fillPatternRepeat="no-repeat"
                fillPatternScaleX={canvasWidth / productImage.width}
                fillPatternScaleY={canvasHeight / productImage.height}
              />
            )}
            {!productImage && <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#f1f5f9" />}
          </Layer>
          <Layer>
            {zones.map((zone) => (
              <ZoneRect
                key={zone.id}
                zone={zone}
                isHovered={hoveredZoneId === zone.id}
                isActive={activeZoneId === zone.id}
                onClick={() => { setActiveZoneId(zone.id); setHoveredZoneId(null); }}
                onMouseEnter={() => { setHoveredZoneId(zone.id); setHovered(zone.id); }}
                onMouseLeave={() => { setHoveredZoneId(null); setHovered(null); }}
              />
            ))}
          </Layer>
          <Layer>
            {zones.map((zone) => {
              const content = zoneContents[zone.id];
              if (!content) return null;
              if (content.type === 'text' && content.text) {
                const nodeId = `text-${zone.id}`;
                return (
                  <Text
                    key={nodeId}
                    id={nodeId}
                    x={zone.x + 8}
                    y={zone.y + zone.height / 2 - (content.fontSize ?? 24) / 2}
                    text={content.text}
                    fontSize={content.fontSize ?? 24}
                    fontFamily={content.fontFamily ?? 'Arial'}
                    fill={content.fill ?? '#000'}
                    fontStyle={
                      content.fontStyle?.includes('bold') && content.fontStyle?.includes('italic')
                        ? 'bold italic'
                        : content.fontStyle?.includes('bold')
                          ? 'bold'
                          : content.fontStyle?.includes('italic')
                            ? 'italic'
                            : 'normal'
                    }
                    textDecoration={content.fontStyle?.includes('underline') ? 'underline' : undefined}
                    align={content.align ?? 'left'}
                    width={zone.width - 16}
                    listening
                    onClick={(e) => { e.cancelBubble = true; select(nodeId); }}
                  />
                );
              }
              if (content.type === 'image' && content.src) {
                const nodeId = `img-${zone.id}`;
                return (
                  <KonvaImage key={nodeId} id={nodeId} zone={zone} src={content.src!} fit={content.fit ?? 'fit'} onSelect={() => select(nodeId)} />
                );
              }
              return null;
            })}
          </Layer>
          {selectedIds.length > 0 && (
            <Layer>
              <Transformer ref={transformerRef} />
            </Layer>
          )}
        </Stage>
      </div>

      {/* Right panel */}
      <aside className="w-full lg:w-[320px] shrink-0 border-l bg-card flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Editing</h3>
            {activeZone ? (
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="layers">Layers</TabsTrigger>
                  <TabsTrigger value="clipart">Clipart</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="mt-3">
                  {activeZone.allowText && (activeZone.type === 'text' || activeZone.allowText) && (
                    <TextEditor
                      zone={activeZone}
                      content={activeContent?.type === 'text' ? activeContent : undefined}
                      onChange={(c) => setZoneContent(activeZone.id, c)}
                      allowedFonts={allowedFonts ?? activeZone.allowedFonts}
                      allowedColors={activeZone.allowedColors}
                    />
                  )}
                  {activeZone.allowImages && (activeZone.type === 'image' || activeZone.allowImages) && (
                    <ImageUploader
                      zone={activeZone}
                      content={activeContent?.type === 'image' ? activeContent : undefined}
                      onChange={(c) => setZoneContent(activeZone.id, c)}
                      onResolutionWarning={setResolutionWarn}
                    />
                  )}
                </TabsContent>
                <TabsContent value="layers" className="mt-3">
                  <ul className="space-y-1 text-sm">
                    {layers.filter((l) => l.zoneId === activeZone.id).map((l) => (
                      <li key={l.id} className="flex items-center justify-between py-1 px-2 rounded bg-muted/50">
                        <span>{l.name}</span>
                        <span className="text-muted-foreground capitalize">{l.type}</span>
                      </li>
                    ))}
                    {layers.filter((l) => l.zoneId === activeZone.id).length === 0 && (
                      <li className="text-muted-foreground text-sm">No elements in this zone</li>
                    )}
                  </ul>
                </TabsContent>
                <TabsContent value="clipart" className="mt-3">
                  <ClipartGallery onSelect={(url, name) => activeZoneId && setZoneContent(activeZoneId, { type: 'clipart', src: url })} />
                </TabsContent>
              </Tabs>
            ) : (
              <p className="text-sm text-muted-foreground">Click a zone on the canvas to edit.</p>
            )}

            {pricingEnabled && (
              <PriceSummary priceBreakdown={priceBreakdown} total={calculatedPrice} currency={currency} />
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={isAddingToCart}
              onClick={handleAddToCart}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to cart
                </>
              )}
            </Button>
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
}

// Konva Image that loads from URL and respects fit
function KonvaImage({
  id,
  zone,
  src,
  fit,
  onSelect,
}: {
  id: string;
  zone: ZoneConfig;
  src: string;
  fit: 'fit' | 'fill' | 'center';
  onSelect: () => void;
}) {
  const { image: img } = useLoadedImage(src);
  const [size, setSize] = useState({ w: zone.width, h: zone.height, x: zone.x, y: zone.y });

  useEffect(() => {
    if (!img) return;
    const iw = img.width;
    const ih = img.height;
    const zw = zone.width;
    const zh = zone.height;
    let w: number, h: number, x: number, y: number;
    if (fit === 'fill') {
      w = zw; h = zh; x = zone.x; y = zone.y;
    } else if (fit === 'center') {
      const s = Math.min(zw / iw, zh / ih);
      w = iw * s; h = ih * s;
      x = zone.x + (zw - w) / 2; y = zone.y + (zh - h) / 2;
    } else {
      const s = Math.min(zw / iw, zh / ih);
      w = iw * s; h = ih * s;
      x = zone.x + (zw - w) / 2; y = zone.y + (zh - h) / 2;
    }
    setSize({ w, h, x, y });
  }, [img, zone, fit]);

  if (!img) return null;
  return (
    /* eslint-disable-next-line jsx-a11y/alt-text */
    <Image
      id={id}
      image={img}
      x={size.x}
      y={size.y}
      width={size.w}
      height={size.h}
      listening
      onClick={(e) => { e.cancelBubble = true; onSelect(); }}
    />
  );
}
