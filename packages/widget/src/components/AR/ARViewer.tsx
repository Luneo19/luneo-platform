'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiService } from '../../services/api.service';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ARViewerProps {
  apiService: ApiService;
  generationId: string;
  onClose?: () => void;
}

export function ARViewer({ apiService, generationId, onClose }: ARViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const controllerRef = useRef<THREE.XRTargetRaySpace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arData, setArData] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isARSessionActive, setIsARSessionActive] = useState(false);

  useEffect(() => {
    // Vérifier le support WebXR
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsSupported(supported);
        if (!supported) {
          setError('AR is not supported on this device');
          setIsLoading(false);
        }
      });
    } else {
      setIsSupported(false);
      setError('WebXR is not supported in this browser');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupported || !containerRef.current) return;

    const initAR = async () => {
      try {
        // Récupérer les données AR
        const response = await apiService.getArData(generationId);
        
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to load AR data');
        }

        setArData(response.data);
        setIsLoading(false);

        // Initialiser Three.js et WebXR
        await initThreeJS(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize AR');
        setIsLoading(false);
      }
    };

    initAR();
  }, [isSupported, generationId, apiService]);

  const initThreeJS = async (data: any) => {
    if (!containerRef.current) return;

    try {
      // Créer le canvas
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      containerRef.current.appendChild(canvas);
      canvasRef.current = canvas;

      // Initialiser Three.js
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
      );
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.xr.enabled = true;
      rendererRef.current = renderer;

      // Éclairage
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // Charger le modèle 3D
      if (data.modelUrl) {
        const loader = new GLTFLoader();
        loader.load(
          data.modelUrl,
          (gltf) => {
            const model = gltf.scene;
            model.scale.set(data.scale || 1, data.scale || 1, data.scale || 1);
            
            // Appliquer la texture personnalisée si disponible
            if (data.textureUrl) {
              const textureLoader = new THREE.TextureLoader();
              textureLoader.load(data.textureUrl, (texture) => {
                model.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    if (child.material) {
                      if (Array.isArray(child.material)) {
                        child.material.forEach((mat) => {
                          if (mat instanceof THREE.MeshStandardMaterial) {
                            mat.map = texture;
                            mat.needsUpdate = true;
                          }
                        });
                      } else if (child.material instanceof THREE.MeshStandardMaterial) {
                        child.material.map = texture;
                        child.material.needsUpdate = true;
                      }
                    }
                  }
                });
              });
            }

            scene.add(model);
            modelRef.current = model;
            console.log('3D Model loaded:', model);
          },
          undefined,
          (error) => {
            console.error('Error loading 3D model:', error);
            setError('Failed to load 3D model');
          }
        );
      }

      // Gérer le tracking selon le type
      if (data.trackingType === 'surface') {
        // Hit testing pour surface
        setupHitTesting(renderer, scene, camera, data);
      } else if (data.trackingType === 'face') {
        // Face tracking (nécessite MediaPipe ou similaire)
        setupFaceTracking(scene, data);
      }

      // Animation loop
      const animate = () => {
        if (renderer.xr.isPresenting) {
          renderer.render(scene, camera);
        }
        requestAnimationFrame(animate);
      };
      animate();

      // Créer le bouton XR manuellement
      const xrButton = document.createElement('button');
      xrButton.textContent = 'Enter AR';
      xrButton.style.position = 'absolute';
      xrButton.style.bottom = '20px';
      xrButton.style.left = '50%';
      xrButton.style.transform = 'translateX(-50%)';
      xrButton.style.padding = '12px 24px';
      xrButton.style.backgroundColor = '#667eea';
      xrButton.style.color = 'white';
      xrButton.style.border = 'none';
      xrButton.style.borderRadius = '6px';
      xrButton.style.cursor = 'pointer';
      xrButton.style.fontSize = '16px';
      xrButton.style.fontWeight = '500';
      
      xrButton.addEventListener('click', async () => {
        if (renderer.xr.isPresenting) {
          await renderer.xr.getSession()?.end();
        } else {
          const session = await navigator.xr?.requestSession('immersive-ar', {
            requiredFeatures: data.sessionConfig.requiredFeatures || ['hit-test'],
            optionalFeatures: data.sessionConfig.optionalFeatures || [],
          });
          if (session) {
            await renderer.xr.setSession(session);
          }
        }
      });
      
      containerRef.current.appendChild(xrButton);

      // Écouter les événements de session
      renderer.xr.addEventListener('sessionstart', () => {
        setIsARSessionActive(true);
        console.log('AR Session started');
      });

      renderer.xr.addEventListener('sessionend', () => {
        setIsARSessionActive(false);
        console.log('AR Session ended');
      });

    } catch (err) {
      console.error('Failed to initialize Three.js:', err);
      setError('Failed to initialize 3D scene');
    }
  };

  const setupHitTesting = (
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    data: any
  ) => {
    let hitTestSource: XRHitTestSource | null = null;
    let referenceSpace: XRReferenceSpace | null = null;

    const controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);
    controllerRef.current = controller;

    function onSelect() {
      if (!modelRef.current || !referenceSpace) return;
      
      // Positionner le modèle à l'endroit sélectionné
      // Cette logique sera implémentée avec le hit testing
    }

    renderer.xr.addEventListener('sessionstart', async () => {
      const session = renderer.xr.getSession();
      if (!session) return;

      referenceSpace = await session.requestReferenceSpace('local');
      const viewerSpace = await session.requestReferenceSpace('viewer');
      hitTestSource = await session.requestHitTestSource?.(viewerSpace) || null;

      if (hitTestSource) {
        const updateHitTest = () => {
          if (!hitTestSource || !referenceSpace || !modelRef.current) return;

          const frame = renderer.xr.getFrame();
          if (!frame) return;

          const hitTestResults = frame.getHitTestResults(hitTestSource);
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            if (pose) {
              const position = pose.transform.position;
              const orientation = pose.transform.orientation;
              modelRef.current.position.set(position.x, position.y, position.z);
              modelRef.current.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
            }
          }
        };

        renderer.setAnimationLoop(updateHitTest);
      }
    });
  };

  const setupFaceTracking = (scene: THREE.Scene, data: any) => {
    // Face tracking nécessite MediaPipe ou une API similaire
    // Pour l'instant, on place le modèle devant la caméra
    if (modelRef.current) {
      modelRef.current.position.set(0, 0, -0.5);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading AR...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-red-600 mb-4">{error}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (modelRef.current) {
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full bg-black" />
      {isARSessionActive && (
        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded text-sm">
          AR Active
        </div>
      )}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 px-4 py-2 bg-white bg-opacity-80 text-gray-700 rounded-md hover:bg-opacity-100 z-10"
        >
          Close AR
        </button>
      )}
    </div>
  );
}

