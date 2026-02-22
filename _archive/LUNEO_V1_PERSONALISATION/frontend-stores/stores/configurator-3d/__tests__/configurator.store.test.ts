/**
 * Configurator 3D Zustand store tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import type { Configurator3DConfig, BackendConfigurator3DConfig } from '@/lib/configurator-3d/types/configurator.types';

vi.mock('@/lib/api/client', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

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

function getState() {
  return useConfigurator3DStore.getState();
}

describe('configurator-3d store', () => {
  beforeEach(() => {
    useConfigurator3DStore.setState({
      configuration: null,
      selections: {},
      defaultSelections: {},
      history: [],
      historyIndex: -1,
      validation: { valid: true, errors: [], warnings: [] },
    });
    vi.clearAllMocks();
  });

  it('initial state has expected values', () => {
    expect(getState().configuration).toBeNull();
    expect(getState().selections).toEqual({});
    expect(getState().price).toBe(0);
    expect(getState().validation.valid).toBe(true);
    expect(getState().history).toEqual([]);
    expect(getState().historyIndex).toBe(-1);
  });

  it('selectOption in SINGLE mode replaces previous selection', () => {
    const config = mapConfig(minimalBackend);
    useConfigurator3DStore.setState({ configuration: config, defaultSelections: { 'comp-1': 'opt-1' }, selections: { 'comp-1': 'opt-1' }, isInitialized: true });
    getState().selectOption('comp-1', 'opt-2');
    expect(getState().selections['comp-1']).toBe('opt-2');
  });

  it('selectOption in MULTIPLE mode adds option', () => {
    const config = mapConfig(minimalBackend);
    useConfigurator3DStore.setState({ configuration: config, selections: {}, isInitialized: true });
    getState().selectOption('comp-2', 'm1');
    expect(getState().selections['comp-2']).toEqual(['m1']);
    getState().selectOption('comp-2', 'm2');
    expect(getState().selections['comp-2']).toEqual(['m1', 'm2']);
  });

  it('deselectOption removes option in MULTIPLE mode', () => {
    const config = mapConfig(minimalBackend);
    useConfigurator3DStore.setState({ configuration: config, selections: { 'comp-2': ['m1', 'm2'] }, isInitialized: true });
    getState().deselectOption('comp-2', 'm1');
    expect(getState().selections['comp-2']).toEqual(['m2']);
  });

  it('resetComponent restores default for component', () => {
    const config = mapConfig(minimalBackend);
    useConfigurator3DStore.setState({ configuration: config, defaultSelections: { 'comp-1': 'opt-1' }, selections: { 'comp-1': 'opt-2' }, isInitialized: true });
    getState().resetComponent('comp-1');
    expect(getState().selections['comp-1']).toBe('opt-1');
  });

  it('resetAll clears history and resets to defaults', () => {
    const config = mapConfig(minimalBackend);
    useConfigurator3DStore.setState({
      configuration: config,
      defaultSelections: { 'comp-1': 'opt-1' },
      selections: { 'comp-1': 'opt-2' },
      history: [{ id: 'h1', action: 'SELECT_OPTION', componentId: 'comp-1', optionId: 'opt-2', newValue: 'opt-2', timestamp: 1 }],
      historyIndex: 0,
      isInitialized: true,
    });
    getState().resetAll();
    expect(getState().selections['comp-1']).toBe('opt-1');
    expect(getState().history).toEqual([]);
    expect(getState().historyIndex).toBe(-1);
  });

  it('undo restores previous selection', () => {
    const config = mapConfig(minimalBackend);
    useConfigurator3DStore.setState({
      configuration: config,
      defaultSelections: { 'comp-1': 'opt-1' },
      selections: { 'comp-1': 'opt-2' },
      history: [{ id: 'h1', action: 'SELECT_OPTION', componentId: 'comp-1', optionId: 'opt-2', previousValue: 'opt-1', newValue: 'opt-2', timestamp: 1 }],
      historyIndex: 0,
      isInitialized: true,
    });
    getState().undo();
    expect(getState().selections['comp-1']).toBe('opt-1');
    expect(getState().historyIndex).toBe(-1);
  });

  it('redo applies next history entry', () => {
    const config = mapConfig(minimalBackend);
    useConfigurator3DStore.setState({
      configuration: config,
      defaultSelections: { 'comp-1': 'opt-1' },
      selections: { 'comp-1': 'opt-1' },
      history: [{ id: 'h1', action: 'SELECT_OPTION', componentId: 'comp-1', optionId: 'opt-2', previousValue: 'opt-1', newValue: 'opt-2', timestamp: 1 }],
      historyIndex: -1,
      isInitialized: true,
    });
    getState().redo();
    expect(getState().selections['comp-1']).toBe('opt-2');
    expect(getState().historyIndex).toBe(0);
  });

  it('canUndo returns true when historyIndex >= 0', () => {
    useConfigurator3DStore.setState({ history: [{ id: 'h1', action: 'SELECT_OPTION', timestamp: 1 }], historyIndex: 0 });
    expect(getState().canUndo()).toBe(true);
    useConfigurator3DStore.setState({ historyIndex: -1 });
    expect(getState().canUndo()).toBe(false);
  });

  it('canRedo returns true when historyIndex < history.length - 1', () => {
    useConfigurator3DStore.setState({ history: [{ id: 'h1', action: 'SELECT_OPTION', timestamp: 1 }], historyIndex: -1 });
    expect(getState().canRedo()).toBe(true);
    useConfigurator3DStore.setState({ historyIndex: 0 });
    expect(getState().canRedo()).toBe(false);
  });

  it('clearHistory empties history', () => {
    useConfigurator3DStore.setState({ history: [{ id: 'h1', action: 'SELECT_OPTION', timestamp: 1 }], historyIndex: 0 });
    getState().clearHistory();
    expect(getState().history).toEqual([]);
    expect(getState().historyIndex).toBe(-1);
  });

  it('calculatePrice calls API and updates price when config has pricing', async () => {
    const config = mapConfig(minimalBackend);
    (config as Configurator3DConfig & { features?: { enablePricing?: boolean } }).features = { enablePricing: true };
    useConfigurator3DStore.setState({ configuration: config, selections: { 'comp-1': 'opt-1' }, isInitialized: true });
    vi.mocked(api.post).mockResolvedValue({ total: 99, basePrice: 99, optionsTotal: 0, subtotal: 99, taxAmount: 0, total: 99, currency: 'EUR', breakdown: [] });
    await getState().calculatePrice();
    expect(api.post).toHaveBeenCalledWith(expect.stringContaining('calculate-price'), expect.objectContaining({ selections: { 'comp-1': 'opt-1' } }));
    expect(getState().price).toBe(99);
    expect(getState().priceBreakdown).not.toBeNull();
  });

  it('validate sets validation errors for required component without selection', () => {
    const comps = minimalBackend.components!.map((c) => (c.id === 'comp-1' ? { ...c, isRequired: true } : c));
    const config = mapConfig({ ...minimalBackend, components: comps });
    useConfigurator3DStore.setState({ configuration: config, selections: {}, isInitialized: true });
    getState().validate();
    expect(getState().validation.valid).toBe(false);
    expect(getState().validation.errors.length).toBeGreaterThan(0);
  });

  it('applySelections replaces selections', () => {
    const config = mapConfig(minimalBackend);
    useConfigurator3DStore.setState({ configuration: config, selections: {}, isInitialized: true });
    getState().applySelections({ 'comp-1': 'opt-2' });
    expect(getState().selections['comp-1']).toBe('opt-2');
  });

  it('history is recorded on selection change', () => {
    const config = mapConfig(minimalBackend);
    useConfigurator3DStore.setState({ configuration: config, defaultSelections: { 'comp-1': 'opt-1' }, selections: { 'comp-1': 'opt-1' }, history: [], historyIndex: -1, isInitialized: true });
    getState().selectOption('comp-1', 'opt-2');
    expect(getState().history.length).toBe(1);
    expect(getState().history[0].action).toBe('SELECT_OPTION');
    expect(getState().history[0].optionId).toBe('opt-2');
    expect(getState().historyIndex).toBe(0);
  });
});
