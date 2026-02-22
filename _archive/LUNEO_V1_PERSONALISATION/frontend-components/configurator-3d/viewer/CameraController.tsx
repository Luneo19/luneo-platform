'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';

export interface CameraControllerProps {
  onCreated?: () => void;
}

function vec3(v?: { x: number; y: number; z: number } | null): [number, number, number] {
  if (!v) return [0, 0, 0];
  return [v.x, v.y, v.z];
}

/**
 * CameraController - R3F component for OrbitControls
 * Supports animateTo, focusOnComponent, auto-rotate from cameraSettings
 */
export function CameraController({ onCreated }: CameraControllerProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const configuration = useConfigurator3DStore((s) => s.configuration);
  const cameraTarget = useConfigurator3DStore((s) => s.scene.cameraTarget);
  const cameraPosition = useConfigurator3DStore((s) => s.scene.cameraPosition);
  const zoom = useConfigurator3DStore((s) => s.ui.zoom);
  const setSceneReady = useConfigurator3DStore((s) => s.setSceneReady);

  const camSettings = configuration?.cameraSettings;

  const initialPosition = vec3(camSettings?.initialPosition ?? { x: 5, y: 3, z: 5 });
  const initialTarget = vec3(camSettings?.initialTarget ?? { x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (controlsRef.current && camSettings?.initialPosition) {
      controlsRef.current.target.set(...initialTarget);
      camera.position.set(...initialPosition);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    if (controlsRef.current && cameraTarget) {
      controlsRef.current.target.lerp(
        new THREE.Vector3(cameraTarget.x, cameraTarget.y, cameraTarget.z),
        0.05
      );
    }
    if (zoom !== 1 && controlsRef.current) {
      const dist = camera.position.distanceTo(controlsRef.current.target);
      const newDist = dist / zoom;
      const dir = new THREE.Vector3()
        .subVectors(camera.position, controlsRef.current.target)
        .normalize();
      camera.position.copy(
        controlsRef.current.target.clone().add(dir.multiplyScalar(newDist))
      );
    }
  });

  useEffect(() => {
    onCreated?.();
    setSceneReady(true);
  }, [onCreated, setSceneReady]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={camSettings?.enableZoom ?? true}
      enablePan={camSettings?.enablePan ?? true}
      enableRotate={camSettings?.enableRotate ?? true}
      minDistance={camSettings?.minDistance ?? 1}
      maxDistance={camSettings?.maxDistance ?? 50}
      minPolarAngle={camSettings?.minPolarAngle ?? 0}
      maxPolarAngle={camSettings?.maxPolarAngle ?? Math.PI}
      minAzimuthAngle={camSettings?.minAzimuthAngle ?? -Infinity}
      maxAzimuthAngle={camSettings?.maxAzimuthAngle ?? Infinity}
      autoRotate={camSettings?.autoRotate ?? false}
      autoRotateSpeed={camSettings?.autoRotateSpeed ?? 2}
      dampingFactor={camSettings?.dampingFactor ?? 0.05}
      target={initialTarget}
    />
  );
}
