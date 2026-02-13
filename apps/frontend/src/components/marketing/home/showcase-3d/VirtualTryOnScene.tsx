'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Glasses model made from primitives
function Glasses() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.3;
      ref.current.position.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={ref} position={[0, 0.3, 0]}>
        {/* Left lens */}
        <mesh position={[-0.6, 0, 0]}>
          <torusGeometry args={[0.45, 0.06, 16, 32]} />
          <meshStandardMaterial color="#ec4899" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Left lens glass */}
        <mesh position={[-0.6, 0, 0]}>
          <circleGeometry args={[0.42, 32]} />
          <meshStandardMaterial color="#7c3aed" transparent opacity={0.3} roughness={0} metalness={0.5} side={THREE.DoubleSide} />
        </mesh>
        {/* Right lens */}
        <mesh position={[0.6, 0, 0]}>
          <torusGeometry args={[0.45, 0.06, 16, 32]} />
          <meshStandardMaterial color="#ec4899" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Right lens glass */}
        <mesh position={[0.6, 0, 0]}>
          <circleGeometry args={[0.42, 32]} />
          <meshStandardMaterial color="#7c3aed" transparent opacity={0.3} roughness={0} metalness={0.5} side={THREE.DoubleSide} />
        </mesh>
        {/* Bridge */}
        <mesh position={[0, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          <meshStandardMaterial color="#ec4899" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Left arm */}
        <mesh position={[-1.05, 0, -0.3]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.04, 0.04, 0.8]} />
          <meshStandardMaterial color="#ec4899" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Right arm */}
        <mesh position={[1.05, 0, -0.3]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.04, 0.04, 0.8]} />
          <meshStandardMaterial color="#ec4899" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>
    </Float>
  );
}

// Face mesh dots (AR tracking visualization)
function FaceMeshDots() {
  const ref = useRef<THREE.Points>(null);

  const { positions, originalPositions } = useMemo(() => {
    const pts: number[] = [];
    // Create a face-shaped point cloud
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.5;
      // Shape like an oval face
      const x = Math.cos(angle) * radius * 0.7;
      const y = Math.sin(angle) * radius * 1.0;
      const z = -0.5 - Math.random() * 0.3;
      pts.push(x, y, z);
    }
    return {
      positions: new Float32Array(pts),
      originalPositions: new Float32Array(pts),
    };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      const pos = ref.current.geometry.attributes.position;
      const time = clock.getElapsedTime();
      for (let i = 0; i < pos.count; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        pos.setX(i, ox + Math.sin(time * 2 + i * 0.5) * 0.02);
        pos.setY(i, oy + Math.cos(time * 1.5 + i * 0.3) * 0.02);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <points ref={ref} position={[0, 0.2, -0.5]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#a855f7" size={0.04} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// AR scan line effect
function ScanLine() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 1.5;
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, -0.3]}>
      <planeGeometry args={[3, 0.02]} />
      <meshBasicMaterial color="#ec4899" transparent opacity={0.2} />
    </mesh>
  );
}

export function VirtualTryOnScene() {
  return (
    <div className="w-full h-full min-h-[260px] sm:min-h-[350px] md:min-h-[400px]">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 5]} intensity={0.6} color="#ec4899" />
        <pointLight position={[-3, 2, 3]} intensity={0.4} color="#a855f7" />

        <FaceMeshDots />
        <Glasses />
        <ScanLine />
      </Canvas>
    </div>
  );
}
