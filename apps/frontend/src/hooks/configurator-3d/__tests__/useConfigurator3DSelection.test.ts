/**
 * useConfigurator3DSelection hook tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigurator3DSelection } from '@/hooks/configurator-3d/useConfigurator3DSelection';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import type { Configurator3DConfig, BackendConfigurator3DConfig } from '@/lib/configurator-3d/types/configurator.types';

vi.mock('@/lib/api/client', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

const minimalBackend: BackendConfigurator3DConfig = {
  id: 'cfg-1',
  name: 'Test',
  type: 'CUSTOM',
  status: 'PUBLISHED',
  components: [
    {
      id: 'comp-1',
      name: 'Color',
      type: 'COLOR',
      selectionMode: 'SINGLE',
      isRequired: false,
      minSelections: 0,
      maxSelections: 1,
      sortOrder: 0,
      isVisible: true,
      isEnabled: true,
      options: [
        { id: 'opt-1', name: 'Red', type: 'COLOR', sortOrder: 0, isDefault: true, isEnabled: true, isVisible: true },
        { id: 'opt-2', name: 'Blue', type: 'COLOR', sortOrder: 1, isDefault: false, isEnabled: true, isVisible: true },
      ],
    },
    {
      id: 'comp-2',
      name: 'Multi',
      type: 'ACCESSORY',
      selectionMode: 'MULTIPLE',
      isRequired: false,
      minSelections: 0,
      maxSelections: 2,
      sortOrder: 1,
      isVisible: true,
      isEnabled: true,
      options: [
        { id: 'm1', name: 'M1', type: 'MODEL', sortOrder: 0, isDefault: false, isEnabled: true, isVisible: true },
        { id: 'm2', name: 'M2', type: 'MODEL', sortOrder: 1, isDefault: false, isEnabled: true, isVisible: true },
      ],
    },
  ],
  rules: [],
};

function mapConfig(b: BackendConfigurator3DConfig): Configurator3DConfig {
  return {
    id: b.id,
    name: b.name,
    type: b.type,
    status: b.status,
    components: (b.components || []).map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type as Configurator3DConfig['components'][0]['type'],
      selectionMode: c.selectionMode,
      isRequired: c.isRequired,
      minSelections: c.minSelections,
      maxSelections: c.maxSelections,
      sortOrder: c.sortOrder,
      isVisible: c.isVisible,
      isEnabled: c.isEnabled,
      options: (c.options || []).map((o) => ({
        id: o.id,
        componentId: c.id,
        name: o.name,
        type: o.type,
        sortOrder: o.sortOrder,
        isDefault: o.isDefault,
        isEnabled: o.isEnabled,
        isVisible: o.isVisible,
        pricing: { priceDelta: 0, pricingType: 'FIXED', priceModifier: 0 },
      })),
    })),
    rules: [],
  };
}

describe('useConfigurator3DSelection', () => {
  beforeEach(() => {
    useConfigurator3DStore.setState({
      configuration: mapConfig(minimalBackend),
      selections: {},
      defaultSelections: { 'comp-1': 'opt-1' },
      isInitialized: true,
    });
    vi.clearAllMocks();
  });

  it('selectOption calls store selectOption', () => {
    const { result } = renderHook(() => useConfigurator3DSelection());
    act(() => {
      result.current.selectOption('comp-1', 'opt-2');
    });
    expect(useConfigurator3DStore.getState().selections['comp-1']).toBe('opt-2');
  });

  it('deselectOption calls store deselectOption', () => {
    useConfigurator3DStore.setState({ selections: { 'comp-2': ['m1', 'm2'] } });
    const { result } = renderHook(() => useConfigurator3DSelection());
    act(() => {
      result.current.deselectOption('comp-2', 'm1');
    });
    expect(useConfigurator3DStore.getState().selections['comp-2']).toEqual(['m2']);
  });

  it('toggleOption selects when not selected', () => {
    const { result } = renderHook(() => useConfigurator3DSelection());
    act(() => {
      result.current.toggleOption('comp-1', 'opt-2');
    });
    expect(result.current.isOptionSelected('comp-1', 'opt-2')).toBe(true);
  });

  it('toggleOption deselects when selected (MULTIPLE)', () => {
    useConfigurator3DStore.setState({ selections: { 'comp-2': ['m1'] } });
    const { result } = renderHook(() => useConfigurator3DSelection());
    act(() => {
      result.current.toggleOption('comp-2', 'm1');
    });
    expect(result.current.isOptionSelected('comp-2', 'm1')).toBe(false);
  });

  it('isOptionSelected returns true for selected SINGLE option', () => {
    useConfigurator3DStore.setState({ selections: { 'comp-1': 'opt-2' } });
    const { result } = renderHook(() => useConfigurator3DSelection());
    expect(result.current.isOptionSelected('comp-1', 'opt-2')).toBe(true);
    expect(result.current.isOptionSelected('comp-1', 'opt-1')).toBe(false);
  });

  it('isOptionSelected returns true for selected option in MULTIPLE', () => {
    useConfigurator3DStore.setState({ selections: { 'comp-2': ['m1', 'm2'] } });
    const { result } = renderHook(() => useConfigurator3DSelection());
    expect(result.current.isOptionSelected('comp-2', 'm1')).toBe(true);
    expect(result.current.isOptionSelected('comp-2', 'm2')).toBe(true);
  });

  it('getSelectedOption returns correct value for SINGLE', () => {
    useConfigurator3DStore.setState({ selections: { 'comp-1': 'opt-2' } });
    const { result } = renderHook(() => useConfigurator3DSelection());
    expect(result.current.getSelectedOption('comp-1')).toBe('opt-2');
    expect(result.current.getSelectedOption('comp-2')).toBeUndefined();
  });

  it('getSelectedOption returns correct value for MULTIPLE', () => {
    useConfigurator3DStore.setState({ selections: { 'comp-2': ['m1', 'm2'] } });
    const { result } = renderHook(() => useConfigurator3DSelection());
    expect(result.current.getSelectedOption('comp-2')).toEqual(['m1', 'm2']);
  });

  it('resetComponent calls store resetComponent', () => {
    useConfigurator3DStore.setState({ selections: { 'comp-1': 'opt-2' } });
    const { result } = renderHook(() => useConfigurator3DSelection());
    act(() => {
      result.current.resetComponent('comp-1');
    });
    expect(useConfigurator3DStore.getState().selections['comp-1']).toBe('opt-1');
  });

  it('resetAll calls store resetAll', () => {
    useConfigurator3DStore.setState({ selections: { 'comp-1': 'opt-2' } });
    const { result } = renderHook(() => useConfigurator3DSelection());
    act(() => {
      result.current.resetAll();
    });
    expect(useConfigurator3DStore.getState().selections['comp-1']).toBe('opt-1');
  });
});
