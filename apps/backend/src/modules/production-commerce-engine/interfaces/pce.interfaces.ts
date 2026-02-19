import { PipelineStatus, FulfillmentStatus } from '@prisma/client';
import { PipelineStageId } from '../pce.constants';

export interface PipelineStageDefinition {
  id: PipelineStageId;
  name: string;
  required: boolean;
  config?: Record<string, unknown>;
}

export interface ProcessOrderParams {
  orderId: string;
  brandId: string;
  options?: ProcessOrderOptions;
}

export interface ProcessOrderOptions {
  skipRender?: boolean;
  skipProduction?: boolean;
  priority?: number;
  rushOrder?: boolean;
}

export interface OrderProcessingResult {
  pipelineId: string;
  orderId: string;
  status: PipelineStatus;
  currentStage: string;
  estimatedCompletion?: Date;
}

export interface PipelineStageStatus {
  id: string;
  name: string;
  required: boolean;
  status: 'pending' | 'current' | 'completed' | 'failed';
  startedAt?: Date;
  duration?: number;
}

export interface PipelineDetailedStatus {
  id: string;
  orderId: string;
  brandId: string;
  status: PipelineStatus;
  currentStage: string;
  progress: number;
  stages: PipelineStageStatus[];
  errors: PipelineErrorInfo[];
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletion?: Date;
}

export interface PipelineErrorInfo {
  id: string;
  stage: string;
  error: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  retryCount: number;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface DashboardStats {
  totalOrders: number;
  processingOrders: number;
  completedToday: number;
  failedToday: number;
  avgProcessingTimeMs: number;
}

export interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface DashboardData {
  stats: DashboardStats;
  queueStatus: Record<string, QueueStatus>;
  recentPipelines: PipelineSummary[];
  alerts: AlertInfo[];
}

export interface PipelineSummary {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerEmail?: string;
  currentStage: string;
  progress: number;
  status: PipelineStatus;
  updatedAt: Date;
}

export interface AlertInfo {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  stage?: string;
  pipelineId?: string;
  createdAt: Date;
}

export interface FulfillmentInfo {
  id: string;
  pipelineId: string;
  orderId: string;
  status: FulfillmentStatus;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  estimatedDelivery?: Date;
}

export interface StageTransitionEvent {
  pipelineId: string;
  orderId: string;
  brandId: string;
  stage: string;
  nextStage?: string;
  error?: string;
  retryable?: boolean;
  triggeredBy?: string;
  retry?: boolean;
}
