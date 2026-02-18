/**
 * useConfigurator3DRules - Frontend rules evaluation
 * Evaluates rules on every selection change
 * Returns: disabledOptions, hiddenOptions, requiredOptions, warnings, errors
 */

import { useMemo, useCallback } from 'react';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import type {
  Configurator3DRule,
  RuleCondition,
  RuleAction,
  SelectionState,
  ValidationError,
  ValidationWarning,
} from '@/lib/configurator-3d/types/configurator.types';

export interface UseConfigurator3DRulesReturn {
  disabledOptions: Record<string, Set<string>>;
  hiddenOptions: Record<string, Set<string>>;
  requiredOptions: Record<string, Set<string>>;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  evaluateRules: (selections: SelectionState) => {
    disabledOptions: Record<string, Set<string>>;
    hiddenOptions: Record<string, Set<string>>;
    requiredOptions: Record<string, Set<string>>;
    warnings: ValidationWarning[];
    errors: ValidationError[];
  };
}

function evaluateCondition(condition: RuleCondition, selections: SelectionState): boolean {
  const { componentId, optionId, field, operator, value } = condition;
  const sel = componentId ? selections[componentId] : undefined;

  let actualValue: unknown;
  if (optionId) {
    if (Array.isArray(sel)) {
      actualValue = sel.includes(optionId);
    } else {
      actualValue = sel === optionId;
    }
  } else if (componentId) {
    actualValue = sel;
  } else {
    return false;
  }

  switch (operator) {
    case 'eq':
      return actualValue === value;
    case 'neq':
      return actualValue !== value;
    case 'in':
      return Array.isArray(value) && (Array.isArray(actualValue) ? actualValue.some((v) => value.includes(v)) : value.includes(actualValue));
    case 'not_in':
      return Array.isArray(value) && !(Array.isArray(actualValue) ? actualValue.some((v) => value.includes(v)) : value.includes(actualValue));
    case 'contains':
      return Array.isArray(actualValue) && actualValue.includes(value);
    case 'gt':
      return typeof actualValue === 'number' && typeof value === 'number' && actualValue > value;
    case 'gte':
      return typeof actualValue === 'number' && typeof value === 'number' && actualValue >= value;
    case 'lt':
      return typeof actualValue === 'number' && typeof value === 'number' && actualValue < value;
    case 'lte':
      return typeof actualValue === 'number' && typeof value === 'number' && actualValue <= value;
    default:
      return false;
  }
}

function evaluateRules(
  rules: Configurator3DRule[],
  selections: SelectionState
): {
  disabledOptions: Record<string, Set<string>>;
  hiddenOptions: Record<string, Set<string>>;
  requiredOptions: Record<string, Set<string>>;
  warnings: ValidationWarning[];
  errors: ValidationError[];
} {
  const disabledOptions: Record<string, Set<string>> = {};
  const hiddenOptions: Record<string, Set<string>> = {};
  const requiredOptions: Record<string, Set<string>> = {};
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];

  const sortedRules = [...rules].filter((r) => r.isEnabled).sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    const allConditionsMet = rule.conditions.every((c) => evaluateCondition(c, selections));
    if (!allConditionsMet) continue;

    for (const action of rule.actions) {
      const { type, componentId, optionId } = action;

      if (type === 'DISABLE_OPTION' && componentId && optionId) {
        if (!disabledOptions[componentId]) disabledOptions[componentId] = new Set();
        disabledOptions[componentId].add(optionId);
      } else if (type === 'HIDE_COMPONENT' && componentId) {
        // Mark all options of component as hidden
        if (!hiddenOptions[componentId]) hiddenOptions[componentId] = new Set();
        // We'd need component options - for now we use a sentinel
        hiddenOptions[componentId].add('*');
      } else if (type === 'HIDE_COMPONENT' && optionId && componentId) {
        if (!hiddenOptions[componentId]) hiddenOptions[componentId] = new Set();
        hiddenOptions[componentId].add(optionId);
      } else if (type === 'ENABLE_OPTION' && componentId && optionId) {
        disabledOptions[componentId]?.delete(optionId);
      } else if (type === 'SHOW_COMPONENT' && componentId) {
        hiddenOptions[componentId]?.clear();
      } else if (type === 'VALIDATE' && action.value) {
        const v = action.value as { type?: string; message?: string; componentId?: string; optionId?: string };
        if (v.type === 'error') {
          errors.push({
            code: 'RULE',
            message: v.message ?? 'Validation failed',
            componentId: v.componentId,
            optionId: v.optionId,
          });
        } else {
          warnings.push({
            code: 'RULE',
            message: v.message ?? 'Warning',
            componentId: v.componentId,
            optionId: v.optionId,
          });
        }
      }
    }
  }

  return { disabledOptions, hiddenOptions, requiredOptions, warnings, errors };
}

export function useConfigurator3DRules(): UseConfigurator3DRulesReturn {
  const configuration = useConfigurator3DStore((s) => s.configuration);
  const selections = useConfigurator3DStore((s) => s.selections);

  const result = useMemo(() => {
    if (!configuration?.rules?.length) {
      return {
        disabledOptions: {} as Record<string, Set<string>>,
        hiddenOptions: {} as Record<string, Set<string>>,
        requiredOptions: {} as Record<string, Set<string>>,
        warnings: [] as ValidationWarning[],
        errors: [] as ValidationError[],
      };
    }
    return evaluateRules(configuration.rules, selections);
  }, [configuration?.rules, selections]);

  const evaluateRulesFn = useCallback(
    (sel: SelectionState) => evaluateRules(configuration?.rules ?? [], sel),
    [configuration?.rules]
  );

  return {
    ...result,
    evaluateRules: evaluateRulesFn,
  };
}