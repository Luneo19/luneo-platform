'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import Konva from 'konva';
import { useEditorState } from '../state/EditorState';
import { Transformer } from 'react-konva';

interface CanvasProps {
  width?: number;
  height?: number;
  backgroundImageUrl?: string;
  onStageClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onStageMouseDown?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onStageTouchStart?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  children?: React.ReactNode;
}

function Canvas({
  width = 800,
  height = 600,
  backgroundImageUrl,
  onStageClick,
  onStageMouseDown,
  onStageTouchStart,
  children,
}: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const designLayerRef = useRef<Konva.Layer>(null);
  const backgroundLayerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);

  const {
    canvasWidth,
    canvasHeight,
    zoom,
    panX,
    panY,
    showGrid,
    snapToGrid,
    gridSize,
    showRulers,
    showGuides,
    guides,
    selectedElement,
    setCanvasSize,
    setZoom,
    setPan,
    setSelectedElement,
    saveState,
  } = useEditorState();

  // Initialize canvas size
  useEffect(() => {
    setCanvasSize(width, height);
  }, [width, height, setCanvasSize]);

  // Load background image
  useEffect(() => {
    if (backgroundImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setBackgroundImage(img);
      };
      img.src = backgroundImageUrl;
    }
  }, [backgroundImageUrl]);

  // Optimisé: useMemo pour grid lines
  const gridLines = useMemo(() => {
    if (!showGrid) return [];
    
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    
    // Vertical lines
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      lines.push({
        x1: i,
        y1: 0,
        x2: i,
        y2: canvasHeight,
      });
    }
    
    // Horizontal lines
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      lines.push({
        x1: 0,
        y1: i,
        x2: canvasWidth,
        y2: i,
      });
    }
    
    return lines;
  }, [showGrid, canvasWidth, canvasHeight, gridSize]);

  // Handle stage events
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedElement(null);
    }
    onStageClick?.(e);
  }, [setSelectedElement, onStageClick]);

  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    onStageMouseDown?.(e);
  }, [onStageMouseDown]);

  const handleStageTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    onStageTouchStart?.(e);
  }, [onStageTouchStart]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
    setZoom(clampedScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setPan(newPos.x, newPos.y);
  }, [setZoom, setPan]);

  // Handle drag end to save state
  const handleDragEnd = useCallback(() => {
    const stage = stageRef.current;
    if (stage) {
      saveState(stage);
    }
  }, [saveState]);

  // Handle transform end to save state
  const handleTransformEnd = useCallback(() => {
    const stage = stageRef.current;
    if (stage) {
      saveState(stage);
    }
  }, [saveState]);

  // Snap to grid helper
  const snapToGridPosition = useCallback((pos: { x: number; y: number }) => {
    if (!snapToGrid) return pos;
    
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize,
    };
  }, [snapToGrid, gridSize]);

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedElement) {
      transformer.nodes([selectedElement]);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedElement]);

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
      {/* Rulers */}
      {showRulers && (
        <>
          {/* Horizontal ruler */}
          <div className="absolute top-0 left-8 h-6 bg-white border-b border-gray-300 flex items-center text-xs text-gray-600">
            {Array.from({ length: Math.ceil(canvasWidth / 50) }, (_, i) => (
              <div key={i} className="absolute" style={{ left: i * 50 }}>
                {i * 50}
              </div>
            ))}
          </div>
          
          {/* Vertical ruler */}
          <div className="absolute left-0 top-6 w-6 bg-white border-r border-gray-300 flex flex-col items-center text-xs text-gray-600">
            {Array.from({ length: Math.ceil(canvasHeight / 50) }, (_, i) => (
              <div key={i} className="absolute" style={{ top: i * 50 }}>
                {i * 50}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Canvas */}
      <div 
        className="absolute"
        style={{
          left: showRulers ? 24 : 0,
          top: showRulers ? 24 : 0,
        }}
      >
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={canvasHeight}
          scaleX={zoom}
          scaleY={zoom}
          x={panX}
          y={panY}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageTouchStart}
          onClick={handleStageClick}
          draggable
          dragBoundFunc={snapToGridPosition}
        >
          {/* Background Layer */}
          <Layer ref={backgroundLayerRef}>
            {/* Background Image */}
            {backgroundImage && (
              <Rect
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                fillPatternImage={backgroundImage}
                fillPatternScaleX={canvasWidth / backgroundImage.width}
                fillPatternScaleY={canvasHeight / backgroundImage.height}
              />
            )}
            
            {/* Grid */}
            {showGrid && gridLines.map((line, index) => (
              <Line
                key={index}
                points={[line.x1, line.y1, line.x2, line.y2]}
                stroke="#e5e7eb"
                strokeWidth={0.5}
                listening={false}
              />
            ))}
            
            {/* Guides */}
            {showGuides && guides.map((guide) => (
              <Line
                key={guide.id}
                points={
                  guide.type === 'horizontal'
                    ? [0, guide.position, canvasWidth, guide.position]
                    : [guide.position, 0, guide.position, canvasHeight]
                }
                stroke="#3b82f6"
                strokeWidth={1}
                dash={[5, 5]}
                listening={false}
              />
            ))}
          </Layer>

          {/* Design Layer */}
          <Layer ref={designLayerRef}>
            {children}
          </Layer>

          {/* Transformer Layer */}
          <Layer>
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransformEnd}
            />
          </Layer>
        </Stage>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <button
          onClick={() => setZoom(Math.min(5, zoom * 1.2))}
          className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
        >
          +
        </button>
        <button
          onClick={() => setZoom(Math.max(0.1, zoom / 1.2))}
          className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
        >
          −
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan(0, 0);
          }}
          className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-xs"
        >
          1:1
        </button>
      </div>

      {/* Zoom Level Display */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded px-2 py-1 text-sm">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

export default memo(Canvas);
