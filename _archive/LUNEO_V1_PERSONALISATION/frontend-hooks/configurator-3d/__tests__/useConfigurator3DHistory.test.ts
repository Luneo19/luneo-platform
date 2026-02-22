/**
 * useConfigurator3DHistory hook tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfigurator3DHistory } from '@/hooks/configurator-3d/useConfigurator3DHistory';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';

vi.mock('@/lib/api/client', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

describe('useConfigurator3DHistory', () => {
  beforeEach(() => {
    useConfigurator3DStore.setState({
      history: [],
      historyIndex: -1,
    });
  });

  it('undo calls store undo and restores previous selection', () => {
    useConfigurator3DStore.setState({
      configuration: { components: [], rules: [] } as never,
      selections: { 'comp-1': 'opt-2' },
      defaultSelections: { 'comp-1': 'opt-1' },
      history: [
        { id: 'h1', action: 'SELECT_OPTION', componentId: 'comp-1', optionId: 'opt-2', previousValue: 'opt-1', newValue: 'opt-2', timestamp: 1 },
      ],
      historyIndex: 0,
      isInitialized: true,
    });
    const { result } = renderHook(() => useConfigurator3DHistory());
    act(() => {
      result.current.undo();
    });
    expect(useConfigurator3DStore.getState().selections['comp-1']).toBe('opt-1');
    expect(useConfigurator3DStore.getState().historyIndex).toBe(-1);
  });

  it('redo calls store redo and applies next entry', () => {
    useConfigurator3DStore.setState({
      configuration: { components: [], rules: [] } as never,
      selections: { 'comp-1': 'opt-1' },
      defaultSelections: { 'comp-1': 'opt-1' },
      history: [
        { id: 'h1', action: 'SELECT_OPTION', componentId: 'comp-1', optionId: 'opt-2', previousValue: 'opt-1', newValue: 'opt-2', timestamp: 1 },
      ],
      historyIndex: -1,
      isInitialized: true,
    });
    const { result } = renderHook(() => useConfigurator3DHistory());
    act(() => {
      result.current.redo();
    });
    expect(useConfigurator3DStore.getState().selections['comp-1']).toBe('opt-2');
    expect(useConfigurator3DStore.getState().historyIndex).toBe(0);
  });

  it('canUndo is true when historyIndex >= 0', () => {
    useConfigurator3DStore.setState({ history: [{ id: 'h1', action: 'SELECT_OPTION', timestamp: 1 }], historyIndex: 0 });
    const { result } = renderHook(() => useConfigurator3DHistory());
    expect(result.current.canUndo).toBe(true);
  });

  it('canUndo is false when history is empty', () => {
    useConfigurator3DStore.setState({ history: [], historyIndex: -1 });
    const { result } = renderHook(() => useConfigurator3DHistory());
    expect(result.current.canUndo).toBe(false);
  });

  it('canRedo is true when historyIndex < history.length - 1', () => {
    useConfigurator3DStore.setState({ history: [{ id: 'h1', action: 'SELECT_OPTION', timestamp: 1 }], historyIndex: -1 });
    const { result } = renderHook(() => useConfigurator3DHistory());
    expect(result.current.canRedo).toBe(true);
  });

  it('clearHistory clears store history', () => {
    useConfigurator3DStore.setState({ history: [{ id: 'h1', action: 'SELECT_OPTION', timestamp: 1 }], historyIndex: 0 });
    const { result } = renderHook(() => useConfigurator3DHistory());
    act(() => {
      result.current.clearHistory();
    });
    expect(useConfigurator3DStore.getState().history).toEqual([]);
    expect(useConfigurator3DStore.getState().historyIndex).toBe(-1);
  });

  it('keyboard Ctrl+Z triggers undo', () => {
    useConfigurator3DStore.setState({
      configuration: { components: [], rules: [] } as never,
      selections: { 'comp-1': 'opt-2' },
      defaultSelections: { 'comp-1': 'opt-1' },
      history: [
        { id: 'h1', action: 'SELECT_OPTION', componentId: 'comp-1', optionId: 'opt-2', previousValue: 'opt-1', newValue: 'opt-2', timestamp: 1 },
      ],
      historyIndex: 0,
      isInitialized: true,
    });
    renderHook(() => useConfigurator3DHistory());
    const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true });
    act(() => {
      window.dispatchEvent(event);
    });
    expect(useConfigurator3DStore.getState().selections['comp-1']).toBe('opt-1');
  });

  it('keyboard Ctrl+Y triggers redo', () => {
    useConfigurator3DStore.setState({
      configuration: { components: [], rules: [] } as never,
      selections: { 'comp-1': 'opt-1' },
      defaultSelections: { 'comp-1': 'opt-1' },
      history: [
        { id: 'h1', action: 'SELECT_OPTION', componentId: 'comp-1', optionId: 'opt-2', previousValue: 'opt-1', newValue: 'opt-2', timestamp: 1 },
      ],
      historyIndex: -1,
      isInitialized: true,
    });
    renderHook(() => useConfigurator3DHistory());
    const event = new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true });
    act(() => {
      window.dispatchEvent(event);
    });
    expect(useConfigurator3DStore.getState().selections['comp-1']).toBe('opt-2');
  });
});
