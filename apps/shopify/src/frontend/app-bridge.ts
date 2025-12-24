import { createApp } from '@shopify/app-bridge';
import { createAppBridgeProvider } from '@shopify/app-bridge-react';

// Configuration App Bridge pour Luneo
export const appBridgeConfig = {
  apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '',
  shopOrigin: process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ORIGIN || '',
  forceRedirect: true,
  debug: process.env.NODE_ENV === 'development',
};

// Créer l'instance App Bridge
export const app = createApp(appBridgeConfig);

// Créer le provider App Bridge
export const AppBridgeProvider = createAppBridgeProvider(app);

// Configuration des actions App Bridge
export const appBridgeActions = {
  // Navigation
  navigate: (path: string) => {
    app.dispatch('Navigate', { path });
  },

  // Modals
  openModal: (title: string, content: string, actions?: any[]) => {
    app.dispatch('Modal', {
      title,
      content,
      actions: actions || [],
    });
  },

  closeModal: () => {
    app.dispatch('Modal', { close: true });
  },

  // Toasts
  showToast: (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 5000) => {
    app.dispatch('Toast', {
      message,
      type,
      duration,
    });
  },

  // Loading
  showLoading: () => {
    app.dispatch('Loading', { show: true });
  },

  hideLoading: () => {
    app.dispatch('Loading', { show: false });
  },

  // Title
  setTitle: (title: string) => {
    app.dispatch('Title', { title });
  },

  // Context
  getContext: () => {
    return app.getState();
  },

  // User
  getCurrentUser: () => {
    return app.getState().user;
  },

  // Shop
  getShop: () => {
    return app.getState().shop;
  },

  // Session
  getSession: () => {
    return app.getState().session;
  },
};

// Hooks personnalisés pour App Bridge
export const useAppBridge = () => {
  return {
    app,
    actions: appBridgeActions,
    context: app.getState(),
  };
};

// Configuration des webhooks App Bridge
export const appBridgeWebhooks = {
  // Écouter les changements de contexte
  onContextChange: (callback: (context: any) => void) => {
    app.subscribe('Context', callback);
  },

  // Écouter les changements d'utilisateur
  onUserChange: (callback: (user: any) => void) => {
    app.subscribe('User', callback);
  },

  // Écouter les changements de shop
  onShopChange: (callback: (shop: any) => void) => {
    app.subscribe('Shop', callback);
  },

  // Écouter les changements de session
  onSessionChange: (callback: (session: any) => void) => {
    app.subscribe('Session', callback);
  },
};

// Utilitaires App Bridge
export const appBridgeUtils = {
  // Valider la configuration
  validateConfig: () => {
    if (!appBridgeConfig.apiKey) {
      console.error('SHOPIFY_API_KEY manquant');
      return false;
    }
    if (!appBridgeConfig.shopOrigin) {
      console.error('SHOPIFY_SHOP_ORIGIN manquant');
      return false;
    }
    return true;
  },

  // Obtenir l'URL de l'application
  getAppUrl: () => {
    return `${window.location.origin}${window.location.pathname}`;
  },

  // Obtenir l'URL de redirection
  getRedirectUrl: () => {
    return `${window.location.origin}/auth/callback`;
  },

  // Obtenir l'URL de l'admin Shopify
  getAdminUrl: (path: string = '') => {
    return `${appBridgeConfig.shopOrigin}/admin${path}`;
  },

  // Obtenir l'URL de l'API
  getApiUrl: (endpoint: string = '') => {
    return `/api/v1${endpoint}`;
  },

  // Formater les erreurs App Bridge
  formatError: (error: any) => {
    if (error.message) {
      return error.message;
    }
    if (error.error) {
      return error.error;
    }
    return 'Une erreur inattendue s\'est produite';
  },

  // Logger pour App Bridge
  log: (message: string, data?: any) => {
    if (appBridgeConfig.debug) {
      console.log(`[App Bridge] ${message}`, data);
    }
  },

  // Logger d'erreur pour App Bridge
  logError: (message: string, error?: any) => {
    console.error(`[App Bridge Error] ${message}`, error);
  },
};

// Configuration des permissions App Bridge
export const appBridgePermissions = {
  // Vérifier les permissions
  checkPermission: (permission: string) => {
    const context = app.getState();
    return context.user?.permissions?.includes(permission) || false;
  },

  // Obtenir toutes les permissions
  getAllPermissions: () => {
    const context = app.getState();
    return context.user?.permissions || [];
  },

  // Vérifier si l'utilisateur est propriétaire
  isOwner: () => {
    const context = app.getState();
    return context.user?.account_owner || false;
  },

  // Vérifier si l'utilisateur peut accéder à l'application
  canAccess: () => {
    const context = app.getState();
    return context.session?.access_token && context.shop?.id;
  },
};

// Configuration des thèmes App Bridge
export const appBridgeThemes = {
  // Obtenir le thème actuel
  getCurrentTheme: () => {
    const context = app.getState();
    return context.theme || 'light';
  },

  // Appliquer un thème
  applyTheme: (theme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', theme);
  },

  // Obtenir les couleurs du thème
  getThemeColors: () => {
    const theme = appBridgeThemes.getCurrentTheme();
    return theme === 'dark' 
      ? {
          primary: '#008060',
          secondary: '#004C3F',
          background: '#1A1A1A',
          surface: '#2D2D2D',
          text: '#FFFFFF',
          textSecondary: '#B3B3B3',
        }
      : {
          primary: '#008060',
          secondary: '#004C3F',
          background: '#FFFFFF',
          surface: '#F6F6F7',
          text: '#202223',
          textSecondary: '#6D7175',
        };
  },
};

// Configuration des locales App Bridge
export const appBridgeLocales = {
  // Obtenir la locale actuelle
  getCurrentLocale: () => {
    const context = app.getState();
    return context.locale || 'en';
  },

  // Obtenir la devise actuelle
  getCurrentCurrency: () => {
    const context = app.getState();
    return context.currency || 'EUR';
  },

  // Formater les montants
  formatAmount: (amount: number, currency?: string) => {
    const currentCurrency = currency || appBridgeLocales.getCurrentCurrency();
    return new Intl.NumberFormat(appBridgeLocales.getCurrentLocale(), {
      style: 'currency',
      currency: currentCurrency,
    }).format(amount);
  },

  // Formater les dates
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(appBridgeLocales.getCurrentLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(date);
  },
};

// Configuration des notifications App Bridge
export const appBridgeNotifications = {
  // Afficher une notification de succès
  success: (message: string) => {
    appBridgeActions.showToast(message, 'success');
  },

  // Afficher une notification d'erreur
  error: (message: string) => {
    appBridgeActions.showToast(message, 'error');
  },

  // Afficher une notification d'information
  info: (message: string) => {
    appBridgeActions.showToast(message, 'info');
  },

  // Afficher une notification de chargement
  loading: (message: string) => {
    appBridgeActions.showToast(message, 'info', 0); // Pas de timeout
  },
};

// Configuration des modals App Bridge
export const appBridgeModals = {
  // Modal de confirmation
  confirm: (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      appBridgeActions.openModal(title, message, [
        {
          label: 'Annuler',
          action: () => {
            appBridgeActions.closeModal();
            resolve(false);
          },
        },
        {
          label: 'Confirmer',
          action: () => {
            appBridgeActions.closeModal();
            resolve(true);
          },
        },
      ]);
    });
  },

  // Modal d'information
  info: (title: string, message: string) => {
    appBridgeActions.openModal(title, message, [
      {
        label: 'Fermer',
        action: () => {
          appBridgeActions.closeModal();
        },
      },
    ]);
  },

  // Modal d'erreur
  error: (title: string, message: string) => {
    appBridgeActions.openModal(title, message, [
      {
        label: 'Fermer',
        action: () => {
          appBridgeActions.closeModal();
        },
      },
    ]);
  },
};

// Export par défaut
export default {
  app,
  config: appBridgeConfig,
  actions: appBridgeActions,
  webhooks: appBridgeWebhooks,
  utils: appBridgeUtils,
  permissions: appBridgePermissions,
  themes: appBridgeThemes,
  locales: appBridgeLocales,
  notifications: appBridgeNotifications,
  modals: appBridgeModals,
};



