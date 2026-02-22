'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Group, Transformer, Circle, Line, Text, Image } from 'react-konva';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  MousePointer2,
  Square,
  Circle as CircleIcon,
  Type,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Plus,
  Minus,
  Grid3x3,
  Undo2,
  Redo2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Settings,
} from 'lucide-react';

export interface ZoneData {
  id: string;
  name: string;
  type: string;
  shape?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  isVisible?: boolean;
  isLocked?: boolean;
  allowText?: boolean;
  allowImages?: boolean;
  allowShapes?: boolean;
  allowClipart?: boolean;
  maxElements?: number;
  priceModifier?: number;
  sortOrder?: number;
}

export interface ViewData {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface AdminZoneStudioProps {
  customizerId: string;
  zones: ZoneData[];
  views: ViewData[];
  canvasWidth: number;
  canvasHeight: number;
  productImageUrl?: string;
  onZoneAdd: (zone: Partial<ZoneData>) => void;
  onZoneUpdate: (zoneId: string, data: Partial<ZoneData>) => void;
  onZoneDelete: (zoneId: string) => void;
  onViewChange?: (viewId: string) => void;
}

const ZONE_COLORS = ['#3b82f680', '#8b5cf680', '#ec489980', '#10b98180', '#f59e0b80', '#06b6d480'];
const GRID_SIZE = 20;

export function AdminZoneStudio({
  customizerId,
  zones,
  views,
  canvasWidth,
  canvasHeight,
  productImageUrl,
  onZoneAdd,
  onZoneUpdate,
  onZoneDelete,
  onViewChange,
}: AdminZoneStudioProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'rect' | 'circle'>('select');
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentViewId, setCurrentViewId] = useState<string | null>(
    views.find((v) => v.isDefault)?.id ?? views[0]?.id ?? null
  );
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayZones = zones;
  const activeView = views.find((v) => v.id === currentViewId);
  const imageUrl = productImageUrl ?? activeView?.imageUrl ?? '';
  const selectedZone = displayZones.find((z) => z.id === selectedZoneId);

  useEffect(() => {
    if (!transformerRef.current || !selectedZoneId) {
      transformerRef.current?.nodes([]);
      return;
    }
    const stage = stageRef.current;
    if (!stage) return;
    const node = stage.findOne(`#zone-${selectedZoneId}`);
    if (node) transformerRef.current.nodes([node as Konva.Rect]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedZoneId, displayZones]);

  const snap = useCallback(
    (v: number) => (snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v),
    [snapToGrid]
  );

  const getZoneColor = useCallback((index: number) => ZONE_COLORS[index % ZONE_COLORS.length], []);

  const handleStageWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const scaleBy = 1.1;
      const stage = e.target.getStage();
      if (!stage) return;
      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = { x: (pointer.x - stagePos.x) / oldScale, y: (pointer.y - stagePos.y) / oldScale };
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const clamped = Math.max(0.2, Math.min(2, newScale));
      setScale(clamped);
      setStagePos({
        x: pointer.x - mousePointTo.x * clamped,
        y: pointer.y - mousePointTo.y * clamped,
      });
    },
    [scale, stagePos]
  );

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const x = (pos.x - stagePos.x) / scale;
      const y = (pos.y - stagePos.y) / scale;
      if (tool === 'select') {
        setSelectedZoneId(null);
        return;
      }
      if (tool === 'rect' || tool === 'circle') {
        setDrawStart({ x: snap(x), y: snap(y) });
        setDrawPreview({ x: snap(x), y: snap(y), w: 0, h: 0 });
      }
    },
    [tool, scale, stagePos, snap]
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!drawStart) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const x = (pos.x - stagePos.x) / scale;
      const y = (pos.y - stagePos.y) / scale;
      const sx = Math.min(drawStart.x, snap(x));
      const sy = Math.min(drawStart.y, snap(y));
      const w = Math.max(GRID_SIZE, Math.abs(snap(x) - drawStart.x));
      const h = Math.max(GRID_SIZE, Math.abs(snap(y) - drawStart.y));
      setDrawPreview({ x: sx, y: sy, w, h });
    },
    [drawStart, scale, stagePos, snap]
  );

  const handleStageMouseUp = useCallback(() => {
    if (!drawStart || !drawPreview) return;
    const w = Math.max(20, drawPreview.w);
    const h = Math.max(20, drawPreview.h);
    const newZone: Partial<ZoneData> = {
      name: `Zone ${displayZones.length + 1}`,
      type: 'text',
      shape: tool === 'circle' ? 'circle' : 'rect',
      x: drawPreview.x,
      y: drawPreview.y,
      width: w,
      height: h,
      rotation: 0,
      isVisible: true,
      isLocked: false,
      allowText: true,
      allowImages: true,
      allowShapes: true,
      allowClipart: false,
      maxElements: 10,
      sortOrder: displayZones.length,
    };
    onZoneAdd(newZone);
    setDrawStart(null);
    setDrawPreview(null);
    setTool('select');
  }, [drawStart, drawPreview, tool, displayZones.length, onZoneAdd]);

  const handleZoneSelect = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true;
    const id = e.target.name().replace('zone-', '');
    setSelectedZoneId(id);
  }, []);

  const handleZoneDragEnd = useCallback(
    (zoneId: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const x = snap(node.x());
      const y = snap(node.y());
      node.position({ x, y });
      onZoneUpdate(zoneId, { x, y });
    },
    [snap, onZoneUpdate]
  );

  const handleTransformEnd = useCallback(
    (zoneId: string) => (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const x = snap(node.x());
      const y = snap(node.y());
      const width = Math.max(20, node.width() * (node.scaleX() ?? 1));
      const height = Math.max(20, node.height() * (node.scaleY() ?? 1));
      const rotation = node.rotation();
      node.position({ x, y });
      node.scaleX(1);
      node.scaleY(1);
      node.width(width);
      node.height(height);
      onZoneUpdate(zoneId, { x, y, width, height, rotation });
    },
    [snap, onZoneUpdate]
  );

  const handleDelete = useCallback(() => {
    if (selectedZoneId) {
      onZoneDelete(selectedZoneId);
      setSelectedZoneId(null);
    }
  }, [selectedZoneId, onZoneDelete]);

  const handleDuplicate = useCallback(() => {
    if (!selectedZone) return;
    const { id, ...rest } = selectedZone;
    onZoneAdd({ ...rest, x: rest.x + 20, y: rest.y + 20 });
  }, [selectedZone, onZoneAdd]);

  const handleFitToCanvas = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const sx = width / canvasWidth;
    const sy = height / canvasHeight;
    const s = Math.min(sx, sy, 1.5);
    setScale(s);
    setStagePos({ x: (width - canvasWidth * s) / 2, y: (height - canvasHeight * s) / 2 });
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'v') setTool('select');
      if (e.key === 'r') setTool('rect');
      if (e.key === 'c') setTool('circle');
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      }
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleDelete, handleDuplicate]);

  const toggleZoneVisibility = useCallback(
    (zoneId: string) => {
      const z = displayZones.find((x) => x.id === zoneId);
      if (z) onZoneUpdate(zoneId, { isVisible: !z.isVisible });
    },
    [displayZones, onZoneUpdate]
  );

  const toggleZoneLock = useCallback(
    (zoneId: string) => {
      const z = displayZones.find((x) => x.id === zoneId);
      if (z) onZoneUpdate(zoneId, { isLocked: !z.isLocked });
    },
    [displayZones, onZoneUpdate]
  );

  const stageWidth = containerRef.current?.clientWidth ?? 800;
  const stageHeight = containerRef.current?.clientHeight ?? 600;

  return (
    <TooltipProvider>
      <div className="flex h-full w-full bg-muted/30">
        {/* Left panel */}
        <div
          className={cn(
            'flex flex-col border-r bg-card transition-all duration-200',
            leftOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
          )}
        >
          {leftOpen && (
            <>
              <div className="flex items-center justify-between border-b p-2">
                <span className="font-medium">Views & Zones</span>
                <Button variant="ghost" size="icon" onClick={() => setLeftOpen(false)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-4">
                  <ViewSwitcher
                    views={views}
                    currentViewId={currentViewId}
                    onSelect={(id) => {
                      setCurrentViewId(id);
                      onViewChange?.(id);
                    }}
                  />
                  <Separator />
                  <ZonesList
                    zones={displayZones}
                    selectedZoneId={selectedZoneId}
                    onSelect={setSelectedZoneId}
                    onToggleVisibility={toggleZoneVisibility}
                    onToggleLock={toggleZoneLock}
                    getZoneColor={getZoneColor}
                  />
                  <Separator />
                  <LayersList zones={displayZones} selectedZoneId={selectedZoneId} onSelect={setSelectedZoneId} />
                </div>
              </ScrollArea>
            </>
          )}
          {!leftOpen && (
            <Button variant="ghost" size="icon" className="absolute left-0 top-4 z-10" onClick={() => setLeftOpen(true)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Center: Stage + toolbar + bottom bar */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center gap-1 border-b bg-card p-1">
            <Toolbar tool={tool} onToolChange={setTool} onDelete={handleDelete} onDuplicate={handleDuplicate} />
          </div>
          <div ref={containerRef} className="flex-1 overflow-hidden relative">
            <Stage
              ref={stageRef}
              width={stageWidth}
              height={stageHeight}
              scaleX={scale}
              scaleY={scale}
              x={stagePos.x}
              y={stagePos.y}
              onWheel={handleStageWheel}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              onMouseLeave={handleStageMouseUp}
              draggable={tool === 'select'}
              onDragEnd={(e) => {
                const newPos = e.target.position();
                setStagePos({ x: newPos.x, y: newPos.y });
              }}
            >
              <Layer>
                {imageUrl && (
                  <StageBackgroundImage
                    src={imageUrl}
                    width={canvasWidth}
                    height={canvasHeight}
                  />
                )}
                {showGrid && <GridLayer width={canvasWidth} height={canvasHeight} size={GRID_SIZE} />}
                {displayZones
                  .filter((z) => z.isVisible !== false)
                  .map((zone, i) => (
                    <ZoneRect
                      key={zone.id}
                      zone={zone}
                      color={getZoneColor(i)}
                      isSelected={zone.id === selectedZoneId}
                      isLocked={zone.isLocked}
                      onSelect={handleZoneSelect}
                      onDragEnd={handleZoneDragEnd(zone.id)}
                      onTransformEnd={handleTransformEnd(zone.id)}
                    />
                  ))}
                {drawPreview && (
                  <Rect
                    x={drawPreview.x}
                    y={drawPreview.y}
                    width={drawPreview.w}
                    height={drawPreview.h}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dash={[4, 4]}
                    listening={false}
                  />
                )}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) return oldBox;
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
          <BottomBar
            scale={scale}
            onZoomIn={() => setScale((s) => Math.min(2, s * 1.2))}
            onZoomOut={() => setScale((s) => Math.max(0.2, s / 1.2))}
            onFit={handleFitToCanvas}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid((g) => !g)}
            snapToGrid={snapToGrid}
            onToggleSnap={() => setSnapToGrid((s) => !s)}
            hasUnsavedChanges={hasUnsavedChanges}
            selectedZone={selectedZone}
          />
        </div>

        {/* Right panel */}
        <div
          className={cn(
            'flex flex-col border-l bg-card transition-all duration-200',
            rightOpen ? 'w-[320px]' : 'w-0 overflow-hidden'
          )}
        >
          {rightOpen && (
            <>
              <div className="flex items-center justify-between border-b p-2">
                <span className="font-medium">Properties</span>
                <Button variant="ghost" size="icon" onClick={() => setRightOpen(false)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {selectedZone ? (
                    <ZonePropertiesPanel
                      zone={selectedZone}
                      onUpdate={(data) => onZoneUpdate(selectedZone.id, data)}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground py-8 text-center">
                      Select a zone to edit properties
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
          {!rightOpen && (
            <Button variant="ghost" size="icon" className="absolute right-0 top-4 z-10" onClick={() => setRightOpen(true)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function StageBackgroundImage({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => setImg(image);
    image.src = src;
    return () => {
      image.onload = null;
      image.src = '';
    };
  }, [src]);
  if (!img) return null;
  return (
    /* eslint-disable-next-line jsx-a11y/alt-text */
    <Image image={img} width={width} height={height} listening={false} />
  );
}

function GridLayer({ width, height, size }: { width: number; height: number; size: number }) {
  const lines: React.ReactNode[] = [];
  for (let i = 0; i <= width; i += size) {
    lines.push(<Line key={`v-${i}`} points={[i, 0, i, height]} stroke="#e5e7eb" strokeWidth={0.5} listening={false} />);
  }
  for (let j = 0; j <= height; j += size) {
    lines.push(<Line key={`h-${j}`} points={[0, j, width, j]} stroke="#e5e7eb" strokeWidth={0.5} listening={false} />);
  }
  return <Group listening={false}>{lines}</Group>;
}

function ZoneRect({
  zone,
  color,
  isSelected,
  isLocked,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: {
  zone: ZoneData;
  color: string;
  isSelected: boolean;
  isLocked?: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}) {
  const isCircle = zone.shape === 'circle';
  const cx = zone.width / 2;
  const cy = zone.height / 2;
  const radius = Math.min(zone.width, zone.height) / 2;
  return (
    <Group
      name={`zone-${zone.id}`}
      x={zone.x}
      y={zone.y}
      rotation={zone.rotation ?? 0}
      draggable={!isLocked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    >
      {isCircle ? (
        <Circle x={cx} y={cy} radius={radius} fill={color} stroke={isSelected ? '#2563eb' : '#64748b'} strokeWidth={isSelected ? 3 : 1} />
      ) : (
        <Rect x={0} y={0} width={zone.width} height={zone.height} fill={color} stroke={isSelected ? '#2563eb' : '#64748b'} strokeWidth={isSelected ? 3 : 1} />
      )}
      <Text x={4} y={4} text={zone.name} fontSize={12} fill="#fff" listening={false} width={Math.max(0, zone.width - 8)} />
    </Group>
  );
}

function ViewSwitcher({
  views,
  currentViewId,
  onSelect,
}: {
  views: ViewData[];
  currentViewId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Views</Label>
      <div className="grid grid-cols-2 gap-2">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={cn(
              'relative aspect-square rounded border-2 overflow-hidden bg-muted',
              currentViewId === v.id ? 'border-primary' : 'border-transparent'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v.thumbnailUrl ?? v.imageUrl}
              alt={v.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
              {v.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ZonesList({
  zones,
  selectedZoneId,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  getZoneColor,
}: {
  zones: ZoneData[];
  selectedZoneId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  getZoneColor: (i: number) => string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Zones</Label>
      <div className="space-y-1">
        {zones.map((z, i) => (
          <div
            key={z.id}
            className={cn(
              'flex items-center gap-2 rounded p-2 cursor-pointer border',
              selectedZoneId === z.id ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted/50'
            )}
            onClick={() => onSelect(z.id)}
          >
            <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: getZoneColor(i) }} />
            <span className="flex-1 truncate text-sm">{z.name}</span>
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(z.id);
                }}
              >
                {z.isVisible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(z.id);
                }}
              >
                {z.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LayersList({
  zones,
  selectedZoneId,
  onSelect,
}: {
  zones: ZoneData[];
  selectedZoneId: string | null;
  onSelect: (id: string) => void;
}) {
  const sorted = [...zones].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return (
    <div className="space-y-2">
      <Label className="text-xs flex items-center gap-1">
        <Layers className="h-3.5 w-3.5" /> Layers
      </Label>
      <div className="space-y-0.5">
        {sorted.map((z, i) => (
          <div
            key={z.id}
            className={cn(
              'flex items-center gap-2 rounded px-2 py-1.5 text-sm cursor-pointer',
              selectedZoneId === z.id ? 'bg-primary/10' : 'hover:bg-muted/50'
            )}
            onClick={() => onSelect(z.id)}
          >
            <span className="text-muted-foreground w-5">{sorted.length - i}</span>
            <span className="truncate flex-1">{z.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toolbar({
  tool,
  onToolChange,
  onDelete,
  onDuplicate,
}: {
  tool: 'select' | 'rect' | 'circle';
  onToolChange: (t: 'select' | 'rect' | 'circle') => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={tool === 'select' ? 'secondary' : 'ghost'} size="icon" onClick={() => onToolChange('select')}>
            <MousePointer2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Select (V)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={tool === 'rect' ? 'secondary' : 'ghost'} size="icon" onClick={() => onToolChange('rect')}>
            <Square className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add rect zone (R)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={tool === 'circle' ? 'secondary' : 'ghost'} size="icon" onClick={() => onToolChange('circle')}>
            <CircleIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add circle zone (C)</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="h-6" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Duplicate (Ctrl+D)</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="h-6" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" disabled title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" disabled title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
      </Tooltip>
    </>
  );
}

function BottomBar({
  scale,
  onZoomIn,
  onZoomOut,
  onFit,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  hasUnsavedChanges,
  selectedZone,
}: {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  hasUnsavedChanges: boolean;
  selectedZone: ZoneData | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t bg-card px-3 py-1.5 text-sm">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomOut}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-12 tabular-nums">{Math.round(scale * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomIn}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onFit}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to canvas</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-4" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={showGrid ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={onToggleGrid}>
              <Grid3x3 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle grid</TooltipContent>
        </Tooltip>
        <Button variant={snapToGrid ? 'secondary' : 'ghost'} size="sm" className="h-7" onClick={onToggleSnap}>
          Snap
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {selectedZone && (
          <Badge variant="outline">
            {selectedZone.name} · {Math.round(selectedZone.x)},{Math.round(selectedZone.y)}
          </Badge>
        )}
        <Badge variant={hasUnsavedChanges ? 'secondary' : 'outline'}>
          {hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
        </Badge>
      </div>
    </div>
  );
}

function ZonePropertiesPanel({ zone, onUpdate }: { zone: ZoneData; onUpdate: (data: Partial<ZoneData>) => void }) {
  const [name, setName] = useState(zone.name);
  const [type, setType] = useState(zone.type);
  const [x, setX] = useState(zone.x);
  const [y, setY] = useState(zone.y);
  const [width, setWidth] = useState(zone.width);
  const [height, setHeight] = useState(zone.height);
  const [rotation, setRotation] = useState(zone.rotation ?? 0);
  const [allowText, setAllowText] = useState(zone.allowText ?? true);
  const [allowImages, setAllowImages] = useState(zone.allowImages ?? true);
  const [allowShapes, setAllowShapes] = useState(zone.allowShapes ?? true);
  const [allowClipart, setAllowClipart] = useState(zone.allowClipart ?? false);
  const [maxElements, setMaxElements] = useState(zone.maxElements ?? 10);
  const [priceModifier, setPriceModifier] = useState(zone.priceModifier ?? 0);

  useEffect(() => {
    setName(zone.name);
    setType(zone.type);
    setX(zone.x);
    setY(zone.y);
    setWidth(zone.width);
    setHeight(zone.height);
    setRotation(zone.rotation ?? 0);
    setAllowText(zone.allowText ?? true);
    setAllowImages(zone.allowImages ?? true);
    setAllowShapes(zone.allowShapes ?? true);
    setAllowClipart(zone.allowClipart ?? false);
    setMaxElements(zone.maxElements ?? 10);
    setPriceModifier(zone.priceModifier ?? 0);
  }, [zone.id, zone.name, zone.type, zone.x, zone.y, zone.width, zone.height, zone.rotation, zone.allowText, zone.allowImages, zone.allowShapes, zone.allowClipart, zone.maxElements, zone.priceModifier]);

  const apply = useCallback(() => {
    onUpdate({
      name,
      type,
      x,
      y,
      width,
      height,
      rotation,
      allowText,
      allowImages,
      allowShapes,
      allowClipart,
      maxElements,
      priceModifier,
    });
  }, [onUpdate, name, type, x, y, width, height, rotation, allowText, allowImages, allowShapes, allowClipart, maxElements, priceModifier]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={apply} />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => { setType(v); onUpdate({ type: v }); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="shape">Shape</SelectItem>
            <SelectItem value="clipart">Clipart</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>X</Label>
          <Input type="number" value={x} onChange={(e) => setX(Number(e.target.value))} onBlur={apply} />
        </div>
        <div className="space-y-1">
          <Label>Y</Label>
          <Input type="number" value={y} onChange={(e) => setY(Number(e.target.value))} onBlur={apply} />
        </div>
        <div className="space-y-1">
          <Label>Width</Label>
          <Input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} onBlur={apply} />
        </div>
        <div className="space-y-1">
          <Label>Height</Label>
          <Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} onBlur={apply} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Rotation</Label>
        <Input type="number" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} onBlur={apply} />
      </div>
      <Separator />
      <div className="space-y-3">
        <Label className="flex items-center gap-1"><Settings className="h-3.5 w-3.5" /> Constraints</Label>
        <div className="flex items-center justify-between">
          <span className="text-sm">Allow text</span>
          <Switch checked={allowText} onCheckedChange={(v) => { setAllowText(v); onUpdate({ allowText: v }); }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Allow images</span>
          <Switch checked={allowImages} onCheckedChange={(v) => { setAllowImages(v); onUpdate({ allowImages: v }); }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Allow shapes</span>
          <Switch checked={allowShapes} onCheckedChange={(v) => { setAllowShapes(v); onUpdate({ allowShapes: v }); }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Allow clipart</span>
          <Switch checked={allowClipart} onCheckedChange={(v) => { setAllowClipart(v); onUpdate({ allowClipart: v }); }} />
        </div>
        <div className="space-y-1">
          <Label>Max elements</Label>
          <Input type="number" min={1} value={maxElements} onChange={(e) => setMaxElements(Number(e.target.value) || 1)} onBlur={apply} />
        </div>
        <div className="space-y-1">
          <Label>Price modifier</Label>
          <Input type="number" step={0.01} value={priceModifier} onChange={(e) => setPriceModifier(Number(e.target.value) || 0)} onBlur={apply} />
        </div>
      </div>
    </div>
  );
}
