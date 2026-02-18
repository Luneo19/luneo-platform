/**
 * Desktop fallback: 3D viewer with orbit controls + QR code for mobile AR.
 * @module ar/platforms/DesktopFallback
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { logger } from '@/lib/logger';

export interface DesktopViewerOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  /** Called when model is loaded */
  onLoaded?: (model: THREE.Group) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export interface QRCodeOptions {
  size?: number;
  /** Optional alt text / label */
  label?: string;
}

let viewerScene: THREE.Scene | null = null;
let viewerCamera: THREE.PerspectiveCamera | null = null;
let viewerRenderer: THREE.WebGLRenderer | null = null;
let viewerControls: OrbitControls | null = null;
let viewerAnimationId: number | null = null;

/**
 * Show 3D model in a container with orbit controls.
 */
export function showViewer(
  gltfUrl: string,
  containerId: string,
  options: DesktopViewerOptions = {}
): { cleanup: () => void } {
  const container = document.getElementById(containerId);
  if (!container) {
    const err = new Error(`DesktopFallback: container not found: ${containerId}`);
    options.onError?.(err);
    return { cleanup: () => {} };
  }

  const width = (options.width ?? container.clientWidth) || 640;
  const height = (options.height ?? container.clientHeight) || 480;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(options.backgroundColor ?? 0x1a1a1a);

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(0, 0, 3);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 0, 0);

  const loader = new GLTFLoader();
  loader.load(
    gltfUrl,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      model.position.sub(center);
      controls.target.copy(center);
      const maxDim = Math.max(size.x, size.y, size.z);
      camera.position.set(center.x + maxDim, center.y + maxDim * 0.5, center.z + maxDim);
      controls.update();
      options.onLoaded?.(model);
    },
    undefined,
    (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('DesktopFallback: GLTF load failed', { error: error.message });
      options.onError?.(error);
    }
  );

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 5);
  scene.add(dir);

  viewerScene = scene;
  viewerCamera = camera;
  viewerRenderer = renderer;
  viewerControls = controls;

  function animate(): void {
    viewerAnimationId = requestAnimationFrame(animate);
    viewerControls?.update();
    viewerRenderer?.render(scene, camera);
  }
  animate();

  const cleanup = (): void => {
    if (viewerAnimationId != null) cancelAnimationFrame(viewerAnimationId);
    viewerAnimationId = null;
    viewerControls?.dispose();
    viewerRenderer?.dispose();
    viewerRenderer = null;
    viewerCamera = null;
    viewerControls = null;
    viewerScene = null;
    container.removeChild(canvas);
  };

  return { cleanup };
}

/**
 * Show QR code that links to AR URL (user scans with phone).
 */
export function showQRCode(arUrl: string, containerId: string, options: QRCodeOptions = {}): void {
  const container = document.getElementById(containerId);
  if (!container) {
    logger.warn('DesktopFallback: QR container not found', { containerId });
    return;
  }

  const size = options.size ?? 200;
  const label = options.label ?? 'Scan to view in AR';

  // Dynamic import to avoid bundling qrcode when not used
  import('qrcode')
    .then((QRCode) => {
      const canvas = document.createElement('canvas');
      container.innerHTML = '';
      container.appendChild(canvas);
      QRCode.default.toCanvas(canvas, arUrl, { width: size, margin: 2 }, (err) => {
        if (err) {
          logger.error('DesktopFallback: QR generation failed', { error: String(err) });
          return;
        }
        const p = document.createElement('p');
        p.textContent = label;
        p.style.marginTop = '8px';
        p.style.fontSize = '14px';
        p.style.color = '#666';
        container.appendChild(p);
      });
    })
    .catch((err) => logger.error('DesktopFallback: qrcode import failed', { error: String(err) }));
}
