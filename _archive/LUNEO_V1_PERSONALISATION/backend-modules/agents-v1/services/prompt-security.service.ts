/**
 * @fileoverview Service de protection contre prompt injection
 * @module PromptSecurityService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Sanitization des inputs
 * - ✅ Validation des outputs
 * - ✅ Détection patterns malveillants
 * - ✅ Types explicites
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';

// ============================================================================
// TYPES
// ============================================================================

export interface SecurityCheckResult {
  safe: boolean;
  threats: string[];
  sanitized?: string;
}

// ============================================================================
// PATTERNS MALVEILLANTS
// ============================================================================

/**
 * Patterns de prompt injection à détecter
 */
const MALICIOUS_PATTERNS = [
  // Tentatives de bypass système
  /ignore\s+(previous|all|above)\s+(instructions|rules|system)/i,
  /forget\s+(previous|all|everything)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /system\s*:\s*you/i,
  /assistant\s*:\s*you/i,
  
  // Tentatives d'exécution de code
  /<script/i,
  /javascript:/i,
  /eval\(/i,
  /exec\(/i,
  /__import__/i,
  
  // Tentatives d'accès fichiers
  /file:\/\//i,
  /\.\.\/\.\.\//, // Path traversal
  /\/etc\/passwd/i,
  /\/proc\/self/i,
  
  // Tentatives d'injection SQL
  /(union|select|insert|update|delete|drop|create|alter)\s+.*\s+(from|into|table|database)/i,
  /';?\s*(drop|delete|update|insert)/i,
  
  // Tentatives de manipulation de contexte
  /(remember|save|store)\s+(this|that|the\s+following)/i,
  /(change|modify|update)\s+(your|the)\s+(system|instructions|prompt)/i,
  
  // Tentatives de fuite de données
  /(show|reveal|display|print|output)\s+(all|every|the)\s+(system|prompt|instructions|context)/i,
  /(what|tell\s+me)\s+(are|is)\s+(your|the)\s+(system|instructions|prompt)/i,
];

/**
 * Caractères dangereux à échapper
 */
const DANGEROUS_CHARACTERS = /[<>\"'`]/g;

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class PromptSecurityService {
  private readonly logger = new Logger(PromptSecurityService.name);

  /**
   * Vérifie si un input est sûr
   */
  checkInput(input: string): SecurityCheckResult {
    const threats: string[] = [];

    // Vérifier les patterns malveillants
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(input)) {
        threats.push(`Malicious pattern detected: ${pattern.source}`);
      }
    }

    // Vérifier la longueur excessive (peut être une tentative de DoS)
    if (input.length > 10000) {
      threats.push('Input too long (potential DoS)');
    }

    // Vérifier le ratio de caractères spéciaux (peut indiquer du code)
    const specialCharRatio = (input.match(/[{}[\]();,=+\-*/%<>!&|~^]/g) || []).length / input.length;
    if (specialCharRatio > 0.1 && input.length > 100) {
      threats.push('High ratio of special characters (potential code injection)');
    }

    const safe = threats.length === 0;

    if (!safe) {
      this.logger.warn(`Security threat detected in input: ${threats.join(', ')}`);
    }

    return {
      safe,
      threats,
      sanitized: safe ? undefined : this.sanitizeInput(input),
    };
  }

  /**
   * Sanitize un input (échapper caractères dangereux)
   */
  sanitizeInput(input: string): string {
    // Échapper caractères dangereux
    let sanitized = input.replace(DANGEROUS_CHARACTERS, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
      };
      return escapeMap[char] || char;
    });

    // Supprimer les tentatives de bypass système
    sanitized = sanitized.replace(
      /ignore\s+(previous|all|above)\s+(instructions|rules|system)/gi,
      '',
    );
    sanitized = sanitized.replace(/forget\s+(previous|all|everything)/gi, '');

    // Limiter la longueur
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000) + '... [truncated]';
    }

    return sanitized.trim();
  }

  /**
   * Valide un output LLM pour sécurité
   */
  validateOutput(output: string): SecurityCheckResult {
    const threats: string[] = [];

    // Vérifier tentatives d'exécution de code
    if (/<script/i.test(output) || /javascript:/i.test(output)) {
      threats.push('Potential XSS in output');
    }

    // Vérifier tentatives d'accès fichiers
    if (/file:\/\//i.test(output) || /\.\.\/\.\.\//.test(output)) {
      threats.push('Potential file access attempt');
    }

    // Vérifier tentatives d'injection SQL
    if (/(union|select|insert|update|delete|drop)\s+.*\s+(from|into|table)/i.test(output)) {
      threats.push('Potential SQL injection');
    }

    const safe = threats.length === 0;

    if (!safe) {
      this.logger.warn(`Security threat detected in output: ${threats.join(', ')}`);
    }

    return {
      safe,
      threats,
    };
  }

  /**
   * Vérifie et sanitize un input, throw si dangereux
   */
  validateAndSanitize(input: string, throwOnThreat: boolean = true): string {
    const check = this.checkInput(input);

    if (!check.safe) {
      if (throwOnThreat) {
        throw new BadRequestException(
          `Security threat detected: ${check.threats.join(', ')}`,
        );
      }
      return check.sanitized || input;
    }

    return input;
  }

  /**
   * Vérifie si un prompt contient des instructions système cachées
   */
  detectSystemPromptInjection(prompt: string): boolean {
    // Détecter tentatives de masquer instructions système
    const suspiciousPatterns = [
      /system\s*:\s*ignore/i,
      /\[system\]/i,
      /<system>/i,
      /hidden\s+instructions/i,
      /secret\s+prompt/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(prompt));
  }
}
