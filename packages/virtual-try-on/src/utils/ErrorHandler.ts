/**
 * @luneo/virtual-try-on - Error Handler professionnel
 * Gestion centralisée des erreurs avec types structurés
 */

import type { VirtualTryOnError } from '../core/types';
import type { Logger } from './Logger';

/**
 * Codes d'erreur standardisés
 */
export const ERROR_CODES = {
  // Camera errors
  CAMERA_NOT_FOUND: 'CAMERA_NOT_FOUND',
  CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
  CAMERA_IN_USE: 'CAMERA_IN_USE',
  CAMERA_INIT_FAILED: 'CAMERA_INIT_FAILED',
  
  // Tracking errors
  TRACKING_INIT_FAILED: 'TRACKING_INIT_FAILED',
  TRACKING_LOST: 'TRACKING_LOST',
  TRACKING_LOW_CONFIDENCE: 'TRACKING_LOW_CONFIDENCE',
  
  // Model errors
  MODEL_LOAD_FAILED: 'MODEL_LOAD_FAILED',
  MODEL_INVALID_FORMAT: 'MODEL_INVALID_FORMAT',
  MODEL_TOO_LARGE: 'MODEL_TOO_LARGE',
  
  // Rendering errors
  WEBGL_NOT_SUPPORTED: 'WEBGL_NOT_SUPPORTED',
  WEBGL_CONTEXT_LOST: 'WEBGL_CONTEXT_LOST',
  RENDER_FAILED: 'RENDER_FAILED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  
  // State errors
  INVALID_STATE: 'INVALID_STATE',
  INVALID_CONTAINER: 'INVALID_CONTAINER',
  INVALID_CONFIG: 'INVALID_CONFIG',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Messages d'erreur user-friendly
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  CAMERA_NOT_FOUND: 'Aucune caméra détectée. Veuillez connecter une caméra.',
  CAMERA_PERMISSION_DENIED: 'Permission caméra refusée. Veuillez autoriser l\'accès à la caméra.',
  CAMERA_IN_USE: 'La caméra est déjà utilisée par une autre application.',
  CAMERA_INIT_FAILED: 'Échec de l\'initialisation de la caméra.',
  
  TRACKING_INIT_FAILED: 'Échec de l\'initialisation du tracking.',
  TRACKING_LOST: 'Tracking perdu. Repositionnez votre visage/main face à la caméra.',
  TRACKING_LOW_CONFIDENCE: 'Qualité de tracking faible. Améliorez l\'éclairage.',
  
  MODEL_LOAD_FAILED: 'Échec du chargement du modèle 3D.',
  MODEL_INVALID_FORMAT: 'Format de modèle 3D invalide. Utilisez GLB ou GLTF.',
  MODEL_TOO_LARGE: 'Modèle 3D trop volumineux. Taille maximale: 50 MB.',
  
  WEBGL_NOT_SUPPORTED: 'WebGL non supporté par votre navigateur.',
  WEBGL_CONTEXT_LOST: 'Contexte WebGL perdu. Rechargez la page.',
  RENDER_FAILED: 'Échec du rendu 3D.',
  
  NETWORK_ERROR: 'Erreur réseau. Vérifiez votre connexion internet.',
  NETWORK_TIMEOUT: 'Timeout réseau. Réessayez.',
  
  INVALID_STATE: 'État invalide pour cette opération.',
  INVALID_CONTAINER: 'Container HTML invalide.',
  INVALID_CONFIG: 'Configuration invalide.',
};

/**
 * Error Handler professionnel
 * 
 * Features:
 * - Erreurs typées avec codes
 * - Messages user-friendly
 * - Catégorisation des erreurs
 * - Récupérabilité
 * - Logging automatique
 * 
 * @example
 * ```typescript
 * const errorHandler = new ErrorHandler(logger);
 * 
 * const error = errorHandler.createError(
 *   'Camera not found',
 *   'CAMERA_NOT_FOUND',
 *   'camera',
 *   true // recoverable
 * );
 * 
 * throw error;
 * ```
 */
export class ErrorHandler {
  constructor(private logger: Logger) {}

  /**
   * Crée une erreur VirtualTryOn structurée
   */
  createError(
    message: string,
    code: ErrorCode,
    category: VirtualTryOnError['category'],
    recoverable: boolean,
    details?: Record<string, any>
  ): VirtualTryOnError {
    const error = new Error(message) as VirtualTryOnError;
    error.code = code;
    error.category = category;
    error.recoverable = recoverable;
    error.details = details;
    error.name = 'VirtualTryOnError';

    return error;
  }

  /**
   * Gère une erreur (log + transform)
   */
  handleError(
    error: Error,
    category: VirtualTryOnError['category'],
    recoverable: boolean = false
  ): VirtualTryOnError {
    // Si déjà une VirtualTryOnError, juste log
    if (this.isVirtualTryOnError(error)) {
      this.logError(error);
      return error;
    }

    // Sinon, transformer en VirtualTryOnError
    const code = this.inferErrorCode(error, category);
    const virtualError = this.createError(
      error.message,
      code,
      category,
      recoverable,
      { originalError: error.name }
    );

    this.logError(virtualError);
    return virtualError;
  }

  /**
   * Obtient le message user-friendly
   */
  getUserMessage(error: VirtualTryOnError): string {
    return ERROR_MESSAGES[error.code as ErrorCode] || error.message;
  }

  /**
   * Vérifie si une erreur est récupérable
   */
  isRecoverable(error: VirtualTryOnError): boolean {
    return error.recoverable;
  }

  /**
   * Suggestions de résolution selon le code d'erreur
   */
  getSuggestions(error: VirtualTryOnError): string[] {
    const suggestions: Record<ErrorCode, string[]> = {
      CAMERA_NOT_FOUND: [
        'Connectez une webcam',
        'Vérifiez que la caméra est activée dans les paramètres système',
      ],
      CAMERA_PERMISSION_DENIED: [
        'Autorisez l\'accès à la caméra dans les paramètres du navigateur',
        'Rechargez la page après avoir donné la permission',
      ],
      CAMERA_IN_USE: [
        'Fermez les autres applications utilisant la caméra',
        'Rechargez la page',
      ],
      TRACKING_LOST: [
        'Repositionnez votre visage face à la caméra',
        'Améliorez l\'éclairage de la pièce',
        'Éloignez-vous légèrement de la caméra',
      ],
      MODEL_LOAD_FAILED: [
        'Vérifiez votre connexion internet',
        'Réessayez dans quelques instants',
      ],
      WEBGL_NOT_SUPPORTED: [
        'Utilisez un navigateur moderne (Chrome, Firefox, Safari)',
        'Mettez à jour votre navigateur',
      ],
      // Defaults
      CAMERA_INIT_FAILED: ['Rechargez la page', 'Vérifiez votre caméra'],
      TRACKING_INIT_FAILED: ['Rechargez la page'],
      TRACKING_LOW_CONFIDENCE: ['Améliorez l\'éclairage'],
      MODEL_INVALID_FORMAT: ['Utilisez un fichier GLB ou GLTF'],
      MODEL_TOO_LARGE: ['Optimisez le modèle 3D'],
      WEBGL_CONTEXT_LOST: ['Rechargez la page'],
      RENDER_FAILED: ['Rechargez la page'],
      NETWORK_ERROR: ['Vérifiez votre connexion'],
      NETWORK_TIMEOUT: ['Réessayez'],
      INVALID_STATE: ['Contactez le support'],
      INVALID_CONTAINER: ['Contactez le support'],
      INVALID_CONFIG: ['Contactez le support'],
    };

    return suggestions[error.code as ErrorCode] || ['Contactez le support technique'];
  }

  /**
   * Log une erreur avec détails
   */
  private logError(error: VirtualTryOnError): void {
    this.logger.error(
      `[${error.code}] ${error.message}`,
      {
        category: error.category,
        recoverable: error.recoverable,
        details: error.details,
        stack: error.stack,
      }
    );
  }

  /**
   * Vérifie si c'est une VirtualTryOnError
   */
  private isVirtualTryOnError(error: Error): error is VirtualTryOnError {
    return 'code' in error && 'category' in error && 'recoverable' in error;
  }

  /**
   * Infère le code d'erreur depuis une Error standard
   */
  private inferErrorCode(
    error: Error,
    category: VirtualTryOnError['category']
  ): ErrorCode {
    const message = error.message.toLowerCase();

    // Camera errors
    if (category === 'camera') {
      if (message.includes('permission') || message.includes('denied')) {
        return ERROR_CODES.CAMERA_PERMISSION_DENIED;
      }
      if (message.includes('not found') || message.includes('no device')) {
        return ERROR_CODES.CAMERA_NOT_FOUND;
      }
      if (message.includes('in use') || message.includes('already')) {
        return ERROR_CODES.CAMERA_IN_USE;
      }
      return ERROR_CODES.CAMERA_INIT_FAILED;
    }

    // Tracking errors
    if (category === 'tracking') {
      return ERROR_CODES.TRACKING_INIT_FAILED;
    }

    // Model errors
    if (category === 'model') {
      if (message.includes('format') || message.includes('invalid')) {
        return ERROR_CODES.MODEL_INVALID_FORMAT;
      }
      if (message.includes('size') || message.includes('large')) {
        return ERROR_CODES.MODEL_TOO_LARGE;
      }
      return ERROR_CODES.MODEL_LOAD_FAILED;
    }

    // Rendering errors
    if (category === 'rendering') {
      if (message.includes('webgl') || message.includes('context')) {
        return ERROR_CODES.WEBGL_NOT_SUPPORTED;
      }
      return ERROR_CODES.RENDER_FAILED;
    }

    // Network errors
    if (category === 'network') {
      if (message.includes('timeout')) {
        return ERROR_CODES.NETWORK_TIMEOUT;
      }
      return ERROR_CODES.NETWORK_ERROR;
    }

    // Default
    return ERROR_CODES.INVALID_STATE;
  }
}

