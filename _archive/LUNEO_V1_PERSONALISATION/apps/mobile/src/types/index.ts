// Types de base pour l'app mobile Luneo Enterprise

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  brandId?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  BRAND_ADMIN = 'BRAND_ADMIN',
  BRAND_USER = 'BRAND_USER',
  CUSTOMER = 'CUSTOMER',
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  biometrics: boolean;
  autoSync: boolean;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  status: BrandStatus;
  settings: BrandSettings;
  createdAt: string;
  updatedAt: string;
}

export enum BrandStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface BrandSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  currency: string;
  timezone: string;
}

export interface Product {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  variants: ProductVariant[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  attributes: Record<string, string>;
  stock?: number;
  images: string[];
}

export interface Design {
  id: string;
  brandId: string;
  userId: string;
  name: string;
  description?: string;
  prompt?: string;
  imageUrl: string;
  thumbnailUrl: string;
  status: DesignStatus;
  tags: string[];
  metadata: DesignMetadata;
  createdAt: string;
  updatedAt: string;
}

export enum DesignStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

export interface DesignMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  aiModel?: string;
  generationTime?: number;
  iterations?: number;
}

export interface Order {
  id: string;
  brandId: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  designId?: string;
  variantId?: string;
  quantity: number;
  price: number;
  total: number;
  customization?: Record<string, any>;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentMethod {
  type: 'card' | 'apple_pay' | 'google_pay' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

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

// Types pour les API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Types pour les notifications
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

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


