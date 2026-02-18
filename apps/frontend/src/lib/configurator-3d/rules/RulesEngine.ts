/**
 * Rules Engine - Main orchestrator for 3D Configurator rules
 * Evaluates rules against selection state and produces visibility, requirements, and price modifications
 */

import type {
  Configurator3DRule,
  Configurator3DComponent,
  SelectionState,
} from '@/lib/configurator-3d/types/configurator.types';
import { RuleEvaluator } from './RuleEvaluator';
import { ActionExecutor } from './ActionExecutor';

// =============================================================================
// TYPES
// =============================================================================

export interface PriceModification {
  targetComponentId: string;
  targetOptionId?: string;
  action: 'SET_PRICE' | 'ADD_PRICE' | 'MULTIPLY_PRICE';
  value: number;
}

export interface RulesEvaluationResult {
  appliedRules: string[];
  disabledOptions: Map<string, Set<string>>;
  hiddenComponents: Set<string>;
  hiddenOptions: Map<string, Set<string>>;
  requiredOptions: Map<string, string>;
  priceModifications: PriceModification[];
  warnings: string[];
  errors: string[];
}

// Extended rule action type for internal use (includes price actions and messages)
export type ExtendedRuleActionType =
  | 'REQUIRE'
  | 'EXCLUDE'
  | 'SHOW'
  | 'HIDE'
  | 'ENABLE'
  | 'DISABLE'
  | 'SET_PRICE'
  | 'ADD_PRICE'
  | 'MULTIPLY_PRICE'
  | 'SET_DEFAULT'
  | 'SHOW_WARNING'
  | 'SHOW_ERROR'
  | 'SHOW_COMPONENT'
  | 'HIDE_COMPONENT'
  | 'ENABLE_OPTION'
  | 'DISABLE_OPTION'
  | 'VALIDATE';

// =============================================================================
// RULES ENGINE
// =============================================================================

export class RulesEngine {
  private rules: Configurator3DRule[];
  private components: Configurator3DComponent[];
  private ruleEvaluator: RuleEvaluator;
  private actionExecutor: ActionExecutor;

  constructor(
    rules: Configurator3DRule[],
    components: Configurator3DComponent[]
  ) {
    this.rules = rules;
    this.components = components;
    this.ruleEvaluator = new RuleEvaluator();
    this.actionExecutor = new ActionExecutor();
  }

  /**
   * Evaluate all rules against current selection state.
   * Rules are sorted by priority (descending), then evaluated in order.
   * If a rule has stopProcessing, evaluation stops after that rule.
   */
  evaluate(selections: SelectionState): RulesEvaluationResult {
    const result: RulesEvaluationResult = {
      appliedRules: [],
      disabledOptions: new Map(),
      hiddenComponents: new Set(),
      hiddenOptions: new Map(),
      requiredOptions: new Map(),
      priceModifications: [],
      warnings: [],
      errors: [],
    };

    const enabledRules = this.rules
      .filter((r) => r.isEnabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of enabledRules) {
      const conditionsMatch = this.ruleEvaluator.evaluateConditions(
        rule.conditions,
        selections,
        this.components
      );

      if (!conditionsMatch) continue;

      let stopProcessing = false;
      for (const action of rule.actions) {
        this.actionExecutor.executeAction(action, result);
        if (action.type === 'VALIDATE' && (action.value as { stopProcessing?: boolean })?.stopProcessing) {
          stopProcessing = true;
        }
      }

      result.appliedRules.push(rule.id);

      if (stopProcessing) break;
    }

    return result;
  }

  /**
   * Update rules and components (e.g. when config changes)
   */
  update(rules: Configurator3DRule[], components: Configurator3DComponent[]): void {
    this.rules = rules;
    this.components = components;
  }
}
