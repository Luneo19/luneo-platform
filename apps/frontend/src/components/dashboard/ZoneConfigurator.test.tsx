/**
 * Tests for ZoneConfigurator component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { ZoneConfigurator } from './ZoneConfigurator';

// Mock Three.js
vi.mock('three', () => ({
  Scene: vi.fn(),
  PerspectiveCamera: vi.fn(),
  WebGLRenderer: vi.fn(),
  BoxGeometry: vi.fn(),
  MeshStandardMaterial: vi.fn(),
  Mesh: vi.fn(),
  AmbientLight: vi.fn(),
  DirectionalLight: vi.fn(),
}));

describe('ZoneConfigurator', () => {
  const mockProps = {
    productId: 'test-product-id',
    modelUrl: 'https://example.com/model.glb',
    onSave: vi.fn(),
  };

  it('should render zone configurator', () => {
    render(<ZoneConfigurator {...mockProps} />);
    expect(screen.getByText(/zone/i)).toBeInTheDocument();
  });

  it('should call onSave when save button is clicked', async () => {
    render(<ZoneConfigurator {...mockProps} />);
    
    const saveButton = screen.getByRole('button', { name: /sauvegarder|save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalled();
    });
  });
});

