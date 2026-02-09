'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// Floating color palette layers
function ColorLayer({ position, color, delay }: { position: [number, number, number]; color: string; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5 + delay) * 0.1;
      ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 0.8 + delay) * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <RoundedBox ref={ref} args={[2.2, 1.4, 0.08]} radius={0.08} position={position}>
        <meshStandardMaterial color={color} transparent opacity={0.85} roughness={0.3} metalness={0.1} />
      </RoundedBox>
    </Float>
  );
}

// Floating brush tool
function BrushTool() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.x = 1.5 + Math.sin(clock.getElapsedTime() * 0.7) * 0.3;
      ref.current.position.y = 0.8 + Math.cos(clock.getElapsedTime() * 0.5) * 0.2;
      ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.4) * 0.3 - 0.5;
    }
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#a855f7" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, -0.45, 0.2]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshStandardMaterial color="#ec4899" roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  );
}

// Color swatches floating on the side
function ColorSwatches() {
  const colors = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  return (
    <group position={[-1.8, 0, 0.1]}>
      {colors.map((color, i) => (
        <Float key={i} speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
          <mesh position={[0, (i - 2.5) * 0.35, 0]}>
            <boxGeometry args={[0.25, 0.25, 0.06]} />
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export function DesignStudioScene() {
  return (
    <div className="w-full h-full min-h-[260px] sm:min-h-[350px] md:min-h-[400px]">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#a855f7" />
        <pointLight position={[-5, -3, 3]} intensity={0.5} color="#ec4899" />
        <spotLight position={[0, 5, 3]} intensity={0.6} angle={0.6} penumbra={1} color="#fff" />

        {/* Stacked design layers */}
        <ColorLayer position={[0, -0.5, -0.3]} color="#1e1b4b" delay={0} />
        <ColorLayer position={[0, 0, 0]} color="#312e81" delay={1} />
        <ColorLayer position={[0, 0.5, 0.3]} color="#4c1d95" delay={2} />

        <BrushTool />
        <ColorSwatches />
      </Canvas>
    </div>
  );
}
