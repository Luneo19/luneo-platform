// AR Viewer Types

export interface ARModel {
  id: string;
  name: string;
  description: string;
  url: string;
  alt: string;
  format: 'gltf' | 'glb' | 'usdz';
  size?: number;
  environmentImage?: string;
  skyboxImage?: string;
  animations?: ARAnimation[];
  materials?: ARMaterial[];
}

export interface ARAnimation {
  name: string;
  duration: number;
  loop: boolean;
}

export interface ARMaterial {
  name: string;
  type: 'standard' | 'pbr' | 'custom';
  properties: {
    color?: string;
    metallic?: number;
    roughness?: number;
    normal?: string;
    ao?: string;
  };
}

export interface ModelViewerProps {
  model: ARModel;
  fallbackImage?: string;
  className?: string;
  autoRotate?: boolean;
  cameraControls?: boolean;
  shadowIntensity?: number;
  exposure?: number;
  onARStart?: () => void;
  onARError?: (error: Error) => void;
  onModelLoad?: () => void;
  onModelError?: (error: Error) => void;
}

export interface ARSupport {
  isARSupported: boolean;
  isWebXRSupported: boolean;
  isSceneViewerSupported: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

export interface ARSession {
  id: string;
  modelId: string;
  startTime: Date;
  endTime?: Date;
  interactions: ARInteraction[];
}

export interface ARInteraction {
  type: 'tap' | 'pinch' | 'rotate' | 'scale' | 'move';
  timestamp: Date;
  data?: any;
}

export interface ARMetrics {
  sessionDuration: number;
  interactionCount: number;
  averageInteractionTime: number;
  modelLoadTime: number;
  arActivationTime: number;
}


