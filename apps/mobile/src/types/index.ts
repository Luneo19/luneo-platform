// Types de base pour l'app mobile Luneo Enterprise

import type {
  User as SharedUser,
  UserRole as SharedUserRole,
  UserPreferences as SharedUserPreferences,
  Brand as SharedBrand,
  BrandStatus as SharedBrandStatus,
  BrandSettings as SharedBrandSettings,
  Product as SharedProduct,
  ProductVariant as SharedProductVariant,
  Design as SharedDesign,
  DesignStatus as SharedDesignStatus,
  DesignMetadata as SharedDesignMetadata,
  Order as SharedOrder,
  OrderItem as SharedOrderItem,
  OrderStatus as SharedOrderStatus,
  PaymentStatus as SharedPaymentStatus,
  Address as SharedAddress,
  PaymentMethod as SharedPaymentMethod,
  Pagination as SharedPagination,
  ProductRecord as SharedProductRecord,
  ProductVariantRecord as SharedProductVariantRecord,
  OrderSummary as SharedOrderSummary,
  OrderItemSummary as SharedOrderItemSummary,
  DesignSummary as SharedDesignSummary,
  ApiKeySummary as SharedApiKeySummary,
  AnalyticsOverview as SharedAnalyticsOverview,
  ApiResponse as SharedApiResponse,
  PaginatedResponse as SharedPaginatedResponse,
  Notification as SharedNotification,
} from '@luneo/types';

export type User = SharedUser;
export type UserRole = SharedUserRole;
export type UserPreferences = SharedUserPreferences;
export type Brand = SharedBrand;
export type BrandStatus = SharedBrandStatus;
export type BrandSettings = SharedBrandSettings;
export type Product = SharedProduct;
export type ProductVariant = SharedProductVariant;
export type Design = SharedDesign;
export type DesignStatus = SharedDesignStatus;
export type DesignMetadata = SharedDesignMetadata;
export type DesignSummary = SharedDesignSummary;
export type ProductRecord = SharedProductRecord;
export type ProductVariantRecord = SharedProductVariantRecord;
export type Order = SharedOrder;
export type OrderItem = SharedOrderItem;
export type OrderStatus = SharedOrderStatus;
export type PaymentStatus = SharedPaymentStatus;
export type Address = SharedAddress;
export type PaymentMethod = SharedPaymentMethod;
export type Pagination = SharedPagination;
export type OrderSummary = SharedOrderSummary;
export type OrderItemSummary = SharedOrderItemSummary;
export type ApiKeySummary = SharedApiKeySummary;
export type AnalyticsOverview = SharedAnalyticsOverview;
export type ApiResponse<T = unknown> = SharedApiResponse<T>;
export type PaginatedResponse<T = unknown> = SharedPaginatedResponse<T>;
export type Notification = SharedNotification;

// Domain types are re-exported from @luneo/types (see aliases above)

// Types pour l'interface mobile
export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface ScreenProps {
  navigation: any;
  route: any;
}

// Types pour les formulaires
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
  biometric?: boolean;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Types pour les API responses et notifications sont fournis par @luneo/types

// Types pour les métriques
export interface DashboardMetrics {
  designsCount: number;
  ordersCount: number;
  revenue: number;
  usersCount: number;
  lastUpdated: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

// Types pour la synchronisation
export interface SyncStatus {
  isOnline: boolean;
  lastSync: string;
  pendingUploads: number;
  pendingDownloads: number;
  isSyncing: boolean;
}

export interface OfflineQueue {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: string;
  retryCount: number;
}

// Types pour les permissions
export interface PermissionStatus {
  camera: 'granted' | 'denied' | 'undetermined';
  photos: 'granted' | 'denied' | 'undetermined';
  notifications: 'granted' | 'denied' | 'undetermined';
  biometrics: 'granted' | 'denied' | 'undetermined';
}

// Types pour les erreurs
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Types pour les thèmes
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: any;
    h2: any;
    h3: any;
    body: any;
    caption: any;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// Types pour les animations
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

// Types pour les gestes
export interface GestureConfig {
  enabled: boolean;
  sensitivity: number;
  feedback: boolean;
}

// Types pour les configurations
export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildNumber: string;
  features: {
    biometrics: boolean;
    pushNotifications: boolean;
    offlineMode: boolean;
    darkMode: boolean;
  };
}


