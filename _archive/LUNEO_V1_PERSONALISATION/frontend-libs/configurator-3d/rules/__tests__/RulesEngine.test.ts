/**
 * RulesEngine & RuleEvaluator tests
 * Tests condition evaluation, rule types (DEPENDENCY, EXCLUSION, VISIBILITY, PRICING),
 * priority, stopProcessing, and complex rules.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RulesEngine, RuleEvaluator } from '@/lib/configurator-3d/rules';
import type {
  Configurator3DRule,
  Configurator3DComponent,
  SelectionState,
  RuleCondition,
} from '@/lib/configurator-3d/types/configurator.types';

// -----------------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------------

const compA: Configurator3DComponent = {
  id: 'comp-a',
  name: 'Component A',
  type: 'COLOR',
  selectionMode: 'SINGLE',
  isRequired: false,
  minSelections: 0,
  maxSelections: 1,
  sortOrder: 0,
  isVisible: true,
  isEnabled: true,
  options: [
    { id: 'opt-a1', componentId: 'comp-a', name: 'A1', type: 'COLOR', sortOrder: 0, isDefault: true, isEnabled: true, isVisible: true },
    { id: 'opt-a2', componentId: 'comp-a', name: 'A2', type: 'COLOR', sortOrder: 1, isDefault: false, isEnabled: true, isVisible: true },
  ],
};

const compB: Configurator3DComponent = {
  id: 'comp-b',
  name: 'Component B',
  type: 'MATERIAL',
  selectionMode: 'SINGLE',
  isRequired: false,
  minSelections: 0,
  maxSelections: 1,
  sortOrder: 1,
  isVisible: true,
  isEnabled: true,
  options: [
    { id: 'opt-b1', componentId: 'comp-b', name: 'B1', type: 'MATERIAL', sortOrder: 0, isDefault: false, isEnabled: true, isVisible: true },
    { id: 'opt-b2', componentId: 'comp-b', name: 'B2', type: 'MATERIAL', sortOrder: 1, isDefault: false, isEnabled: true, isVisible: true },
  ],
};

const compC: Configurator3DComponent = {
  id: 'comp-c',
  name: 'Component C',
  type: 'SIZE',
  selectionMode: 'SINGLE',
  isRequired: false,
  minSelections: 0,
  maxSelections: 1,
  sortOrder: 2,
  isVisible: true,
  isEnabled: true,
  options: [
    { id: 'opt-c1', componentId: 'comp-c', name: 'C1', type: 'SIZE', sortOrder: 0, isDefault: false, isEnabled: true, isVisible: true },
  ],
};

const components: Configurator3DComponent[] = [compA, compB, compC];

// -----------------------------------------------------------------------------
// RuleEvaluator - evaluateCondition (operators)
// -----------------------------------------------------------------------------

describe('RuleEvaluator', () => {
  let evaluator: RuleEvaluator;

  beforeEach(() => {
    evaluator = new RuleEvaluator();
  });

  describe('evaluateCondition', () => {
    it('EQUALS (eq): matches single selection', () => {
      const condition: RuleCondition = { componentId: 'comp-a', operator: 'eq', value: 'opt-a1' };
      expect(evaluator.evaluateCondition(condition, { 'comp-a': 'opt-a1' }, components)).toBe(true);
      expect(evaluator.evaluateCondition(condition, { 'comp-a': 'opt-a2' }, components)).toBe(false);
    });

    it('NOT_EQUALS (neq): rejects matching value', () => {
      const condition: RuleCondition = { componentId: 'comp-a', operator: 'neq', value: 'opt-a1' };
      expect(evaluator.evaluateCondition(condition, { 'comp-a': 'opt-a1' }, components)).toBe(false);
      expect(evaluator.evaluateCondition(condition, { 'comp-a': 'opt-a2' }, components)).toBe(true);
    });

    it('IN: selection in array of allowed values', () => {
      const condition: RuleCondition = { componentId: 'comp-a', operator: 'in', value: ['opt-a1', 'opt-a2'] };
      expect(evaluator.evaluateCondition(condition, { 'comp-a': 'opt-a1' }, components)).toBe(true);
      expect(evaluator.evaluateCondition(condition, { 'comp-a': 'opt-a2' }, components)).toBe(true);
      expect(evaluator.evaluateCondition(condition, {}, components)).toBe(false);
    });

    it('not_in: selection not in array', () => {
      const condition: RuleCondition = { componentId: 'comp-a', operator: 'not_in', value: ['opt-a1'] };
      expect(evaluator.evaluateCondition(condition, { 'comp-a': 'opt-a2' }, components)).toBe(true);
      expect(evaluator.evaluateCondition(condition, { 'comp-a': 'opt-a1' }, components)).toBe(false);
    });

    it('IS_SELECTED (is_selected): has any selection for component', () => {
      const condition: RuleCondition = { componentId: 'comp-a', operator: 'eq', value: 'opt-a1' };
      const condSelected: RuleCondition = { componentId: 'comp-a', operator: 'is_selected', value: true };
      expect(evaluator.evaluateCondition(condSelected, { 'comp-a': 'opt-a1' }, components)).toBe(true);
      expect(evaluator.evaluateCondition(condSelected, {}, components)).toBe(false);
      expect(evaluator.evaluateCondition(condSelected, { 'comp-a': '' }, components)).toBe(false);
    });

    it('is_not_selected: no selection for component', () => {
      const cond: RuleCondition = { componentId: 'comp-a', operator: 'is_not_selected', value: true };
      expect(evaluator.evaluateCondition(cond, {}, components)).toBe(true);
      expect(evaluator.evaluateCondition(cond, { 'comp-a': 'opt-a1' }, components)).toBe(false);
    });

    it('contains: array selection contains value', () => {
      const condition: RuleCondition = { componentId: 'comp-a', operator: 'contains', value: 'opt-a1' };
      const multiComp: Configurator3DComponent = {
        ...compA,
        selectionMode: 'MULTIPLE',
        maxSelections: 2,
      };
      expect(evaluator.evaluateCondition(condition, { 'comp-a': ['opt-a1', 'opt-a2'] }, [multiComp, compB, compC])).toBe(true);
      expect(evaluator.evaluateCondition(condition, { 'comp-a': ['opt-a2'] }, [multiComp, compB, compC])).toBe(false);
    });

    it('gt / gte: numeric comparison', () => {
      const compNum: Configurator3DComponent = {
        ...compA,
        id: 'comp-num',
        options: [{ id: 'n1', componentId: 'comp-num', name: 'N1', type: 'NUMBER', sortOrder: 0, isDefault: false, isEnabled: true, isVisible: true }],
      };
      const condGt: RuleCondition = { componentId: 'comp-num', operator: 'gt', value: 5 };
      const condGte: RuleCondition = { componentId: 'comp-num', operator: 'gte', value: 5 };
      expect(evaluator.evaluateCondition(condGt, { 'comp-num': 6 }, [compNum])).toBe(true);
      expect(evaluator.evaluateCondition(condGt, { 'comp-num': 5 }, [compNum])).toBe(false);
      expect(evaluator.evaluateCondition(condGte, { 'comp-num': 5 }, [compNum])).toBe(true);
    });

    it('lt / lte: numeric comparison', () => {
      const compNum: Configurator3DComponent = {
        ...compA,
        id: 'comp-num',
        options: [{ id: 'n1', componentId: 'comp-num', name: 'N1', type: 'NUMBER', sortOrder: 0, isDefault: false, isEnabled: true, isVisible: true }],
      };
      const condLt: RuleCondition = { componentId: 'comp-num', operator: 'lt', value: 10 };
      const condLte: RuleCondition = { componentId: 'comp-num', operator: 'lte', value: 10 };
      expect(evaluator.evaluateCondition(condLt, { 'comp-num': 9 }, [compNum])).toBe(true);
      expect(evaluator.evaluateCondition(condLte, { 'comp-num': 10 }, [compNum])).toBe(true);
    });

    it('evaluateConditions: all conditions must be true (AND)', () => {
      const conditions: RuleCondition[] = [
        { componentId: 'comp-a', operator: 'eq', value: 'opt-a1' },
        { componentId: 'comp-b', operator: 'eq', value: 'opt-b1' },
      ];
      expect(evaluator.evaluateConditions(conditions, { 'comp-a': 'opt-a1', 'comp-b': 'opt-b1' }, components)).toBe(true);
      expect(evaluator.evaluateConditions(conditions, { 'comp-a': 'opt-a1', 'comp-b': 'opt-b2' }, components)).toBe(false);
    });

    it('evaluateConditions: empty conditions returns true', () => {
      expect(evaluator.evaluateConditions([], {}, components)).toBe(true);
    });
  });
});

// -----------------------------------------------------------------------------
// RulesEngine
// -----------------------------------------------------------------------------

describe('RulesEngine', () => {
  it('constructor creates engine with rules and components', () => {
    const rules: Configurator3DRule[] = [];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({});
    expect(result.appliedRules).toEqual([]);
    expect(result.disabledOptions).toBeInstanceOf(Map);
    expect(result.hiddenComponents).toBeInstanceOf(Set);
    expect(result.priceModifications).toEqual([]);
  });

  it('DEPENDENCY rule type: selecting option A requires option B (SET_DEFAULT action)', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'r1',
        name: 'A1 requires B1',
        type: 'DEPENDENCY',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'SET_DEFAULT', componentId: 'comp-b', optionId: 'opt-b1' }],
      },
    ];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({ 'comp-a': 'opt-a1' });
    expect(result.appliedRules).toContain('r1');
    expect(result.requiredOptions.get('comp-b')).toBe('opt-b1');
  });

  it('EXCLUSION rule type: selecting option A excludes option B (DISABLE_OPTION)', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'r2',
        name: 'A1 excludes B2',
        type: 'EXCLUSION',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'DISABLE_OPTION', componentId: 'comp-b', optionId: 'opt-b2' }],
      },
    ];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({ 'comp-a': 'opt-a1' });
    expect(result.appliedRules).toContain('r2');
    expect(result.disabledOptions.get('comp-b')?.has('opt-b2')).toBe(true);
  });

  it('VISIBILITY rule type: selecting option A hides component C (HIDE_COMPONENT)', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'r3',
        name: 'A2 hides C',
        type: 'VISIBILITY',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a2' }],
        actions: [{ type: 'HIDE_COMPONENT', componentId: 'comp-c' }],
      },
    ];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({ 'comp-a': 'opt-a2' });
    expect(result.appliedRules).toContain('r3');
    expect(result.hiddenComponents.has('comp-c')).toBe(true);
  });

  it('VISIBILITY rule type: SHOW_COMPONENT removes from hidden', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'r4',
        name: 'A1 shows C',
        type: 'VISIBILITY',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'SHOW_COMPONENT', componentId: 'comp-c' }],
      },
    ];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({ 'comp-a': 'opt-a1' });
    expect(result.appliedRules).toContain('r4');
    expect(result.hiddenComponents.has('comp-c')).toBe(false);
  });

  it('PRICING rule type: SET_PRICE adds price modification', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'r5',
        name: 'A1 sets price',
        type: 'PRICING',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'SET_PRICE', componentId: 'comp-a', optionId: 'opt-a1', priceModifier: 100 }],
      },
    ];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({ 'comp-a': 'opt-a1' });
    expect(result.appliedRules).toContain('r5');
    expect(result.priceModifications).toHaveLength(1);
    expect(result.priceModifications[0].action).toBe('SET_PRICE');
    expect(result.priceModifications[0].value).toBe(100);
  });

  it('ADD_PRICE and MULTIPLY_PRICE actions add price modifications', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'r6',
        name: 'Add price',
        type: 'PRICING',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [
          { type: 'SET_PRICE', componentId: 'comp-a', optionId: 'opt-a1', priceModifier: 50 } as unknown as Configurator3DRule['actions'][0],
          { type: 'ADD_PRICE', componentId: 'comp-a', optionId: 'opt-a1', priceModifier: 20 } as unknown as Configurator3DRule['actions'][0],
        ],
      },
    ];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({ 'comp-a': 'opt-a1' });
    expect(result.priceModifications.length).toBeGreaterThanOrEqual(1);
  });

  it('priority ordering: higher priority rule evaluated first', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'low',
        name: 'Low',
        type: 'VISIBILITY',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'HIDE_COMPONENT', componentId: 'comp-c' }],
      },
      {
        id: 'high',
        name: 'High',
        type: 'VISIBILITY',
        isEnabled: true,
        priority: 10,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'SHOW_COMPONENT', componentId: 'comp-c' }],
      },
    ];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({ 'comp-a': 'opt-a1' });
    expect(result.appliedRules[0]).toBe('high');
    expect(result.appliedRules[1]).toBe('low');
    expect(result.appliedRules).toHaveLength(2);
  });

  it('stopProcessing: VALIDATE with stopProcessing stops further rule evaluation', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'stop',
        name: 'Stop',
        type: 'VALIDATION',
        isEnabled: true,
        priority: 5,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'VALIDATE', value: { stopProcessing: true } }],
      },
      {
        id: 'after',
        name: 'After',
        type: 'VISIBILITY',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'HIDE_COMPONENT', componentId: 'comp-c' }],
      },
    ];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({ 'comp-a': 'opt-a1' });
    expect(result.appliedRules).toContain('stop');
    expect(result.appliedRules).not.toContain('after');
    expect(result.hiddenComponents.has('comp-c')).toBe(false);
  });

  it('empty selections returns no applied rules', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'r',
        name: 'Requires A1',
        type: 'DEPENDENCY',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'SET_DEFAULT', componentId: 'comp-b', optionId: 'opt-b1' }],
      },
    ];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({});
    expect(result.appliedRules).toHaveLength(0);
    expect(result.requiredOptions.size).toBe(0);
  });

  it('complex multi-condition rule: all conditions must match', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'multi',
        name: 'A1 and B1',
        type: 'VISIBILITY',
        isEnabled: true,
        priority: 0,
        conditions: [
          { componentId: 'comp-a', operator: 'eq', value: 'opt-a1' },
          { componentId: 'comp-b', operator: 'eq', value: 'opt-b1' },
        ],
        actions: [{ type: 'HIDE_COMPONENT', componentId: 'comp-c' }],
      },
    ];
    const engine = new RulesEngine(rules, components);
    expect(engine.evaluate({ 'comp-a': 'opt-a1', 'comp-b': 'opt-b1' }).appliedRules).toContain('multi');
    expect(engine.evaluate({ 'comp-a': 'opt-a1' }).appliedRules).not.toContain('multi');
    expect(engine.evaluate({ 'comp-a': 'opt-a1', 'comp-b': 'opt-b2' }).appliedRules).not.toContain('multi');
  });

  it('disabled rules are not evaluated', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'disabled',
        name: 'Disabled',
        type: 'VISIBILITY',
        isEnabled: false,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'HIDE_COMPONENT', componentId: 'comp-c' }],
      },
    ];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({ 'comp-a': 'opt-a1' });
    expect(result.appliedRules).toHaveLength(0);
  });

  it('VALIDATE rule with value is applied', () => {
    const rules: Configurator3DRule[] = [
      {
        id: 'warn',
        name: 'Warn',
        type: 'VALIDATION',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'VALIDATE', value: { type: 'warning', message: 'Careful' } }],
      },
    ];
    const engine = new RulesEngine(rules, components);
    const result = engine.evaluate({ 'comp-a': 'opt-a1' });
    expect(result.appliedRules).toContain('warn');
  });

  it('update() replaces rules and components', () => {
    const rules1: Configurator3DRule[] = [
      {
        id: 'r1',
        name: 'R1',
        type: 'VISIBILITY',
        isEnabled: true,
        priority: 0,
        conditions: [{ componentId: 'comp-a', operator: 'eq', value: 'opt-a1' }],
        actions: [{ type: 'HIDE_COMPONENT', componentId: 'comp-c' }],
      },
    ];
    const engine = new RulesEngine(rules1, components);
    const newRules: Configurator3DRule[] = [];
    engine.update(newRules, components);
    const result = engine.evaluate({ 'comp-a': 'opt-a1' });
    expect(result.appliedRules).toHaveLength(0);
  });
});
