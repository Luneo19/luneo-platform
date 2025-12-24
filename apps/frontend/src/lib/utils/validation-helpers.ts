/**
 * ★★★ VALIDATION HELPERS - HELPERS VALIDATION ★★★
 * Helpers pour la validation de données
 * - Validation emails
 * - Validation URLs
 * - Validation téléphones
 * - Validation formats
 */

// ========================================
// EMAIL
// ========================================

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un email avec regex plus stricte
 */
export function isValidEmailStrict(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

// ========================================
// URL
// ========================================

/**
 * Valide une URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valide une URL relative
 */
export function isValidRelativeUrl(url: string): boolean {
  return /^\/[^\s]*$/.test(url);
}

/**
 * Valide une URL de domaine
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return domainRegex.test(domain);
}

// ========================================
// PHONE
// ========================================

/**
 * Valide un numéro de téléphone français
 */
export function isValidFrenchPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  // Format: 0X XX XX XX XX ou +33 X XX XX XX XX
  const frenchPhoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[0-9]{2}){4}$/;
  return frenchPhoneRegex.test(cleaned);
}

/**
 * Valide un numéro de téléphone international
 */
export function isValidInternationalPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  // Format: +XX...
  const internationalPhoneRegex = /^\+[1-9]\d{1,14}$/;
  return internationalPhoneRegex.test(cleaned);
}

// ========================================
// PASSWORD
// ========================================

/**
 * Valide la force d'un mot de passe
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Longueur minimale
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  // Contient une majuscule
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Ajoutez au moins une majuscule');
  }

  // Contient une minuscule
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Ajoutez au moins une minuscule');
  }

  // Contient un chiffre
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Ajoutez au moins un chiffre');
  }

  // Contient un caractère spécial
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push('Ajoutez au moins un caractère spécial');
  }

  return {
    isValid: score >= 4,
    score,
    feedback: score >= 4 ? [] : feedback,
  };
}

// ========================================
// CREDIT CARD
// ========================================

/**
 * Valide un numéro de carte bancaire (Luhn algorithm)
 */
export function isValidCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Détecte le type de carte bancaire
 */
export function detectCreditCardType(cardNumber: string): string | null {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (/^4/.test(cleaned)) return 'VISA';
  if (/^5[1-5]/.test(cleaned)) return 'MASTERCARD';
  if (/^3[47]/.test(cleaned)) return 'AMEX';
  if (/^6(?:011|5)/.test(cleaned)) return 'DISCOVER';
  if (/^3[068]/.test(cleaned)) return 'DINERS';
  if (/^35/.test(cleaned)) return 'JCB';

  return null;
}

// ========================================
// DATE
// ========================================

/**
 * Valide une date
 */
export function isValidDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

/**
 * Valide qu'une date est dans le futur
 */
export function isFutureDate(date: string | Date): boolean {
  if (!isValidDate(date)) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
}

/**
 * Valide qu'une date est dans le passé
 */
export function isPastDate(date: string | Date): boolean {
  if (!isValidDate(date)) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
}

// ========================================
// FILE
// ========================================

/**
 * Valide le type MIME d'un fichier
 */
export function isValidFileType(
  fileName: string,
  allowedTypes: string[]
): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return false;
  return allowedTypes.includes(extension);
}

/**
 * Valide la taille d'un fichier
 */
export function isValidFileSize(fileSize: number, maxSize: number): boolean {
  return fileSize <= maxSize;
}

/**
 * Valide une image
 */
export function isValidImage(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
}

/**
 * Valide un fichier 3D
 */
export function isValid3DFile(file: File): boolean {
  const allowedTypes = [
    'model/gltf-binary',
    'model/gltf+json',
    'model/usd',
    'model/fbx',
    'model/obj',
  ];
  const allowedExtensions = ['glb', 'gltf', 'usdz', 'fbx', 'obj'];
  const extension = file.name.split('.').pop()?.toLowerCase();

  return allowedTypes.includes(file.type) || (extension ? allowedExtensions.includes(extension) : false);
}

// ========================================
// COLOR
// ========================================

/**
 * Valide une couleur hex
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Valide une couleur RGB
 */
export function isValidRgbColor(color: string): boolean {
  return /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color);
}

/**
 * Valide une couleur RGBA
 */
export function isValidRgbaColor(color: string): boolean {
  return /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|1|0?\.\d+)\s*\)$/.test(color);
}

// ========================================
// EXPORT
// ========================================

export {
  isValidEmail,
  isValidEmailStrict,
  isValidUrl,
  isValidRelativeUrl,
  isValidDomain,
  isValidFrenchPhone,
  isValidInternationalPhone,
  validatePasswordStrength,
  isValidCreditCard,
  detectCreditCardType,
  isValidDate,
  isFutureDate,
  isPastDate,
  isValidFileType,
  isValidFileSize,
  isValidImage,
  isValid3DFile,
  isValidHexColor,
  isValidRgbColor,
  isValidRgbaColor,
};

