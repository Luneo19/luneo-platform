'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Main rotating product (torus knot representing a configurable 3D object)
function Product() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.3;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.15;
    }
  });

  return (
    <mesh ref={ref} position={[0, 0.2, 0]}>
      <torusKnotGeometry args={[1, 0.35, 128, 32]} />
      <MeshDistortMaterial
        color="#7c3aed"
        roughness={0.15}
        metalness={0.85}
        distort={0.15}
        speed={2}
        envMapIntensity={1}
      />
    </mesh>
  );
}

// Orbiting material spheres
function MaterialOrbiters() {
  const groupRef = useRef<THREE.Group>(null);
  const materials = [
    { color: '#ec4899', roughness: 0.1, metalness: 0.9 },
    { color: '#3b82f6', roughness: 0.8, metalness: 0.1 },
    { color: '#10b981', roughness: 0.3, metalness: 0.6 },
    { color: '#f59e0b', roughness: 0.5, metalness: 0.4 },
  ];

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {materials.map((mat, i) => {
        const angle = (i / materials.length) * Math.PI * 2;
        const radius = 2.2;
        return (
          <Float key={i} speed={3} floatIntensity={0.4} rotationIntensity={0.5}>
            <mesh position={[Math.cos(angle) * radius, 0.5 + Math.sin(i) * 0.3, Math.sin(angle) * radius]}>
              <sphereGeometry args={[0.18, 32, 32]} />
              <meshStandardMaterial color={mat.color} roughness={mat.roughness} metalness={mat.metalness} />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

export function Configurator3DScene() {
  return (
    <div className="w-full h-full min-h-[260px] sm:min-h-[350px] md:min-h-[400px]">
      <Canvas camera={{ position: [0, 1, 5], fov: 40 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.7} color="#7c3aed" />
        <pointLight position={[-10, -5, 5]} intensity={0.4} color="#3b82f6" />
        <spotLight position={[0, 8, 4]} intensity={0.8} angle={0.5} penumbra={1} color="#a78bfa" />

        <Product />
        <MaterialOrbiters />

        <ContactShadows position={[0, -1.5, 0]} opacity={0.3} scale={8} blur={2} color="#7c3aed" />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
