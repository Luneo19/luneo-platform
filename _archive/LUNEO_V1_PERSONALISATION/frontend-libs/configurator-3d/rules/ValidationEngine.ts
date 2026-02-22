/**
 * Validation Engine - Validates complete configuration against components and rules
 * Checks required selections, min/max constraints, stock, and rule-based errors
 */

import type {
  Configurator3DComponent,
  Configurator3DRule,
  SelectionState,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '@/lib/configurator-3d/types/configurator.types';
import { RulesEngine } from './RulesEngine';

export class ValidationEngine {
  private components: Configurator3DComponent[];
  private rules: Configurator3DRule[];
  private rulesEngine: RulesEngine;

  constructor(
    components: Configurator3DComponent[],
    rules: Configurator3DRule[]
  ) {
    this.components = components;
    this.rules = rules;
    this.rulesEngine = new RulesEngine(rules, components);
  }

  /**
   * Validate selection state against all constraints
   */
  validate(selections: SelectionState): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Check required components have selections
    for (const component of this.components) {
      if (!component.isVisible || !component.isEnabled) continue;

      const selection = selections[component.id];
      const selectionCount = this.getSelectionCount(selection);

      if (component.isRequired && selectionCount === 0) {
        errors.push({
          code: 'REQUIRED_COMPONENT',
          message: `"${component.name}" is required`,
          componentId: component.id,
        });
      }

      // 2. Check min/max selections per component
      if (selectionCount < component.minSelections) {
        errors.push({
          code: 'MIN_SELECTIONS',
          message: `"${component.name}" requires at least ${component.minSelections} selection(s)`,
          componentId: component.id,
        });
      }
      if (component.maxSelections > 0 && selectionCount > component.maxSelections) {
        errors.push({
          code: 'MAX_SELECTIONS',
          message: `"${component.name}" allows at most ${component.maxSelections} selection(s)`,
          componentId: component.id,
        });
      }
    }

    // 3. Check stock availability for selected options
    for (const component of this.components) {
      const selection = selections[component.id];
      const optionIds = this.getSelectedOptionIds(selection);

      for (const optionId of optionIds) {
        const option = component.options.find((o) => o.id === optionId);
        if (!option) continue;
        if (option.inStock === false || (option.stockQuantity !== undefined && option.stockQuantity <= 0)) {
          errors.push({
            code: 'OUT_OF_STOCK',
            message: `"${option.name}" is out of stock`,
            componentId: component.id,
            optionId: option.id,
          });
        }
      }
    }

    // 4. Evaluate rules and collect errors/warnings
    const evaluation = this.rulesEngine.evaluate(selections);

    for (const ruleError of evaluation.errors) {
      errors.push({
        code: 'RULE_ERROR',
        message: ruleError,
      });
    }

    for (const ruleWarning of evaluation.warnings) {
      warnings.push({
        code: 'RULE_WARNING',
        message: ruleWarning,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Update components and rules (e.g. when config changes)
   */
  update(
    components: Configurator3DComponent[],
    rules: Configurator3DRule[]
  ): void {
    this.components = components;
    this.rules = rules;
    this.rulesEngine.update(rules, components);
  }

  private getSelectionCount(selection: string | string[] | undefined): number {
    if (selection === undefined || selection === null) return 0;
    if (Array.isArray(selection)) return selection.length;
    return selection === '' ? 0 : 1;
  }

  private getSelectedOptionIds(selection: string | string[] | undefined): string[] {
    if (selection === undefined || selection === null) return [];
    if (Array.isArray(selection)) return selection;
    return selection === '' ? [] : [selection];
  }
}
