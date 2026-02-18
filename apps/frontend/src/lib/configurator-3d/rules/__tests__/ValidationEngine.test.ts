/**
 * ValidationEngine tests
 * Required components, min/max selections, out of stock, rule errors/warnings, isValid.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationEngine } from '@/lib/configurator-3d/rules';
import type {
  Configurator3DComponent,
  Configurator3DRule,
  SelectionState,
} from '@/lib/configurator-3d/types/configurator.types';

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

const requiredComponent: Configurator3DComponent = {
  id: 'required-comp',
  name: 'Required',
  type: 'COLOR',
  selectionMode: 'SINGLE',
  isRequired: true,
  minSelections: 1,
  maxSelections: 1,
  sortOrder: 0,
  isVisible: true,
  isEnabled: true,
  options: [
    { id: 'opt-1', componentId: 'required-comp', name: 'Opt1', type: 'COLOR', sortOrder: 0, isDefault: true, isEnabled: true, isVisible: true },
    { id: 'opt-2', componentId: 'required-comp', name: 'Opt2', type: 'COLOR', sortOrder: 1, isDefault: false, isEnabled: true, isVisible: true },
  ],
};

const multiComponent: Configurator3DComponent = {
  id: 'multi-comp',
  name: 'Multi',
  type: 'ACCESSORY',
  selectionMode: 'MULTIPLE',
  isRequired: false,
  minSelections: 1,
  maxSelections: 3,
  sortOrder: 1,
  isVisible: true,
  isEnabled: true,
  options: [
    { id: 'm1', componentId: 'multi-comp', name: 'M1', type: 'MODEL', sortOrder: 0, isDefault: false, isEnabled: true, isVisible: true },
    { id: 'm2', componentId: 'multi-comp', name: 'M2', type: 'MODEL', sortOrder: 1, isDefault: false, isEnabled: true, isVisible: true },
    { id: 'm3', componentId: 'multi-comp', name: 'M3', type: 'MODEL', sortOrder: 2, isDefault: false, isEnabled: true, isVisible: true },
    { id: 'm4', componentId: 'multi-comp', name: 'M4', type: 'MODEL', sortOrder: 3, isDefault: false, isEnabled: true, isVisible: true },
  ],
};

const stockComponent: Configurator3DComponent = {
  id: 'stock-comp',
  name: 'Stock',
  type: 'MATERIAL',
  selectionMode: 'SINGLE',
  isRequired: false,
  minSelections: 0,
  maxSelections: 1,
  sortOrder: 2,
  isVisible: true,
  isEnabled: true,
  options: [
    { id: 'in-stock', componentId: 'stock-comp', name: 'InStock', type: 'MATERIAL', sortOrder: 0, isDefault: true, isEnabled: true, isVisible: true, inStock: true },
    { id: 'out-of-stock', componentId: 'stock-comp', name: 'OutOfStock', type: 'MATERIAL', sortOrder: 1, isDefault: false, isEnabled: true, isVisible: true, inStock: false },
    { id: 'zero-qty', componentId: 'stock-comp', name: 'ZeroQty', type: 'MATERIAL', sortOrder: 2, isDefault: false, isEnabled: true, isVisible: true, stockQuantity: 0 },
  ],
};

describe('ValidationEngine', () => {
  it('required component without selection yields error', () => {
    const components: Configurator3DComponent[] = [requiredComponent];
    const engine = new ValidationEngine(components, []);
    const result = engine.validate({});
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'REQUIRED_COMPONENT' && e.componentId === 'required-comp')).toBe(true);
  });

  it('required component with selection has no required error', () => {
    const components: Configurator3DComponent[] = [requiredComponent];
    const engine = new ValidationEngine(components, []);
    const result = engine.validate({ 'required-comp': 'opt-1' });
    expect(result.errors.filter((e) => e.code === 'REQUIRED_COMPONENT')).toHaveLength(0);
  });

  it('min selections validation: below min yields error', () => {
    const components: Configurator3DComponent[] = [multiComponent];
    const engine = new ValidationEngine(components, []);
    const result = engine.validate({});
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MIN_SELECTIONS' && e.componentId === 'multi-comp')).toBe(true);
  });

  it('min selections: meeting min clears min error', () => {
    const components: Configurator3DComponent[] = [multiComponent];
    const engine = new ValidationEngine(components, []);
    const result = engine.validate({ 'multi-comp': ['m1'] });
    expect(result.errors.filter((e) => e.code === 'MIN_SELECTIONS')).toHaveLength(0);
  });

  it('max selections validation: above max yields error', () => {
    const components: Configurator3DComponent[] = [multiComponent];
    const engine = new ValidationEngine(components, []);
    const result = engine.validate({ 'multi-comp': ['m1', 'm2', 'm3', 'm4'] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MAX_SELECTIONS' && e.componentId === 'multi-comp')).toBe(true);
  });

  it('out of stock option selected yields error', () => {
    const components: Configurator3DComponent[] = [stockComponent];
    const engine = new ValidationEngine(components, []);
    const result = engine.validate({ 'stock-comp': 'out-of-stock' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'OUT_OF_STOCK')).toBe(true);
  });

  it('stockQuantity 0 yields error when selected', () => {
    const components: Configurator3DComponent[] = [stockComponent];
    const engine = new ValidationEngine(components, []);
    const result = engine.validate({ 'stock-comp': 'zero-qty' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'OUT_OF_STOCK')).toBe(true);
  });

  it('all valid selections yields isValid true', () => {
    const components: Configurator3DComponent[] = [requiredComponent, multiComponent, stockComponent];
    const engine = new ValidationEngine(components, []);
    const result = engine.validate({
      'required-comp': 'opt-1',
      'multi-comp': ['m1', 'm2'],
      'stock-comp': 'in-stock',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rule evaluation errors appear in validation result', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'err',
        name: 'Error rule',
        type: 'VALIDATION',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'required-comp', operator: 'eq', value: 'opt-1' }],
        actions: [{ type: 'SHOW_ERROR' as unknown as 'VALIDATE', value: 'Rule error' }],
      },
    ];
    const engine = new ValidationEngine([requiredComponent], rules);
    const result = engine.validate({ 'required-comp': 'opt-1' });
    expect(result.errors.some((e) => e.code === 'RULE_ERROR')).toBe(true);
  });

  it('rule evaluation warnings appear in validation result', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'warn',
        name: 'Warn rule',
        type: 'VALIDATION',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'required-comp', operator: 'eq', value: 'opt-1' }],
        actions: [{ type: 'SHOW_WARNING' as unknown as 'VALIDATE', value: 'Rule warning' }],
      },
    ];
    const engine = new ValidationEngine([requiredComponent], rules);
    const result = engine.validate({ 'required-comp': 'opt-1' });
    expect(result.warnings.some((w) => w.code === 'RULE_WARNING')).toBe(true);
  });

  it('invisible or disabled components are skipped for required check', () => {
    const hiddenRequired: Configurator3DComponent = {
      ...requiredComponent,
      id: 'hidden-required',
      isVisible: false,
    };
    const engine = new ValidationEngine([hiddenRequired], []);
    const result = engine.validate({});
    expect(result.errors.some((e) => e.componentId === 'hidden-required')).toBe(false);
  });

  it('update() replaces components and rules', () => {
    const engine = new ValidationEngine([requiredComponent], []);
    const resultBefore = engine.validate({});
    expect(resultBefore.valid).toBe(false);

    engine.update([], []);
    const resultAfter = engine.validate({});
    expect(resultAfter.valid).toBe(true);
    expect(resultAfter.errors).toHaveLength(0);
  });
});
