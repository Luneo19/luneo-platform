export interface WorkerJobData {
  id: string;
  type: string;
  data: any;
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
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface DesignJobData extends WorkerJobData {
  type: 'design-validation' | 'design-optimization' | 'design-rendering';
  data: {
    designId: string;
    productId: string;
    userId: string;
    brandId: string;
    options: any;
  };
}

export interface ProductionJobData extends WorkerJobData {
  type: 'production-bundle' | 'quality-control' | 'manufacturing-instructions';
  data: {
    orderId: string;
    designId: string;
    productId: string;
    quantity: number;
    options: any;
  };
}

export interface RenderJobData extends WorkerJobData {
  type: 'render-2d' | 'render-3d' | 'export';
  data: {
    renderId: string;
    designId: string;
    productId: string;
    options: any;
  };
}


