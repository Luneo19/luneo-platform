import { toast } from 'sonner';

export interface ApiError {
  message: string;
  statusCode: number;
  error: string;
  details?: any;
}

/**
 * Extract error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    return apiError?.message || error.message || 'Une erreur est survenue';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Une erreur est survenue';
}

/**
 * Handle API error with toast notification
 */
export function handleApiError(error: unknown, customMessage?: string) {
  const message = customMessage || getErrorMessage(error);
  
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    
    switch (status) {
      case 400:
        toast.error('Données invalides', { description: message });
        break;
      case 401:
        toast.error('Non authentifié', { 
          description: 'Veuillez vous reconnecter'
        });
        // Redirect to login will be handled by axios interceptor
        break;
      case 403:
        toast.error('Accès refusé', {
          description: 'Vous n\'avez pas les permissions nécessaires'
        });
        break;
      case 404:
        toast.error('Ressource introuvable', { description: message });
        break;
      case 409:
        toast.error('Conflit', { description: message });
        break;
      case 429:
        toast.error('Trop de requêtes', {
          description: 'Veuillez réessayer dans quelques instants'
        });
        break;
      case 500:
      case 502:
      case 503:
        toast.error('Erreur serveur', {
          description: 'Une erreur technique est survenue. Veuillez réessayer.'
        });
        break;
      default:
        toast.error('Erreur', { description: message });
    }
  } else {
    toast.error('Erreur', { description: message });
  }
}

/**
 * Handle success notification
 */
export function handleSuccess(message: string, description?: string) {
  toast.success(message, { description });
}

/**
 * Handle info notification
 */
export function handleInfo(message: string, description?: string) {
  toast.info(message, { description });
}

/**
 * Handle warning notification
 */
export function handleWarning(message: string, description?: string) {
  toast.warning(message, { description });
}

/**
 * Validate form errors
 */
export function getFormErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    
    if (apiError?.details && typeof apiError.details === 'object') {
      return apiError.details;
    }
  }
  
  return {};
}

// Re-export axios for type checking
import axios from 'axios';



