/**
 * AI Safety Utilities
 * Fonctions utilitaires pour la sécurité des prompts AI
 */

/**
 * Sanitize a prompt by removing potentially harmful content
 */
export function sanitizePrompt(
  prompt: string,
  options: { maxLength?: number } = {}
): { prompt: string; blocked: boolean; reasons?: string[] } {
  if (!prompt || typeof prompt !== 'string') {
    return { prompt: '', blocked: true, reasons: ['Empty or invalid prompt'] };
  }

  const maxLength = options.maxLength || 10000;

  // Remove null bytes
  let sanitized = prompt.replace(/\0/g, '');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Check for blocked patterns (basic safety checks)
  const blockedPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];

  const reasons: string[] = [];
  for (const pattern of blockedPatterns) {
    if (pattern.test(sanitized)) {
      reasons.push('Blocked pattern detected');
    }
  }

  if (reasons.length > 0) {
    return {
      prompt: '',
      blocked: true,
      reasons,
    };
  }

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return {
    prompt: sanitized,
    blocked: false,
  };
}

/**
 * Hash a prompt for logging/storage
 */
export function hashPrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') {
    return '';
  }

  // Simple hash function (for browser compatibility)
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Mask sensitive information in prompts for logs
 */
export function maskPromptForLogs(prompt: string, maxLength: number = 100): string {
  if (!prompt || typeof prompt !== 'string') {
    return '';
  }

  if (prompt.length <= maxLength) {
    return prompt;
  }

  // Show first and last parts, mask the middle
  const start = Math.floor(maxLength / 3);
  const end = prompt.length - Math.floor(maxLength / 3);
  
  return `${prompt.substring(0, start)}...${prompt.substring(end)}`;
}


