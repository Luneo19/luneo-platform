export interface RenderRequest {
  id: string;
  type: '2d' | '3d' | 'preview' | 'export';
  productId: string;
  designId?: string;
  options: RenderOptions;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  callback?: string;
}

export interface RenderOptions {
  // Canvas/Scene settings
  width: number;
  height: number;
  dpi?: number;
  backgroundColor?: string;
  
  // Quality settings
  quality?: 'draft' | 'standard' | 'high' | 'ultra';
  antialiasing?: boolean;
  shadows?: boolean;
  reflections?: boolean;
  
  // 2D specific
  format?: 'png' | 'jpg' | 'webp' | 'svg';
  compression?: number;
  
  // 3D specific
  camera?: CameraSettings;
  lighting?: LightingSettings;
  materials?: MaterialSettings[];
  
  // Export specific
  exportFormat?: 'gltf' | 'glb' | 'usdz' | 'obj' | 'fbx';
  includeAnimations?: boolean;
  optimizeForWeb?: boolean;
}

export interface CameraSettings {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov?: number;
  near?: number;
  far?: number;
  type?: 'perspective' | 'orthographic';
}

export interface LightingSettings {
  ambient: {
    color: string;
    intensity: number;
  };
  directional: {
    color: string;
    intensity: number;
    position: { x: number; y: number; z: number };
    castShadow?: boolean;
  }[];
  point: {
    color: string;
    intensity: number;
    position: { x: number; y: number; z: number };
    distance?: number;
  }[];
}

export interface MaterialSettings {
  name: string;
  type: 'standard' | 'pbr' | 'custom';
  properties: {
    color?: string;
    metalness?: number;
    roughness?: number;
    normalMap?: string;
    aoMap?: string;
    emissiveMap?: string;
    opacity?: number;
    transparent?: boolean;
  };
}

export interface RenderResult {
  id: string;
  status: 'success' | 'failed' | 'processing';
  url?: string;
  thumbnailUrl?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
    renderTime: number;
    quality: string;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface RenderJob {
  id: string;
  type: 'render-2d' | 'render-3d' | 'export';
  data: RenderJobData;
  options: {
    attempts: number;
    backoff: {
      type: 'exponential';
      delay: number;
    };
    removeOnComplete: number;
    removeOnFail: number;
  };
}

export interface RenderJobData {
  requestId: string;
  productId: string;
  designId?: string;
  options: RenderOptions;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  userId?: string;
  brandId: string;
}

export interface AssetInfo {
  id: string;
  type: 'image' | 'model' | 'texture' | 'video';
  url: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}

export interface SceneNode {
  id: string;
  type: 'mesh' | 'light' | 'camera' | 'group';
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  children?: SceneNode[];
  properties?: Record<string, any>;
}

export interface ExportSettings {
  format: 'gltf' | 'glb' | 'usdz' | 'obj' | 'fbx' | 'png' | 'jpg';
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  optimizeForWeb: boolean;
  includeAnimations: boolean;
  includeMaterials: boolean;
  includeTextures: boolean;
  compressionLevel?: number;
  metadata?: Record<string, any>;
}

export interface RenderMetrics {
  totalRenders: number;
  successfulRenders: number;
  failedRenders: number;
  averageRenderTime: number;
  queueLength: number;
  activeWorkers: number;
  memoryUsage: number;
  gpuUsage?: number;
  lastUpdated: Date;
}

export interface RenderStats {
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageRenderTime: number;
  requestsByType: Record<string, number>;
  requestsByQuality: Record<string, number>;
  topProducts: Array<{
    productId: string;
    requestCount: number;
  }>;
  performanceMetrics: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface RenderConfig {
  maxConcurrentJobs: number;
  maxRenderTime: number; // in seconds
  defaultQuality: 'standard' | 'high';
  enableGPU: boolean;
  enableCaching: boolean;
  cacheExpiration: number; // in seconds
  retryAttempts: number;
  retryDelay: number;
  cleanupInterval: number;
  maxCacheSize: number; // in MB
}

export interface RenderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface RenderTemplate {
  id: string;
  name: string;
  description: string;
  category: 'product' | 'lifestyle' | 'technical' | 'artistic';
  thumbnailUrl: string;
  settings: RenderOptions;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchRenderRequest {
  id: string;
  requests: RenderRequest[];
  options: {
    parallel: boolean;
    maxConcurrency?: number;
    notifyOnComplete: boolean;
    webhookUrl?: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  results: RenderResult[];
  createdAt: Date;
  completedAt?: Date;
}


