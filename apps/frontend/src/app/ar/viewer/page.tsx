'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useSearchParams } from 'next/navigation';
import { logger } from '@/lib/logger';

export default function ARViewerPage() {
  const searchParams = useSearchParams();
  const modelUrl = searchParams.get('model');
  const title = searchParams.get('title') || 'AR Model';
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xrSupported, setXrSupported] = useState(false);

  useEffect(() => {
    if (!modelUrl) {
      setError('No model URL provided');
      setLoading(false);
      return;
    }

    // Check WebXR support
    if ('xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
        setXrSupported(supported);
      });
    }

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

    // Load model
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        scene.add(gltf.scene);
        
        // Center and scale model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        
        gltf.scene.scale.multiplyScalar(scale);
        gltf.scene.position.sub(center.multiplyScalar(scale));
        
        camera.position.set(0, 1.6, 3);
        camera.lookAt(0, 0, 0);
        
        setLoading(false);
      },
      (progress) => {
        // Loading progress
        logger.debug('Loading AR model progress', { progress, modelUrl });
      },
      (err) => {
        logger.error('Error loading AR model', {
          error: err,
          modelUrl,
          title,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        setError('Failed to load 3D model');
        setLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // WebXR session (simplified - full implementation would require more setup)
    const startARSession = async () => {
      if (!('xr' in navigator) || !xrSupported) {
        alert('WebXR not supported on this device');
        return;
      }

      try {
        // Request AR session
        const session = await (navigator.xr as any)?.requestSession('immersive-ar', {
          requiredFeatures: ['local'],
          optionalFeatures: ['dom-overlay'],
          domOverlay: { root: containerRef.current! },
        });

        await renderer.xr.setSession(session);
        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
        });
      } catch (err) {
        logger.error('AR session error', {
          error: err,
          modelUrl,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        alert('Failed to start AR session');
      }
    };

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [modelUrl, xrSupported]);

  return (
    <div className="fixed inset-0 bg-black">
      <div ref={containerRef} className="w-full h-full" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">Loading 3D model...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-white text-black rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {!loading && !error && xrSupported && (
        <button
          onClick={() => {
            // Start AR session
            const event = new CustomEvent('start-ar');
            window.dispatchEvent(event);
          }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-blue-500 text-white rounded-lg"
        >
          Start AR
        </button>
      )}
    </div>
  );
}
