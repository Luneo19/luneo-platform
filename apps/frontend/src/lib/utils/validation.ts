/**
 * Utilitaires de validation professionnels
 * Fournit des fonctions de validation réutilisables et standardisées
 */

/**
 * Interface pour les erreurs de validation
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Interface pour le résultat de validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Valider une adresse email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valider une URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valider un mot de passe (minimum 8 caractères, au moins une majuscule, une minuscule, un chiffre)
 */
export function validatePassword(password: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Le mot de passe doit contenir au moins 8 caractères',
    });
  }

  if (!/[A-Z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Le mot de passe doit contenir au moins une majuscule',
    });
  }

  if (!/[a-z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Le mot de passe doit contenir au moins une minuscule',
    });
  }

  if (!/[0-9]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Le mot de passe doit contenir au moins un chiffre',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valider un numéro de téléphone (format international)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Valider une longueur de chaîne
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number
): ValidationResult {
  const errors: ValidationError[] = [];

  if (min !== undefined && value.length < min) {
    errors.push({
      field: 'value',
      message: `La valeur doit contenir au moins ${min} caractères`,
    });
  }

  if (max !== undefined && value.length > max) {
    errors.push({
      field: 'value',
      message: `La valeur doit contenir au maximum ${max} caractères`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valider qu'une valeur n'est pas vide
 */
export function validateRequired(value: any, fieldName: string = 'field'): ValidationResult {
  const errors: ValidationError[] = [];

  if (value === null || value === undefined || value === '') {
    errors.push({
      field: fieldName,
      message: 'Ce champ est requis',
    });
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    errors.push({
      field: fieldName,
      message: 'Ce champ est requis',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valider un nombre dans une plage
 */
export function validateRange(
  value: number,
  min?: number,
  max?: number,
  fieldName: string = 'value'
): ValidationResult {
  const errors: ValidationError[] = [];

  if (min !== undefined && value < min) {
    errors.push({
      field: fieldName,
      message: `La valeur doit être supérieure ou égale à ${min}`,
    });
  }

  if (max !== undefined && value > max) {
    errors.push({
      field: fieldName,
      message: `La valeur doit être inférieure ou égale à ${max}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valider un objet avec plusieurs règles
 */
export function validateObject<T extends Record<string, any>>(
  data: T,
  rules: {
    [K in keyof T]?: Array<(value: T[K]) => ValidationResult>;
  }
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, validators] of Object.entries(rules)) {
    if (!validators) continue;

    const value = data[field];

    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        errors.push(...result.errors.map((err: ValidationError) => ({
          ...err,
          field: err.field === 'value' ? field : err.field,
        })));
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formater les erreurs de validation en message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map((err) => `${err.field}: ${err.message}`).join('; ');
}

/**
 * Valider un objet avec schéma
 */
export function validateSchema<T extends Record<string, any>>(
  data: T,
  schema: {
    [K in keyof T]?: {
      required?: boolean;
      type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
      email?: boolean;
      url?: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: RegExp;
      custom?: (value: T[K]) => ValidationResult;
    };
  }
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    if (!rules) continue;

    const value = data[field];

    // Required check
    if (rules.required) {
      const requiredResult = validateRequired(value, field);
      if (!requiredResult.valid) {
        errors.push(...requiredResult.errors);
        continue; // Skip other validations if required fails
      }
    }

    // Type check
    if (rules.type && value !== null && value !== undefined) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push({
          field,
          message: `Le champ doit être de type ${rules.type}`,
        });
        continue;
      }
    }

    // Email validation
    if (rules.email && typeof value === 'string' && !validateEmail(value)) {
      errors.push({
        field,
        message: 'Format d\'email invalide',
      });
    }

    // URL validation
    if (rules.url && typeof value === 'string' && !validateUrl(value)) {
      errors.push({
        field,
        message: 'Format d\'URL invalide',
      });
    }

    // Length validation
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({
          field,
          message: `Le champ doit contenir au moins ${rules.minLength} caractères`,
        });
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({
          field,
          message: `Le champ doit contenir au maximum ${rules.maxLength} caractères`,
        });
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push({
          field,
          message: 'Format invalide',
        });
      }
    }

    // Number range validation
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push({
          field,
          message: `La valeur doit être supérieure ou égale à ${rules.min}`,
        });
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push({
          field,
          message: `La valeur doit être inférieure ou égale à ${rules.max}`,
        });
      }
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(value);
      if (!customResult.valid) {
        errors.push(...customResult.errors.map((err: ValidationError) => ({
          ...err,
          field: err.field === 'value' ? field : err.field,
        })));
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

