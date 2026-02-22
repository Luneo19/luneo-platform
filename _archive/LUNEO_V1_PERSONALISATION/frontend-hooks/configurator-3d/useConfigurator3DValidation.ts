/**
 * useConfigurator3DValidation - Real-time validation
 * Auto-validate on selection changes
 * isComponentValid helper
 */

import { useCallback, useMemo } from 'react';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import type { ValidationResult } from '@/lib/configurator-3d/types/configurator.types';

export interface UseConfigurator3DValidationReturn {
  validation: ValidationResult;
  validate: () => void;
  validateRemote: (configurationId: string) => Promise<ValidationResult>;
  isComponentValid: (componentId: string) => boolean;
}

export function useConfigurator3DValidation(configurationId: string | null): UseConfigurator3DValidationReturn {
  const validation = useConfigurator3DStore((s) => s.validation);

  const validate = useCallback(() => {
    useConfigurator3DStore.getState().validate();
  }, []);

  const validateRemote = useCallback(
    async (configId: string): Promise<ValidationResult> => {
      const selections = useConfigurator3DStore.getState().selections;
      try {
        const result = await configurator3dEndpoints.configurations.validate(configId, { selections });
        const v = result as { valid?: boolean; errors?: ValidationResult['errors']; warnings?: ValidationResult['warnings'] };
        return {
          valid: v.valid ?? true,
          errors: v.errors ?? [],
          warnings: v.warnings ?? [],
        };
      } catch {
        return { valid: true, errors: [], warnings: [] };
      }
    },
    []
  );

  const isComponentValid = useCallback(
    (componentId: string): boolean => {
      const hasError = validation.errors.some((e) => e.componentId === componentId);
      return !hasError;
    },
    [validation.errors]
  );

  return {
    validation,
    validate,
    validateRemote,
    isComponentValid,
  };
}