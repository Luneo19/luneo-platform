/**
 * useConfigurator3DValidation hook tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigurator3DValidation } from '@/hooks/configurator-3d/useConfigurator3DValidation';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ valid: true, errors: [], warnings: [] }),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useConfigurator3DValidation', () => {
  beforeEach(() => {
    useConfigurator3DStore.setState({
      configuration: null,
      selections: {},
      validation: { valid: true, errors: [], warnings: [] },
    });
    vi.clearAllMocks();
  });

  it('validate calls store validate', () => {
    useConfigurator3DStore.setState({
      configuration: { components: [{ id: 'c1', isRequired: true, minSelections: 1, maxSelections: 1 } as never], rules: [] } as never,
      selections: {},
      isInitialized: true,
    });
    const { result } = renderHook(() => useConfigurator3DValidation('config-1'));
    act(() => {
      result.current.validate();
    });
    expect(useConfigurator3DStore.getState().validation.valid).toBe(false);
  });

  it('validation result is read from store', () => {
    useConfigurator3DStore.setState({
      validation: { valid: false, errors: [{ code: 'REQUIRED', message: 'Required', componentId: 'c1' }], warnings: [] },
    });
    const { result } = renderHook(() => useConfigurator3DValidation('config-1'));
    expect(result.current.validation.valid).toBe(false);
    expect(result.current.validation.errors).toHaveLength(1);
    expect(result.current.validation.errors[0].componentId).toBe('c1');
  });

  it('isComponentValid returns false when component has error', () => {
    useConfigurator3DStore.setState({
      validation: {
        valid: false,
        errors: [{ code: 'REQUIRED', message: 'Required', componentId: 'comp-1' }],
        warnings: [],
      },
    });
    const { result } = renderHook(() => useConfigurator3DValidation('config-1'));
    expect(result.current.isComponentValid('comp-1')).toBe(false);
    expect(result.current.isComponentValid('comp-2')).toBe(true);
  });

  it('isComponentValid returns true when no error for component', () => {
    useConfigurator3DStore.setState({
      validation: { valid: true, errors: [], warnings: [] },
    });
    const { result } = renderHook(() => useConfigurator3DValidation('config-1'));
    expect(result.current.isComponentValid('comp-1')).toBe(true);
  });

  it('validateRemote calls API and returns ValidationResult', async () => {
    const { result } = renderHook(() => useConfigurator3DValidation('config-1'));
    let remoteResult: { valid: boolean; errors: unknown[]; warnings: unknown[] } | undefined;
    await act(async () => {
      remoteResult = await result.current.validateRemote('cfg-123');
    });
    expect(remoteResult).toBeDefined();
    expect(remoteResult?.valid).toBe(true);
    expect(remoteResult?.errors).toEqual([]);
  });
});
