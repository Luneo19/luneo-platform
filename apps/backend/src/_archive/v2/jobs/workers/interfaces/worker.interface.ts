export interface WorkerJobData {
  id: string;
  type: string;
  data: unknown;
  options?: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete?: number;
    removeOnFail?: number;
  };
}

export interface WorkerResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface DesignJobData extends WorkerJobData {
  type: 'design-validation' | 'design-optimization' | 'design-rendering';
  data: {
    designId: string;
    productId: string;
    userId: string;
    brandId: string;
    options: Record<string, unknown>;
  };
}

export interface ProductionJobData extends WorkerJobData {
  type: 'production-bundle' | 'quality-control' | 'manufacturing-instructions';
  data: {
    orderId: string;
    designId: string;
    productId: string;
    quantity: number;
    options: Record<string, unknown>;
  };
}

export interface RenderJobData extends WorkerJobData {
  type: 'render-2d' | 'render-3d' | 'export';
  data: {
    renderId: string;
    designId: string;
    productId: string;
    options: Record<string, unknown>;
  };
}


