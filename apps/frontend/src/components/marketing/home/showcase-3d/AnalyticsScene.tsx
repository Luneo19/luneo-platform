'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

// Animated 3D bar chart
function BarChart() {
  const bars = useMemo(
    () => [
      { height: 0.8, color: '#a855f7', x: -1.5 },
      { height: 1.2, color: '#7c3aed', x: -0.9 },
      { height: 0.6, color: '#ec4899', x: -0.3 },
      { height: 1.6, color: '#10b981', x: 0.3 },
      { height: 1.0, color: '#3b82f6', x: 0.9 },
      { height: 1.8, color: '#a855f7', x: 1.5 },
    ],
    []
  );

  return (
    <group position={[0, -0.8, 0]}>
      {bars.map((bar, i) => (
        <AnimatedBar key={i} {...bar} index={i} />
      ))}
      {/* Base platform */}
      <RoundedBox args={[4, 0.06, 1.5]} radius={0.02} position={[0, -0.03, 0]}>
        <meshStandardMaterial color="#1e1b4b" roughness={0.8} metalness={0.2} />
      </RoundedBox>
    </group>
  );
}

function AnimatedBar({ height, color, x, index }: { height: number; color: string; x: number; index: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const targetHeight = height + Math.sin(clock.getElapsedTime() * 1.2 + index * 0.8) * 0.2;
      ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, targetHeight, 0.05);
      ref.current.position.y = (ref.current.scale.y * 0.5);
    }
  });

  return (
    <mesh ref={ref} position={[x, height * 0.5, 0]}>
      <boxGeometry args={[0.35, 1, 0.35]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
    </mesh>
  );
}

// Floating data particles
function DataParticles() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pts = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      pts[i * 3] = (Math.random() - 0.5) * 5;
      pts[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pts[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    return pts;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.05;
      const pos = ref.current.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        pos.setY(i, y + Math.sin(clock.getElapsedTime() + i) * 0.002);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#a855f7" size={0.05} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

// Rising percentage text
function StatsOverlay() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 1.2 + Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={1.5} floatIntensity={0.3}>
      <group ref={ref} position={[0, 1.2, 0.5]}>
        <Text
          fontSize={0.35}
          color="#10b981"
          anchorX="center"
          anchorY="middle"
        >
          +45.2%
        </Text>
      </group>
    </Float>
  );
}

export function AnalyticsScene() {
  return (
    <div className="w-full h-full min-h-[260px] sm:min-h-[350px] md:min-h-[400px]">
      <Canvas camera={{ position: [0, 1.5, 5], fov: 40 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.6} color="#a855f7" />
        <pointLight position={[-5, 3, 3]} intensity={0.4} color="#10b981" />
        <spotLight position={[0, 6, 4]} intensity={0.7} angle={0.5} penumbra={1} color="#fff" />

        <BarChart />
        <DataParticles />
        <StatsOverlay />
      </Canvas>
    </div>
  );
}
