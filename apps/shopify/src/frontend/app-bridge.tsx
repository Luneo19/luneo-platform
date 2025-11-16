import { createApp } from '@shopify/app-bridge';
import { Provider as AppBridgeReactProvider, Context as AppBridgeReactContext } from '@shopify/app-bridge-react';
import type { ClientApplication } from '@shopify/app-bridge';
import type { PropsWithChildren } from 'react';
import { useContext } from 'react';
import type { ShopifyContext, ShopifyModalAction } from '../types/shopify.types';

// Configuration App Bridge pour Luneo
export const appBridgeConfig = {
  apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '',
  shopOrigin: process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ORIGIN || '',
  forceRedirect: true,
  debug: process.env.NODE_ENV === 'development',
  host: process.env.NEXT_PUBLIC_SHOPIFY_HOST || '',
};

let appInstance: ClientApplication | null = null;

const ensureApp = (): ClientApplication | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!appInstance) {
    appInstance = createApp(appBridgeConfig);
  }

  return appInstance;
};

function withApp<T>(callback: (app: ClientApplication) => T): T | undefined {
  const app = ensureApp();
  if (!app) {
    return undefined;
  }

  return callback(app);
}

const dispatchAppAction = (type: string, payload?: unknown): void => {
  withApp((app) => {
    (app as unknown as { dispatch: (actionType: string, actionPayload?: unknown) => void }).dispatch(
      type,
      payload
    );
  });
};

const internalGetContext = (app: ClientApplication | null = ensureApp()): ShopifyContext => {
  return (app?.getState() as ShopifyContext) ?? ({} as ShopifyContext);
};

// Créer le provider App Bridge
export const AppBridgeProvider = ({ children }: PropsWithChildren) => {
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  return (
    <AppBridgeReactProvider config={appBridgeConfig}>
      {children}
    </AppBridgeReactProvider>
  );
};

// Configuration des actions App Bridge
export const appBridgeActions = {
  // Navigation
  navigate: (path: string) => {
    dispatchAppAction('Navigate', { path });
  },

  // Modals
  openModal: (title: string, content: string, actions?: ShopifyModalAction[]) => {
    dispatchAppAction('Modal', {
      title,
      content,
      actions: actions || [],
    });
  },

  closeModal: () => {
    dispatchAppAction('Modal', { close: true });
  },

  // Toasts
  showToast: (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 5000) => {
    dispatchAppAction('Toast', {
      message,
      type,
      duration,
    });
  },

  // Loading
  showLoading: () => {
    dispatchAppAction('Loading', { show: true });
  },

  hideLoading: () => {
    dispatchAppAction('Loading', { show: false });
  },

  // Title
  setTitle: (title: string) => {
    dispatchAppAction('Title', { title });
  },

  // Context
  getContext: (): ShopifyContext => {
    return internalGetContext();
  },

  // User
  getCurrentUser: (): ShopifyContext['user'] => {
    return internalGetContext().user;
  },

  // Shop
  getShop: (): ShopifyContext['shop'] => {
    return internalGetContext().shop;
  },

  // Session
  getSession: (): ShopifyContext['session'] => {
    return internalGetContext().session;
  },
};

// Hooks personnalisés pour App Bridge
interface UseAppBridgeResult {
  app: ClientApplication | null;
  actions: typeof appBridgeActions;
  context: ShopifyContext;
}

export const useAppBridge = (): UseAppBridgeResult => {
  const contextApp = useContext(AppBridgeReactContext);

  if (typeof window === 'undefined') {
    return {
      app: null,
      actions: appBridgeActions,
      context: internalGetContext(null),
    };
  }

  const app = contextApp ?? ensureApp();

  return {
    app,
    actions: appBridgeActions,
    context: internalGetContext(app),
  };
};

// Configuration des webhooks App Bridge
export const appBridgeWebhooks = {
  // Écouter les changements de contexte
  onContextChange: (callback: (context: ShopifyContext) => void) => {
    withApp((app) => app.subscribe('Context', callback));
  },

  // Écouter les changements d'utilisateur
  onUserChange: (callback: (user: ShopifyContext['user']) => void) => {
    withApp((app) => app.subscribe('User', callback));
  },

  // Écouter les changements de shop
  onShopChange: (callback: (shop: ShopifyContext['shop']) => void) => {
    withApp((app) => app.subscribe('Shop', callback));
  },

  // Écouter les changements de session
  onSessionChange: (callback: (session: ShopifyContext['session']) => void) => {
    withApp((app) => app.subscribe('Session', callback));
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
    if (!appBridgeConfig.host) {
      console.error('SHOPIFY_HOST manquant');
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
  formatError: (error: unknown) => {
    const err = error as { message?: string; error?: string };
    if (err.message) {
      return err.message;
    }
    if (err.error) {
      return err.error;
    }
    return 'Une erreur inattendue s\'est produite';
  },

  // Logger pour App Bridge
  log: (message: string, data?: unknown) => {
    if (appBridgeConfig.debug) {
      console.log(`[App Bridge] ${message}`, data);
    }
  },

  // Logger d'erreur pour App Bridge
  logError: (message: string, error?: unknown) => {
    console.error(`[App Bridge Error] ${message}`, error);
  },
};

// Configuration des permissions App Bridge
export const appBridgePermissions = {
  // Vérifier les permissions
  checkPermission: (permission: string) => {
    const context = internalGetContext();
    const permissions =
      ((context.user as { permissions?: string[] } | undefined)?.permissions) ?? [];
    return permissions.includes(permission);
  },

  // Obtenir toutes les permissions
  getAllPermissions: () => {
    const context = internalGetContext();
    return ((context.user as { permissions?: string[] } | undefined)?.permissions) ?? [];
  },

  // Vérifier si l'utilisateur est propriétaire
  isOwner: () => {
    const context = internalGetContext();
    return context.user?.account_owner || false;
  },

  // Vérifier si l'utilisateur peut accéder à l'application
  canAccess: () => {
    const context = internalGetContext();
    return context.session?.access_token && context.shop?.id;
  },
};

// Configuration des thèmes App Bridge
export const appBridgeThemes = {
  // Obtenir le thème actuel
  getCurrentTheme: () => {
    const context = internalGetContext();
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
    const context = internalGetContext();
    return context.locale || 'en';
  },

  // Obtenir la devise actuelle
  getCurrentCurrency: () => {
    const context = internalGetContext();
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
      const actions: ShopifyModalAction[] = [
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
      ];
      appBridgeActions.openModal(title, message, actions);
    });
  },

  // Modal d'information
  info: (title: string, message: string) => {
    const actions: ShopifyModalAction[] = [
      {
        label: 'Fermer',
        action: () => {
          appBridgeActions.closeModal();
        },
      },
    ];
    appBridgeActions.openModal(title, message, actions);
  },

  // Modal d'erreur
  error: (title: string, message: string) => {
    const actions: ShopifyModalAction[] = [
      {
        label: 'Fermer',
        action: () => {
          appBridgeActions.closeModal();
        },
      },
    ];
    appBridgeActions.openModal(title, message, actions);
  },
};

// Export par défaut
const appBridge = {
  get app() {
    return ensureApp();
  },
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

export default appBridge;



