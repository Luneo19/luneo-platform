/**
 * ARViewer - Tests unitaires (Vitest)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ARViewer } from '../ARViewer';
import * as AREngineModule from '@/lib/ar/AREngine';

// Mock ARPreview to avoid loading @react-three/fiber in jsdom
vi.mock('@/components/ar/ARPreview', () => ({
  ARPreview: () => <div data-testid="ar-preview-mock">AR Preview</div>,
}));

// Mock getPlatformConfig and AR providers so ARViewer doesn't hit native/async code
vi.mock('@/lib/ar/platforms/PlatformRouter', () => ({
  getPlatformConfig: () => Promise.resolve({ platform: 'desktop', method: 'webxr' }),
}));
vi.mock('@/lib/ar/platforms/ARQuickLookProvider', () => ({ launch: vi.fn() }));
vi.mock('@/lib/ar/platforms/SceneViewerProvider', () => ({ launch: vi.fn() }));

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/hooks/useErrorToast', () => ({
  getErrorDisplayMessage: (e: Error) =>
    e?.message?.toLowerCase().includes('camera') || e?.message?.toLowerCase().includes('denied')
      ? 'Caméra non disponible'
      : (e?.message ?? 'Error'),
}));
vi.mock('@/components/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: any) => <>{children}</> }));
vi.mock('next/script', () => ({ default: ({ children }: any) => <>{children}</> }));
vi.mock('@/i18n/useI18n', () => ({
  useI18n: () => ({
    t: (k: string) => (k === 'arStudio.startCamera' ? 'Démarrer' : k === 'common.retry' ? 'Réessayer' : k),
  }),
}));

// Mock AREngine
vi.mock('@/lib/ar/AREngine', () => ({
  AREngine: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    captureImage: vi.fn().mockReturnValue('data:image/png;base64,...'),
    loadProduct: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('ARViewer', () => {
  const mockProducts = [
    {
      id: 'prod-1',
      modelUrl: '/models/product.glb',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      attachmentPoint: 'ring_finger',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render AR viewer', () => {
    render(
      <ARViewer
        products={mockProducts}
        trackerType="hand"
        onCapture={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /démarrer/i })).toBeInTheDocument();
  });

  it('should initialize AR when start button is clicked', async () => {
    const mockInitialize = vi.fn().mockResolvedValue(undefined);
    (AREngineModule.AREngine as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      initialize: mockInitialize,
      start: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
      captureImage: vi.fn(),
      loadProduct: vi.fn().mockResolvedValue(undefined),
    }));

    render(
      <ARViewer
        products={mockProducts}
        trackerType="hand"
        onCapture={vi.fn()}
      />,
    );

    const startButton = screen.getByRole('button', { name: /démarrer/i });
    startButton.click();

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });
  });

  it('should handle camera access error', async () => {
    const mockInitialize = vi.fn().mockRejectedValue(new Error('Camera access denied'));
    (AREngineModule.AREngine as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      initialize: mockInitialize,
      start: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
      captureImage: vi.fn(),
      loadProduct: vi.fn(),
    }));

    render(
      <ARViewer
        products={mockProducts}
        trackerType="hand"
        onCapture={vi.fn()}
      />,
    );

    const startButton = screen.getByRole('button', { name: /démarrer/i });
    startButton.click();

    // On error, component shows retry button (Réessayer) instead of start
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument();
    });
  });
});
