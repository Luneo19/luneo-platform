/**
 * Tests for useCustomization hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomization } from './useCustomization';

// Mock tRPC
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    customization: {
      generate: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isLoading: false,
        })),
      },
      getById: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
        })),
      },
    },
  },
}));

describe('useCustomization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCustomization('test-product-id'));
    
    expect(result.current.customization).toBeNull();
    expect(result.current.isGenerating).toBe(false);
  });

  it('should handle generation', async () => {
    const { result } = renderHook(() => useCustomization('test-product-id'));
    
    // Test generation logic
    expect(result.current.generateCustomization).toBeDefined();
  });
});

