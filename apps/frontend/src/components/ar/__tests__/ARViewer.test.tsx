/**
 * ARViewer - Tests unitaires
 */

import { render, screen, waitFor } from '@testing-library/react';
import { ARViewer } from '../ARViewer';
import * as AREngineModule from '@/lib/ar/AREngine';

// Mock AREngine
jest.mock('@/lib/ar/AREngine', () => ({
  AREngine: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    start: jest.fn(),
    stop: jest.fn(),
    dispose: jest.fn(),
    captureImage: jest.fn().mockReturnValue('data:image/png;base64,...'),
    loadProduct: jest.fn().mockResolvedValue(undefined),
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
    jest.clearAllMocks();
  });

  it('should render AR viewer', () => {
    // Act
    render(
      <ARViewer
        products={mockProducts}
        trackerType="hand"
        onCapture={jest.fn()}
      />,
    );

    // Assert
    expect(screen.getByRole('button', { name: /démarrer/i })).toBeInTheDocument();
  });

  it('should initialize AR when start button is clicked', async () => {
    // Arrange
    const mockInitialize = jest.fn().mockResolvedValue(undefined);
    (AREngineModule.AREngine as jest.Mock).mockImplementation(() => ({
      initialize: mockInitialize,
      start: jest.fn(),
      stop: jest.fn(),
      dispose: jest.fn(),
      captureImage: jest.fn(),
      loadProduct: jest.fn().mockResolvedValue(undefined),
    }));

    // Act
    render(
      <ARViewer
        products={mockProducts}
        trackerType="hand"
        onCapture={jest.fn()}
      />,
    );

    const startButton = screen.getByRole('button', { name: /démarrer/i });
    startButton.click();

    // Assert
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });
  });

  it('should handle camera access error', async () => {
    // Arrange
    const mockInitialize = jest.fn().mockRejectedValue(
      new Error('Camera access denied'),
    );
    (AREngineModule.AREngine as jest.Mock).mockImplementation(() => ({
      initialize: mockInitialize,
      start: jest.fn(),
      stop: jest.fn(),
      dispose: jest.fn(),
      captureImage: jest.fn(),
      loadProduct: jest.fn(),
    }));

    // Act
    render(
      <ARViewer
        products={mockProducts}
        trackerType="hand"
        onCapture={jest.fn()}
      />,
    );

    const startButton = screen.getByRole('button', { name: /démarrer/i });
    startButton.click();

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/caméra non disponible/i)).toBeInTheDocument();
    });
  });
});
