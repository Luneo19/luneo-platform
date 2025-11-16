export type GLTFFormat = 'gltf' | 'glb';

export interface GLTFOptimizationOptions {
  draco?: {
    compressionLevel?: number;
  };
  [key: string]: unknown;
}

export interface ExportGLTFJobData {
  designId: string;
  modelUrl: string;
  format: GLTFFormat;
  optimization?: GLTFOptimizationOptions;
}

export interface ExportGLTFMetadata {
  designId: string;
  format: GLTFFormat;
  optimization?: GLTFOptimizationOptions;
  exportedAt: string;
  [key: string]: unknown;
}

export interface ExportGLTFResult {
  success: boolean;
  modelUrl: string;
  format: GLTFFormat;
  size: number;
  metadata: ExportGLTFMetadata;
}


