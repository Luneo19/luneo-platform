'use client';

import React, { useMemo, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';

export interface ModelLoaderProps {
  modelUrl: string;
}

/**
 * ModelLoader - R3F component that loads and renders the 3D model
 * Applies selections to mesh parts, handles hover/click for component selection
 */
export function ModelLoader({ modelUrl }: ModelLoaderProps) {
  const { scene } = useGLTF(modelUrl, true);

  const setSelectedComponent = useConfigurator3DStore((s) => s.setSelectedComponent);
  const setHoveredOption = useConfigurator3DStore((s) => s.setHoveredOption);
  const selectOption = useConfigurator3DStore((s) => s.selectOption);
  const selections = useConfigurator3DStore((s) => s.selections);
  const configuration = useConfigurator3DStore((s) => s.configuration);
  const setModelLoaded = useConfigurator3DStore((s) => s.setModelLoaded);

  // Map mesh names to component/option IDs (technicalId or name matching)
  const meshToComponent = useMemo(() => {
    const map = new Map<string, { componentId: string; optionId: string }>();
    if (!configuration) return map;

    for (const comp of configuration.components) {
      for (const opt of comp.options) {
        const technicalId = comp.technicalId ?? comp.id;
        const meshName = opt.id; // Option ID often matches mesh name in GLTF
        if (meshName) map.set(meshName, { componentId: comp.id, optionId: opt.id });
      }
    }
    return map;
  }, [configuration]);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.originalMaterial = child.material;
      }
    });
    return clone;
  }, [scene]);

  useFrame(() => {
    setModelLoaded(true);
  });

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation?.();
      const mesh = e.object as THREE.Mesh;
      const name = mesh.name;
      const mapping = meshToComponent.get(name);
      if (mapping) {
        setHoveredOption(mapping.optionId);
      }
    },
    [meshToComponent, setHoveredOption]
  );

  const handlePointerOut = useCallback(() => {
    setHoveredOption(null);
  }, [setHoveredOption]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation?.();
      const mesh = e.object as THREE.Mesh;
      const name = mesh.name;
      const mapping = meshToComponent.get(name);
      if (mapping) {
        setSelectedComponent(mapping.componentId);
        selectOption(mapping.componentId, mapping.optionId);
      }
    },
    [meshToComponent, setSelectedComponent, selectOption]
  );

  // Apply material/color from selections to meshes
  useFrame(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mapping = meshToComponent.get(child.name);
        if (mapping && configuration) {
          const comp = configuration.components.find((c) => c.id === mapping.componentId);
          const sel = selections[mapping.componentId];
          const selectedIds = Array.isArray(sel) ? sel : sel ? [sel] : [];
          const isSelected = selectedIds.includes(mapping.optionId);

          if (comp && isSelected) {
            const opt = comp.options.find((o) => o.id === mapping.optionId);
            if (opt?.value && opt.value.type === 'COLOR') {
              const mat = child.material as THREE.MeshStandardMaterial;
              if (mat.color) {
                mat.color.set(opt.value.hex);
              }
            }
          }
        }
      }
    });
  });

  return (
    <primitive
      object={clonedScene}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      scale={1}
    />
  );
}
