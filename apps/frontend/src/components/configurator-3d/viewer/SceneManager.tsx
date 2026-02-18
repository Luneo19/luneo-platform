'use client';

import React, { useMemo } from 'react';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import type { Vector3 } from '@/lib/configurator-3d/types/configurator.types';

function vec3(v?: Vector3 | { x: number; y: number; z: number } | null): [number, number, number] {
  if (!v) return [0, 0, 0];
  return [v.x, v.y, v.z];
}

/**
 * SceneManager - R3F component that sets up the 3D scene
 * Configures background, environment map, lights, and shadows
 */
export function SceneManager() {
  const configuration = useConfigurator3DStore((s) => s.configuration);
  const sceneSettings = configuration?.sceneSettings;

  const backgroundColor = useMemo(() => {
    const color = sceneSettings?.backgroundColor ?? '#0a0a0f';
    return new THREE.Color(color);
  }, [sceneSettings?.backgroundColor]);

  const ambientIntensity = sceneSettings?.ambientLight?.intensity ?? 0.4;
  const ambientColor = sceneSettings?.ambientLight?.color ?? '#ffffff';

  const useEnvMap = sceneSettings?.useEnvironmentMap ?? true;
  const envMapUrl = sceneSettings?.environmentMapUrl;

  const shadowsEnabled = sceneSettings?.shadows?.enabled ?? true;
  const shadowMapSize = sceneSettings?.shadows?.mapSize ?? 2048;
  const shadowBias = sceneSettings?.shadows?.bias ?? -0.0001;
  const shadowRadius = sceneSettings?.shadows?.radius ?? 4;

  return (
    <>
      <color attach="background" args={[backgroundColor]} />

      {/* Ambient light */}
      <ambientLight
        color={ambientColor}
        intensity={ambientIntensity}
      />

      {/* Directional lights from config */}
      {sceneSettings?.directionalLights?.map((light, i) => (
        <directionalLight
          key={`dir-${i}`}
          position={vec3(light.position) as [number, number, number]}
          color={light.color ?? '#ffffff'}
          intensity={light.intensity ?? 1}
          castShadow={shadowsEnabled && (light.castShadow ?? true)}
          shadow-mapSize={[light.shadowMapSize ?? shadowMapSize, light.shadowMapSize ?? shadowMapSize]}
          shadow-bias={light.shadowBias ?? shadowBias}
          shadow-radius={shadowRadius}
        />
      ))}

      {/* Default directional light if none configured */}
      {(!sceneSettings?.directionalLights || sceneSettings.directionalLights.length === 0) && (
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow={shadowsEnabled}
          shadow-mapSize={[shadowMapSize, shadowMapSize]}
          shadow-bias={shadowBias}
          shadow-radius={shadowRadius}
        />
      )}

      {/* Spot lights from config */}
      {sceneSettings?.spotLights?.map((light, i) => (
        <spotLight
          key={`spot-${i}`}
          position={vec3(light.position) as [number, number, number]}
          color={light.color ?? '#ffffff'}
          intensity={light.intensity ?? 1}
          angle={light.angle ?? Math.PI / 6}
          penumbra={light.penumbra ?? 0.5}
          decay={light.decay ?? 2}
          castShadow={shadowsEnabled && (light.castShadow ?? false)}
        />
      ))}

      {/* Environment map */}
      {useEnvMap && (
        <Environment
          preset={envMapUrl ? undefined : 'studio'}
          files={envMapUrl ?? undefined}
          background={false}
        />
      )}

      {/* Floor if configured */}
      {sceneSettings?.floor?.enabled && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[sceneSettings.floor.size ?? 20, sceneSettings.floor.size ?? 20]} />
          <meshStandardMaterial
            color={sceneSettings.floor.color ?? '#1a1a1a'}
            opacity={sceneSettings.floor.opacity ?? 0.5}
            transparent={sceneSettings.floor.opacity !== undefined && sceneSettings.floor.opacity < 1}
          />
        </mesh>
      )}
    </>
  );
}
