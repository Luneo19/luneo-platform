/**
 * Rule Evaluator - Evaluates individual conditions and condition groups
 * Supports all RuleOperator types from configurator.types
 */

import type {
  RuleCondition,
  SelectionState,
  Configurator3DComponent,
} from '@/lib/configurator-3d/types/configurator.types';

// Extended operators for aliases and IS_SELECTED / IS_NOT_SELECTED
type EvaluableOperator =
  | RuleCondition['operator']
  | 'equals'
  | 'not_equals'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_selected'
  | 'is_not_selected';

export class RuleEvaluator {
  /**
   * Evaluate a single condition against selection state
   */
  evaluateCondition(
    condition: RuleCondition,
    selections: SelectionState,
    components: Configurator3DComponent[]
  ): boolean {
    const { componentId, optionId, operator, value } = condition;
    const component = componentId
      ? components.find((c) => c.id === componentId)
      : undefined;

    const selectionValue = componentId ? selections[componentId] : undefined;
    const hasSelection = selectionValue !== undefined && selectionValue !== null && selectionValue !== '';

    switch (operator as EvaluableOperator) {
      case 'eq':
      case 'equals':
        return this.compareEquals(selectionValue, value);

      case 'neq':
      case 'not_equals':
        return !this.compareEquals(selectionValue, value);

      case 'in':
        return this.compareIn(selectionValue, value);

      case 'not_in':
        return !this.compareIn(selectionValue, value);

      case 'contains':
        return this.compareContains(selectionValue, value);

      case 'not_contains':
        return !this.compareContains(selectionValue, value);

      case 'gt':
      case 'greater_than':
        return this.compareNumeric(selectionValue, value, 'gt');

      case 'gte':
        return this.compareNumeric(selectionValue, value, 'gte');

      case 'lt':
      case 'less_than':
        return this.compareNumeric(selectionValue, value, 'lt');

      case 'lte':
        return this.compareNumeric(selectionValue, value, 'lte');

      case 'is_selected':
        return hasSelection && (Array.isArray(selectionValue) ? selectionValue.length > 0 : true);

      case 'is_not_selected':
        return !hasSelection || (Array.isArray(selectionValue) && selectionValue.length === 0);

      default:
        return false;
    }
  }

  /**
   * Evaluate all conditions - ALL must be true (AND logic)
   */
  evaluateConditions(
    conditions: RuleCondition[],
    selections: SelectionState,
    components: Configurator3DComponent[]
  ): boolean {
    if (conditions.length === 0) return true;
    return conditions.every((c) =>
      this.evaluateCondition(c, selections, components)
    );
  }

  private compareEquals(selectionValue: unknown, expected: unknown): boolean {
    if (Array.isArray(selectionValue)) {
      if (Array.isArray(expected)) {
        return (
          selectionValue.length === expected.length &&
          selectionValue.every((v, i) => this.compareEquals(v, expected[i]))
        );
      }
      return selectionValue.includes(expected as string);
    }
    return String(selectionValue) === String(expected);
  }

  private compareIn(selectionValue: unknown, expected: unknown): boolean {
    if (!Array.isArray(expected)) return false;
    const arr = expected as unknown[];
    if (Array.isArray(selectionValue)) {
      return selectionValue.some((v) => arr.includes(v));
    }
    return arr.includes(selectionValue);
  }

  private compareContains(selectionValue: unknown, expected: unknown): boolean {
    if (Array.isArray(selectionValue)) {
      return selectionValue.includes(expected as string);
    }
    if (typeof selectionValue === 'string' && typeof expected === 'string') {
      return selectionValue.includes(expected);
    }
    return false;
  }

  private compareNumeric(
    selectionValue: unknown,
    expected: unknown,
    op: 'gt' | 'gte' | 'lt' | 'lte'
  ): boolean {
    const a = Number(selectionValue);
    const b = Number(expected);
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
    switch (op) {
      case 'gt':
        return a > b;
      case 'gte':
        return a >= b;
      case 'lt':
        return a < b;
      case 'lte':
        return a <= b;
      default:
        return false;
    }
  }
}
