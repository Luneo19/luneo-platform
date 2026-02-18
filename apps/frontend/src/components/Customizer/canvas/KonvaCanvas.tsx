'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Group, Rect, Text, Image, Circle, Ellipse, Line, Star, Arrow, Transformer } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore, useSelectionStore, useLayersStore, useCustomizerStore } from '@/stores/customizer';
import { useCustomizerContext } from '../core/CustomizerProvider';
import { GridOverlay } from './GridOverlay';
import { SafeZoneOverlay } from './SafeZoneOverlay';
import { RulersOverlay } from './RulersOverlay';
import { SelectionInfo } from './SelectionInfo';
import { useTool } from '@/hooks/customizer';

/**
 * KonvaCanvas - Main canvas component using react-konva
 * Handles rendering, mouse events, keyboard shortcuts, and touch support
 */
export function KonvaCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<any>(null);
  const { engine } = useCustomizerContext();
  const { setStageRef, zoom, panX, panY, setZoom, setPan, canvasWidth, canvasHeight, showGrid, showRulers, showSafeZone } =
    useCanvasStore();
  const { selectedIds, select, deselectAll } = useSelectionStore();
  const layers = useLayersStore((state) => state.layers);
  const { activeTool } = useTool();
  const config = useCustomizerStore((state) => state.config);
  const zones = config?.zones || [];

  // Initialize stage ref
  useEffect(() => {
    if (stageRef.current) {
      setStageRef(stageRef.current);
      if (engine) {
        engine.initialize(stageRef.current);
      }
    }
  }, [stageRef, setStageRef, engine]);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || selectedIds.length === 0) {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    const selectedNodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((node) => node !== null) as Konva.Node[];

    if (selectedNodes.length > 0 && transformerRef.current) {
      transformerRef.current.nodes(selectedNodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds]);

  // Handle stage click
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      deselectAll();
      return;
    }

    const clickedObject = e.target;
    const objectId = clickedObject.id();

    // Find layer item by ID
    const layerItem = layers.find((layer) => layer.id === objectId);
    if (layerItem) {
      select(objectId);
    }

    // Handle tool-specific clicks
    if (activeTool === 'text' && clickedOnEmpty) {
      // TODO: Add text at click position
      const pointerPos = e.target.getStage()?.getPointerPosition();
      if (pointerPos) {
        // Add text implementation needed
      }
    }
  };

  // Handle stage drag
  const handleStageDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (activeTool === 'select' && selectedIds.length > 0) {
      // Move selected objects
      const node = e.target;
      const { updateLayer } = useLayersStore.getState();
      selectedIds.forEach((id) => {
        const layer = layers.find((l) => l.id === id);
        if (layer) {
          updateLayer(id, {
            metadata: {
              ...layer.metadata,
              x: node.x(),
              y: node.y(),
            },
          });
        }
      });
    } else if (activeTool === 'select') {
      // Pan canvas
      const stage = e.target.getStage();
      if (stage) {
        const newPos = stage.position();
        setPan(newPos.x, newPos.y);
      }
    }
  };

  // Handle wheel zoom
  const handleWheelEvent = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.1;
    const oldScale = zoom;
    const mousePointTo = {
      x: (pointer.x - panX) / oldScale,
      y: (pointer.y - panY) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.1, Math.min(4, newScale));

    setZoom(clampedScale);
    setPan(pointer.x - mousePointTo.x * clampedScale, pointer.y - mousePointTo.y * clampedScale);
  };

  // Render object based on type
  const renderObject = (layer: typeof layers[0]) => {
    const metadata = (layer.metadata || {}) as Record<string, unknown>;
    const commonProps = {
      id: layer.id,
      x: (metadata.x as number) || 0,
      y: (metadata.y as number) || 0,
      rotation: (metadata.rotation as number) || 0,
      scaleX: (metadata.scaleX as number) || 1,
      scaleY: (metadata.scaleY as number) || 1,
      opacity: layer.opacity || 1,
      draggable: activeTool === 'select' && !layer.isLocked,
      visible: layer.isVisible,
    };

    switch (layer.type) {
      case 'text':
        return (
          <Text
            {...commonProps}
            text={(metadata.text as string) || ''}
            fontSize={(metadata.fontSize as number) || 24}
            fontFamily={(metadata.fontFamily as string) || 'Arial'}
            fill={(metadata.fill as string) || '#000000'}
            align={(metadata.align as string) || 'left'}
            verticalAlign={(metadata.verticalAlign as string) || 'top'}
            fontStyle={(metadata.fontStyle as string) || 'normal'}
            lineHeight={(metadata.lineHeight as number) || 1.2}
          />
        );
      case 'image':
        return (
          <Image
            {...commonProps}
            image={metadata.image as HTMLImageElement | undefined}
            width={(metadata.width as number) || 100}
            height={(metadata.height as number) || 100}
          />
        );
      case 'shape':
        const shapeType = (metadata.shapeType as string) || 'rect';
        if (shapeType === 'rect') {
          return (
            <Rect
              {...commonProps}
              width={(metadata.width as number) || 100}
              height={(metadata.height as number) || 100}
              fill={(metadata.fill as string) || '#3B82F6'}
              stroke={metadata.stroke as string}
              strokeWidth={(metadata.strokeWidth as number) || 0}
              cornerRadius={(metadata.cornerRadius as number) || 0}
            />
          );
        } else if (shapeType === 'circle') {
          return (
            <Circle
              {...commonProps}
              radius={(metadata.radius as number) || 50}
              fill={(metadata.fill as string) || '#3B82F6'}
              stroke={metadata.stroke as string}
              strokeWidth={(metadata.strokeWidth as number) || 0}
            />
          );
        } else if (shapeType === 'ellipse') {
          return (
            <Ellipse
              {...commonProps}
              radiusX={(metadata.radiusX as number) || 50}
              radiusY={(metadata.radiusY as number) || 50}
              fill={(metadata.fill as string) || '#3B82F6'}
              stroke={metadata.stroke as string}
              strokeWidth={(metadata.strokeWidth as number) || 0}
            />
          );
        } else if (shapeType === 'line') {
          return (
            <Line
              {...commonProps}
              points={(metadata.points as number[]) || [0, 0, 100, 100]}
              stroke={(metadata.stroke as string) || '#000000'}
              strokeWidth={(metadata.strokeWidth as number) || 2}
              tension={(metadata.tension as number) || 0}
            />
          );
        } else if (shapeType === 'star') {
          return (
            <Star
              {...commonProps}
              numPoints={(metadata.numPoints as number) || 5}
              innerRadius={(metadata.innerRadius as number) || 30}
              outerRadius={(metadata.outerRadius as number) || 50}
              fill={(metadata.fill as string) || '#3B82F6'}
              stroke={metadata.stroke as string}
              strokeWidth={(metadata.strokeWidth as number) || 0}
            />
          );
        } else if (shapeType === 'arrow') {
          return (
            <Arrow
              {...commonProps}
              points={(metadata.points as number[]) || [0, 0, 100, 100]}
              stroke={(metadata.stroke as string) || '#000000'}
              strokeWidth={(metadata.strokeWidth as number) || 2}
              fill={(metadata.fill as string) || '#000000'}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="relative h-full w-full">
      <Stage
        ref={stageRef}
        width={canvasWidth}
        height={canvasHeight}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        onClick={handleStageClick}
        onDragEnd={handleStageDrag}
        onWheel={handleWheelEvent}
        style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
      >
        {/* Background Layer */}
        <Layer name="background">
          <Rect
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill="#ffffff"
            listening={false}
          />
        </Layer>

        {/* Grid Overlay */}
        {showGrid && <GridOverlay width={canvasWidth} height={canvasHeight} />}

        {/* Safe Zone Overlay */}
        {showSafeZone && <SafeZoneOverlay width={canvasWidth} height={canvasHeight} />}

        {/* Rulers Overlay */}
        {showRulers && <RulersOverlay width={canvasWidth} height={canvasHeight} zoom={zoom} />}

        {/* Zones Layer */}
        <Layer name="zones">
          {zones.map((zone) => (
            <Group
              key={zone.id}
              clipX={zone.x}
              clipY={zone.y}
              clipWidth={zone.width}
              clipHeight={zone.height}
            >
              {/* Render objects within this zone */}
              {layers
                .filter((layer) => layer.zoneId === zone.id)
                .map((layer) => (
                  <Group key={layer.id}>{renderObject(layer)}</Group>
                ))}
            </Group>
          ))}
        </Layer>

        {/* Objects Layer */}
        <Layer name="objects">
          {layers
            .filter((layer) => !layer.zoneId)
            .map((layer) => renderObject(layer))}
        </Layer>

        {/* Overlay Layer - Selection, Transformer */}
        <Layer name="overlay">
          {selectedIds.length > 0 && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize
                if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>

      {/* Selection Info Overlay */}
      {selectedIds.length > 0 && layers.find((l) => l.id === selectedIds[0]) && (
        <SelectionInfo object={layers.find((l) => l.id === selectedIds[0])!} />
      )}
    </div>
  );
}
