/**
 * Tests for useCustomization hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomization } from './useCustomization';

// Mock tRPC - Utiliser le mock global depuis setup.ts
// Le mock est déjà défini dans src/test/setup.ts

describe('useCustomization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => 
      useCustomization({ 
        productId: 'test-product-id',
        zoneId: 'test-zone-id'
      })
    );
    
    // Le hook retourne directement les propriétés, pas un objet state
    expect(result.current.status).toBe('idle');
    expect(result.current.customizationId).toBeNull();
    expect(result.current.isGenerating).toBe(false);
  });

  it('should handle generation', async () => {
    const { result } = renderHook(() => 
      useCustomization({ 
        productId: 'test-product-id',
        zoneId: 'test-zone-id'
      })
    );
    
    // Le hook retourne `generate`, pas `generateCustomization`
    expect(result.current.generate).toBeDefined();
    expect(typeof result.current.generate).toBe('function');
  });
});

