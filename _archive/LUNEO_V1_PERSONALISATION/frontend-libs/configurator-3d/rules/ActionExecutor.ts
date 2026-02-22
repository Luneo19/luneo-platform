/**
 * Action Executor - Executes rule actions and mutates RulesEvaluationResult
 * Maps standard RuleActionType to extended behaviors (REQUIRE, EXCLUDE, SHOW, HIDE, etc.)
 */

import type { RuleAction } from '@/lib/configurator-3d/types/configurator.types';
import type { RulesEvaluationResult, PriceModification } from './RulesEngine';

// Extended action type for internal handling
type ExtendedActionType =
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

export class ActionExecutor {
  /**
   * Execute a single rule action and mutate the result
   */
  executeAction(action: RuleAction, result: RulesEvaluationResult): void {
    const type = action.type as ExtendedActionType;

    switch (type) {
      case 'REQUIRE':
        if (action.componentId && action.optionId) {
          result.requiredOptions.set(action.componentId, action.optionId);
        }
        break;

      case 'EXCLUDE':
      case 'DISABLE':
      case 'DISABLE_OPTION':
        if (action.componentId && action.optionId) {
          this.addToMapSet(result.disabledOptions, action.componentId, action.optionId);
        }
        break;

      case 'SHOW':
      case 'ENABLE':
      case 'ENABLE_OPTION':
        if (action.componentId) {
          result.hiddenComponents.delete(action.componentId);
          result.hiddenOptions.delete(action.componentId);
          result.disabledOptions.delete(action.componentId);
        }
        if (action.optionId && action.componentId) {
          const hidden = result.hiddenOptions.get(action.componentId);
          if (hidden) hidden.delete(action.optionId);
          const disabled = result.disabledOptions.get(action.componentId);
          if (disabled) disabled.delete(action.optionId);
        }
        break;

      case 'HIDE':
      case 'HIDE_COMPONENT':
        if (action.componentId) {
          result.hiddenComponents.add(action.componentId);
          if (action.optionId) {
            this.addToMapSet(result.hiddenOptions, action.componentId, action.optionId);
          }
        }
        break;

      case 'SHOW_COMPONENT':
        if (action.componentId) {
          result.hiddenComponents.delete(action.componentId);
        }
        break;

      case 'SET_DEFAULT':
        if (action.componentId && action.optionId) {
          result.requiredOptions.set(action.componentId, action.optionId);
        } else if (action.componentId && action.value) {
          result.requiredOptions.set(action.componentId, String(action.value));
        }
        break;

      case 'SET_PRICE':
        if (action.componentId && typeof action.priceModifier === 'number') {
          result.priceModifications.push({
            targetComponentId: action.componentId,
            targetOptionId: action.optionId,
            action: 'SET_PRICE',
            value: action.priceModifier,
          });
        }
        break;

      case 'ADD_PRICE':
        if (action.componentId && typeof action.priceModifier === 'number') {
          result.priceModifications.push({
            targetComponentId: action.componentId,
            targetOptionId: action.optionId,
            action: 'ADD_PRICE',
            value: action.priceModifier,
          });
        }
        break;

      case 'MULTIPLY_PRICE':
        if (action.componentId && typeof action.priceModifier === 'number') {
          result.priceModifications.push({
            targetComponentId: action.componentId,
            targetOptionId: action.optionId,
            action: 'MULTIPLY_PRICE',
            value: action.priceModifier,
          });
        }
        break;

      case 'SHOW_WARNING':
        if (action.value) {
          result.warnings.push(String(action.value));
        }
        break;

      case 'SHOW_ERROR':
        if (action.value) {
          result.errors.push(String(action.value));
        }
        break;

      case 'VALIDATE':
        // Handled by RulesEngine for stopProcessing
        break;

      default:
        break;
    }
  }

  private addToMapSet(
    map: Map<string, Set<string>>,
    key: string,
    value: string
  ): void {
    let set = map.get(key);
    if (!set) {
      set = new Set();
      map.set(key, set);
    }
    set.add(value);
  }
}
