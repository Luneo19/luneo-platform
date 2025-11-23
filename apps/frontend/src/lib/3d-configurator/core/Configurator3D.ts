import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { logger } from '@/lib/logger';

export interface Material3D {
  id: string;
  name: string;
  type: 'leather' | 'fabric' | 'metal' | 'plastic' | 'wood' | 'glass' | 'custom';
  baseColor: string;
  roughness: number;
  metalness: number;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  metalnessMapUrl?: string;
  aoMapUrl?: string;
}

export interface Part3D {
  id: string;
  name: string;
  meshName: string;
  glbUrl?: string;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
}

export interface Configuration3D {
  materials: Map<string, Material3D>;
  parts: Map<string, Part3D>;
  colors: Map<string, string>;
  text?: {
    content: string;
    font: string;
    size: number;
    depth: number;
    position: THREE.Vector3;
    rotation: THREE.Euler;
  };
}

export class Configurator3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private loader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;
  private rgbeLoader: RGBELoader;
  private model: THREE.Group | null = null;
  private configuration: Configuration3D;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5f5f5);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.5, 3);

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // For screenshots
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize controls
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI / 2;

    // Initialize loaders
    this.loader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.rgbeLoader = new RGBELoader();

    // Initialize configuration
    this.configuration = {
      materials: new Map(),
      parts: new Map(),
      colors: new Map(),
    };

    // Setup lights
    this.setupLights();

    // Start animation loop
    this.animate();
  }

  private setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(hemisphereLight);

    // Spot lights for highlights
    const spotLight1 = new THREE.SpotLight(0xffffff, 0.5);
    spotLight1.position.set(-5, 5, 0);
    spotLight1.angle = Math.PI / 6;
    spotLight1.penumbra = 0.2;
    this.scene.add(spotLight1);

    const spotLight2 = new THREE.SpotLight(0xffffff, 0.5);
    spotLight2.position.set(5, 5, 0);
    spotLight2.angle = Math.PI / 6;
    spotLight2.penumbra = 0.2;
    this.scene.add(spotLight2);
  }

  async loadModel(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          // Remove old model if exists
          if (this.model) {
            this.scene.remove(this.model);
          }

          this.model = gltf.scene;

          // Enable shadows
          this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Center and scale model
          const box = new THREE.Box3().setFromObject(this.model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          
          this.model.scale.multiplyScalar(scale);
          this.model.position.sub(center.multiplyScalar(scale));
          this.model.position.y = -size.y * scale / 2;

          this.scene.add(this.model);
          resolve();
        },
        (progress) => {
          const progressPercent = (progress.loaded / progress.total) * 100;
          logger.debug('Loading model progress', {
            progress: progressPercent.toFixed(1) + '%',
            loaded: progress.loaded,
            total: progress.total,
            modelUrl,
          });
        },
        (error) => {
          logger.error('Error loading model', {
            error,
            modelUrl,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          reject(error);
        }
      );
    });
  }

  async loadEnvironment(hdrUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.rgbeLoader.load(
        hdrUrl,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          this.scene.environment = texture;
          this.scene.background = texture;
          resolve();
        },
        undefined,
        reject
      );
    });
  }

  changeMaterial(meshName: string, material: Material3D): void {
    if (!this.model) return;

    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === meshName) {
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(material.baseColor),
          roughness: material.roughness,
          metalness: material.metalness,
        });

        // Load textures if provided
        if (material.normalMapUrl) {
          this.textureLoader.load(material.normalMapUrl, (texture) => {
            mat.normalMap = texture;
            mat.needsUpdate = true;
          });
        }

        if (material.roughnessMapUrl) {
          this.textureLoader.load(material.roughnessMapUrl, (texture) => {
            mat.roughnessMap = texture;
            mat.needsUpdate = true;
          });
        }

        if (material.metalnessMapUrl) {
          this.textureLoader.load(material.metalnessMapUrl, (texture) => {
            mat.metalnessMap = texture;
            mat.needsUpdate = true;
          });
        }

        if (material.aoMapUrl) {
          this.textureLoader.load(material.aoMapUrl, (texture) => {
            mat.aoMap = texture;
            mat.aoMapIntensity = 1;
            mat.needsUpdate = true;
          });
        }

        child.material = mat;
      }
    });

    this.configuration.materials.set(meshName, material);
  }

  changeColor(meshName: string, color: string): void {
    if (!this.model) return;

    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === meshName) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.set(color);
        }
      }
    });

    this.configuration.colors.set(meshName, color);
  }

  async swapPart(partId: string, part: Part3D): Promise<void> {
    if (!this.model) return;

    // Remove old part
    const oldPart = this.model.getObjectByName(part.meshName);
    if (oldPart) {
      this.model.remove(oldPart);
    }

    // Load new part if GLB URL provided
    if (part.glbUrl) {
      const gltf = await this.loader.loadAsync(part.glbUrl);
      const newPart = gltf.scene;
      newPart.name = part.meshName;

      if (part.position) newPart.position.copy(part.position);
      if (part.rotation) newPart.rotation.copy(part.rotation);
      if (part.scale) newPart.scale.copy(part.scale);

      newPart.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.model.add(newPart);
    }

    this.configuration.parts.set(partId, part);
  }

  engraveText(text: string, options: {
    font?: string;
    size?: number;
    depth?: number;
    position?: THREE.Vector3;
    rotation?: THREE.Euler;
    color?: string;
  } = {}): void {
    if (!this.model) return;

    // Remove old text if exists
    const oldText = this.model.getObjectByName('engraved-text');
    if (oldText) {
      this.model.remove(oldText);
    }

    // Create text geometry (simplified - in production use THREE.TextGeometry)
    const textMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.1, options.depth || 0.01),
      new THREE.MeshStandardMaterial({
        color: options.color || '#000000',
        roughness: 0.5,
        metalness: 0.5,
      })
    );

    textMesh.name = 'engraved-text';
    
    if (options.position) textMesh.position.copy(options.position);
    if (options.rotation) textMesh.rotation.copy(options.rotation);

    textMesh.castShadow = true;
    textMesh.receiveShadow = true;

    this.model.add(textMesh);

    this.configuration.text = {
      content: text,
      font: options.font || 'Arial',
      size: options.size || 0.1,
      depth: options.depth || 0.01,
      position: options.position || new THREE.Vector3(0, 0, 0),
      rotation: options.rotation || new THREE.Euler(0, 0, 0),
    };
  }

  renderHighRes(width: number = 2000, height: number = 2000): string {
    // Save current size
    const currentWidth = this.renderer.domElement.width;
    const currentHeight = this.renderer.domElement.height;

    // Set high resolution
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Render
    this.renderer.render(this.scene, this.camera);

    // Get data URL
    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    // Restore original size
    this.renderer.setSize(currentWidth, currentHeight, false);
    this.camera.aspect = currentWidth / currentHeight;
    this.camera.updateProjectionMatrix();

    return dataUrl;
  }

  screenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  getConfiguration(): Configuration3D {
    return this.configuration;
  }

  exportConfiguration(): string {
    return JSON.stringify({
      materials: Array.from(this.configuration.materials.entries()),
      parts: Array.from(this.configuration.parts.entries()),
      colors: Array.from(this.configuration.colors.entries()),
      text: this.configuration.text,
    });
  }

  loadConfiguration(configJson: string): void {
    try {
      const config = JSON.parse(configJson);
      
      if (config.materials) {
        this.configuration.materials = new Map(config.materials);
      }
      
      if (config.parts) {
        this.configuration.parts = new Map(config.parts);
      }
      
      if (config.colors) {
        this.configuration.colors = new Map(config.colors);
      }
      
      if (config.text) {
        this.configuration.text = config.text;
      }

      // Apply configuration
      config.materials?.forEach(([meshName, material]: [string, Material3D]) => {
        this.changeMaterial(meshName, material);
      });

      config.colors?.forEach(([meshName, color]: [string, string]) => {
        this.changeColor(meshName, color);
      });

      if (config.text) {
        this.engraveText(config.text.content, config.text);
      }
    } catch (error) {
      logger.error('Error loading configuration', {
        error,
        configJson: typeof configJson === 'string' ? configJson.substring(0, 100) : 'object',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.controls.dispose();
    this.renderer.dispose();
    
    // Dispose geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getModel(): THREE.Group | null {
    return this.model;
  }
}

export default Configurator3D;
