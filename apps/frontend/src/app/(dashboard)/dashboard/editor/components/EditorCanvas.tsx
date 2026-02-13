/**
 * Konva-based canvas for the visual editor (client-only, dynamic import)
 */

'use client';

import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import type Konva from 'konva';
import type { CanvasObject, Layer } from '../types';

/** Konva transformer bound box (x, y, width, height, rotation) */
interface KonvaBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface EditorCanvasProps {
  objects: CanvasObject[];
  selectedId: string | null;
  zoom: number;
  showGrid: boolean;
  showGuides: boolean;
  onSelect: (id: string | null) => void;
  onObjectChange: (id: string, attrs: Partial<CanvasObject>) => void;
  stageRef: React.MutableRefObject<{ toDataURL: (opts?: { mimeType?: string; quality?: number }) => string } | null>;
}

function EditorCanvasInner({
  objects,
  selectedId,
  zoom,
  showGrid,
  showGuides,
  onSelect,
  onObjectChange,
  stageRef,
}: EditorCanvasProps) {
  const nodeRefsMap = useRef<Record<string, Konva.Node>>({});
  const trRef = useRef<Konva.Transformer | null>(null);

  type KonvaComponents = {
    Stage: React.ComponentType<Record<string, unknown>>;
    Layer: React.ComponentType<Record<string, unknown>>;
    Rect: React.ComponentType<Record<string, unknown>>;
    Circle: React.ComponentType<Record<string, unknown>>;
    Text: React.ComponentType<Record<string, unknown>>;
    Image: React.ComponentType<Record<string, unknown>>;
    Line: React.ComponentType<Record<string, unknown>>;
    Arrow: React.ComponentType<Record<string, unknown>>;
    Star: React.ComponentType<Record<string, unknown>>;
    Transformer: React.ComponentType<Record<string, unknown>>;
    Group: React.ComponentType<Record<string, unknown>>;
  };
  const [Konva, setKonva] = useState<KonvaComponents | null>(null);

  useEffect(() => {
    Promise.all([
      import('react-konva').then((m) => m.Stage),
      import('react-konva').then((m) => m.Layer),
      import('react-konva').then((m) => m.Rect),
      import('react-konva').then((m) => m.Circle),
      import('react-konva').then((m) => m.Text),
      import('react-konva').then((m) => m.Image),
      import('react-konva').then((m) => m.Line),
      import('react-konva').then((m) => m.Arrow),
      import('react-konva').then((m) => m.Star),
      import('react-konva').then((m) => m.Transformer),
      import('react-konva').then((m) => m.Group),
    ]).then(([Stage, Layer, Rect, Circle, Text, Image, Line, Arrow, Star, Transformer, Group]) => {
      setKonva({
        Stage: Stage as KonvaComponents['Stage'],
        Layer: Layer as KonvaComponents['Layer'],
        Rect: Rect as KonvaComponents['Rect'],
        Circle: Circle as KonvaComponents['Circle'],
        Text: Text as KonvaComponents['Text'],
        Image: Image as unknown as KonvaComponents['Image'],
        Line: Line as unknown as KonvaComponents['Line'],
        Arrow: Arrow as unknown as KonvaComponents['Arrow'],
        Star: Star as unknown as KonvaComponents['Star'],
        Transformer: Transformer as KonvaComponents['Transformer'],
        Group: Group as KonvaComponents['Group'],
      });
    });
  }, []);

  useEffect(() => {
    if (!selectedId || !trRef.current) return;
    const node = nodeRefsMap.current[selectedId];
    if (node) {
      trRef.current.nodes([node]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, objects]);

  if (!Konva) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const { Stage, Layer, Rect, Circle, Text, Image, Line, Arrow, Star, Transformer } = Konva;

  return (
    <div className="flex flex-1 overflow-auto bg-zinc-900 p-4">
      <div
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          position: 'relative',
          background: '#1a1a1a',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
      >
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        )}
        {showGuides && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-500/40" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-500/40" />
          </div>
        )}
        <Stage
          ref={(node: unknown) => {
            (stageRef as React.MutableRefObject<unknown>).current = node;
          }}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
            if (e.target === e.target.getStage()) onSelect(null);
          }}
          onTap={(e: Konva.KonvaEventObject<MouseEvent>) => {
            if (e.target === e.target.getStage()) onSelect(null);
          }}
        >
          <Layer>
            {objects
              .filter((o) => o.visible)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((obj) => (
                <React.Fragment key={obj.id}>
                  {obj.type === 'shape' && (
                    <ShapeNode
                      obj={obj}
                      nodeRef={(n: Konva.Node) => { nodeRefsMap.current[obj.id] = n; }}
                      isSelected={selectedId === obj.id}
                      onSelect={() => onSelect(obj.id)}
                      onChange={(attrs) => onObjectChange(obj.id, attrs)}
                      Rect={Rect}
                      Circle={Circle}
                      Line={Line}
                      Arrow={Arrow}
                      Star={Star}
                    />
                  )}
                  {obj.type === 'text' && (
                    <TextNode
                      obj={obj}
                      nodeRef={(n: Konva.Node) => { nodeRefsMap.current[obj.id] = n; }}
                      isSelected={selectedId === obj.id}
                      onSelect={() => onSelect(obj.id)}
                      onChange={(attrs) => onObjectChange(obj.id, attrs)}
                      Text={Text}
                    />
                  )}
                  {obj.type === 'image' && obj.src && (
                    <ImageNode
                      obj={obj}
                      nodeRef={(n: Konva.Node) => { nodeRefsMap.current[obj.id] = n; }}
                      isSelected={selectedId === obj.id}
                      onSelect={() => onSelect(obj.id)}
                      onChange={(attrs) => onObjectChange(obj.id, attrs)}
                      Image={Image}
                    />
                  )}
                  {obj.type === 'draw' && obj.points && obj.points.length >= 4 && (
                    <Line
                      points={obj.points}
                      stroke={obj.fill}
                      strokeWidth={obj.strokeWidth ?? 2}
                      lineCap="round"
                      lineJoin="round"
                      listening={false}
                    />
                  )}
                </React.Fragment>
              ))}
            {selectedId && (
              <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox: KonvaBox, newBox: KonvaBox) => {
                  const min = 20;
                  if (Math.abs(newBox.width) < min || Math.abs(newBox.height) < min) return oldBox;
                  return newBox;
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

const ShapeNode = memo(function ShapeNode({
  obj,
  nodeRef,
  isSelected,
  onSelect,
  onChange,
  Rect,
  Circle,
  Line,
  Arrow,
  Star,
}: {
  obj: CanvasObject;
  nodeRef: (n: Konva.Node) => void;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<CanvasObject>) => void;
  Rect: React.ComponentType<Record<string, unknown>>;
  Circle: React.ComponentType<Record<string, unknown>>;
  Line: React.ComponentType<Record<string, unknown>>;
  Arrow: React.ComponentType<Record<string, unknown>>;
  Star: React.ComponentType<Record<string, unknown>>;
}) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Line | Konva.Arrow | Konva.Star>(null);
  useEffect(() => { if (shapeRef.current) nodeRef(shapeRef.current); }, [nodeRef]);
  const kind = obj.shapeKind ?? 'rect';

  const common = {
    x: obj.x,
    y: obj.y,
    rotation: obj.rotation,
    opacity: obj.opacity,
    fill: obj.fill,
    stroke: obj.stroke ?? obj.fill,
    strokeWidth: obj.strokeWidth ?? 0,
    listening: !obj.locked,
    onClick: onSelect,
    onTap: onSelect,
    draggable: !obj.locked,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onChange({ x: e.target.x(), y: e.target.y() }),
    onTransformEnd: (_e: Konva.KonvaEventObject<Event>) => {
      const node = shapeRef.current;
      if (!node) return;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onChange({
        x: node.x(),
        y: node.y(),
        width: Math.max(10, obj.width * scaleX),
        height: Math.max(10, obj.height * scaleY),
        rotation: node.rotation(),
      });
    },
  };

  if (kind === 'rect') {
    return (
      <Rect
        ref={shapeRef}
        {...common}
        width={obj.width}
        height={obj.height}
        cornerRadius={((obj as Layer).data as { borderRadius?: number } | undefined)?.borderRadius ?? 0}
      />
    );
  }
  if (kind === 'circle') {
    const r = Math.min(obj.width, obj.height) / 2;
    return (
      <Circle
        ref={shapeRef}
        {...common}
        x={obj.x + r}
        y={obj.y + r}
        radius={r}
      />
    );
  }
  if (kind === 'line') {
    const pts = [0, obj.height / 2, obj.width, obj.height / 2];
    return <Line ref={shapeRef} {...common} points={pts} />;
  }
  if (kind === 'arrow') {
    const pts = [0, obj.height / 2, obj.width, obj.height / 2];
    return <Arrow ref={shapeRef} {...common} points={pts} pointerLength={10} pointerWidth={10} />;
  }
  if (kind === 'star') {
    const cx = obj.width / 2;
    const cy = obj.height / 2;
    const outer = Math.min(obj.width, obj.height) / 2;
    return (
      <Star
        ref={shapeRef}
        {...common}
        x={obj.x + cx}
        y={obj.y + cy}
        numPoints={5}
        innerRadius={outer * 0.4}
        outerRadius={outer}
      />
    );
  }
  return (
    <Rect
      ref={shapeRef}
      {...common}
      width={obj.width}
      height={obj.height}
    />
  );
});

const TextNode = memo(function TextNode({
  obj,
  nodeRef,
  isSelected,
  onSelect,
  onChange,
  Text,
}: {
  obj: CanvasObject;
  nodeRef: (n: Konva.Node) => void;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<CanvasObject>) => void;
  Text: React.ComponentType<Record<string, unknown>>;
}) {
  const textRef = useRef<Konva.Text>(null);
  useEffect(() => { if (textRef.current) nodeRef(textRef.current); }, [nodeRef]);
  return (
    <Text
      ref={textRef}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      height={obj.height}
      text={obj.text ?? 'Text'}
      fontSize={obj.fontSize ?? 24}
      fontFamily={obj.fontFamily ?? 'Arial'}
      fontStyle={obj.fontStyle ?? 'normal'}
      align={obj.align ?? 'left'}
      fill={obj.fill}
      rotation={obj.rotation}
      opacity={obj.opacity}
      listening={!obj.locked}
      draggable={!obj.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(_e: Konva.KonvaEventObject<Event>) => {
        const node = textRef.current;
        if (!node) return;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, obj.width * scaleX),
          height: Math.max(14, obj.height * scaleY),
          rotation: node.rotation(),
        });
      }}
    />
  );
});

const ImageNode = memo(function ImageNode({
  obj,
  nodeRef,
  isSelected,
  onSelect,
  onChange,
  Image,
}: {
  obj: CanvasObject;
  nodeRef: (n: Konva.Node) => void;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<CanvasObject>) => void;
  Image: React.ComponentType<Record<string, unknown>>;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const imageRef = useRef<Konva.Image>(null);
  useEffect(() => { if (imageRef.current) nodeRef(imageRef.current); }, [nodeRef]);

  useEffect(() => {
    if (!obj.src) return;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => setImg(image);
    image.src = obj.src;
  }, [obj.src]);

  if (!img) return null;

  return (
    <Image
      ref={imageRef}
      image={img}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      height={obj.height}
      rotation={obj.rotation}
      opacity={obj.opacity}
      listening={!obj.locked}
      draggable={!obj.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(_e: Konva.KonvaEventObject<Event>) => {
        const node = imageRef.current;
        if (!node) return;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, obj.width * scaleX),
          height: Math.max(20, obj.height * scaleY),
          rotation: node.rotation(),
        });
      }}
    />
  );
});

export const EditorCanvas = memo(function EditorCanvas(props: EditorCanvasProps) {
  if (typeof window === 'undefined') {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }
  return <EditorCanvasInner {...props} />;
});

export { CANVAS_WIDTH, CANVAS_HEIGHT };
