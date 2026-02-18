/**
 * AR Studio - Common test utilities: mocks and sample data factories.
 */

import { StorageService } from '@/libs/storage/storage.service';
import { ModelValidationStatus, ARConversionStatus } from '@prisma/client';

/** Type for AR Prisma mocks so nested methods are Jest mocks. */
export interface ARPrismaMock {
  aR3DModel: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock };
  aRModelConversion: { findMany: jest.Mock; create: jest.Mock };
  aRProject: { findUnique: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock };
  aRSession: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; groupBy: jest.Mock };
  aRQRCode: { findUnique: jest.Mock; create: jest.Mock; updateMany: jest.Mock };
  aRQRScan: { findMany: jest.Mock };
  aRCollaborationRoom: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock };
  aRRoomParticipant: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
  aRImageTarget: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; count: jest.Mock };
  productARConfig: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock };
  product: { findUnique: jest.Mock };
}

/** Creates a mocked PrismaService with AR-related delegates. */
export function createMockPrismaService(): ARPrismaMock {
  return {
    aR3DModel: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    aRModelConversion: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    aRProject: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    aRSession: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    aRQRCode: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    aRQRScan: {
      findMany: jest.fn(),
    },
    aRCollaborationRoom: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    aRRoomParticipant: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    aRImageTarget: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    productARConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };
}

/** Creates a mocked StorageService. */
export function createMockStorageService(): jest.Mocked<Pick<StorageService, 'uploadBuffer' | 'uploadFile'>> {
  return {
    uploadBuffer: jest.fn().mockResolvedValue('https://cdn.example.com/ar-models/test.glb'),
    uploadFile: jest.fn().mockResolvedValue('https://cdn.example.com/file'),
  };
}

/** Creates a mocked Bull Queue. */
export function createMockQueue(): { add: jest.Mock; addBulk: jest.Mock } {
  return {
    add: jest.fn().mockResolvedValue({ id: 'job-1', name: 'convert-model' }),
    addBulk: jest.fn().mockResolvedValue([]),
  };
}

/** Sample AR3DModel record. */
export function createSampleModel(overrides: Partial<{
  id: string;
  projectId: string;
  name: string;
  originalFormat: string;
  originalFileURL: string;
  originalFileSize: number;
  polyCount: number;
  materialCount: number;
  validationStatus: ModelValidationStatus;
}> = {}) {
  return {
    id: 'model-1',
    projectId: 'project-1',
    name: 'Sample Model',
    originalFileName: 'model.glb',
    originalFormat: 'glb',
    originalFileURL: 'https://cdn.example.com/model.glb',
    originalFileSize: 5 * 1024 * 1024,
    gltfURL: null,
    gltfDracoURL: null,
    usdzURL: null,
    thumbnailURL: null,
    lodLevels: null,
    polyCount: 10000,
    textureCount: 2,
    materialCount: 1,
    dimensions: null,
    boundingBox: null,
    validationStatus: ModelValidationStatus.PENDING,
    validationErrors: [],
    autoFixApplied: [],
    estimatedLoadTime: null,
    recommendedLOD: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Sample ARProject record. */
export function createSampleProject(overrides: Partial<{ id: string; brandId: string; name: string }> = {}) {
  return {
    id: 'project-1',
    brandId: 'brand-1',
    name: 'AR Project',
    ...overrides,
  };
}

/** Sample ARSession record. */
export function createSampleSession(overrides: Partial<{
  id: string;
  projectId: string;
  modelId: string | null;
  platform: string;
  device: string;
  browser: string;
  arMethod: string;
  duration: number | null;
  endedAt: Date | null;
}> = {}) {
  return {
    id: 'session-1',
    projectId: 'project-1',
    modelId: 'model-1',
    userId: null,
    platform: 'ios',
    device: 'iPhone',
    browser: 'Safari',
    arMethod: 'ar-quick-look',
    featuresUsed: [],
    startedAt: new Date(),
    endedAt: null,
    duration: 30000,
    placementCount: null,
    rotationCount: null,
    scaleChangeCount: null,
    screenshotsTaken: null,
    shareCount: null,
    trackingQuality: null,
    conversionAction: null,
    conversionValue: null,
    errors: [],
    country: null,
    region: null,
    ...overrides,
  };
}

/** Sample ARModelConversion record. */
export function createSampleConversion(overrides: Partial<{
  id: string;
  modelId: string;
  sourceFormat: string;
  targetFormat: string;
  status: ARConversionStatus;
}> = {}) {
  return {
    id: 'conv-1',
    modelId: 'model-1',
    sourceFormat: 'glb',
    targetFormat: 'usdz',
    status: ARConversionStatus.COMPLETED,
    processingTime: 5000,
    compressionRatio: null,
    qualityScore: null,
    errorMessage: null,
    errorStack: null,
    createdAt: new Date(),
    completedAt: new Date(),
    ...overrides,
  };
}

/** Sample ARCollaborationRoom record (with optional relations for include). */
export function createSampleRoom(
  overrides: Partial<{
    id: string;
    projectId: string;
    hostUserId: string;
    status: string;
    maxParticipants: number;
    endedAt: Date | null;
  }> & { project?: { id: string; name: string }; participants?: unknown[] } = {},
) {
  const { project, participants, ...rest } = overrides;
  return {
    id: 'room-1',
    projectId: 'project-1',
    name: 'Room 1',
    hostUserId: 'user-1',
    status: 'ACTIVE',
    maxParticipants: 10,
    allowVoiceChat: true,
    allowAnnotations: true,
    allowModelEditing: false,
    createdAt: new Date(),
    endedAt: null,
    project: project ?? { id: 'proj-1', name: 'Project' },
    participants: participants ?? [],
    ...rest,
  };
}

/** Sample ARQRCode record. */
export function createSampleQRCode(overrides: Partial<{ id: string; shortCode: string; targetURL: string }> = {}) {
  return {
    id: 'qr-1',
    projectId: 'project-1',
    type: 'AR_VIEWER',
    targetURL: 'https://app.example.com/ar/view/model-1',
    shortCode: 'abc12xyz',
    name: 'AR Link',
    description: null,
    scanCount: 0,
    isActive: true,
    ...overrides,
  };
}
