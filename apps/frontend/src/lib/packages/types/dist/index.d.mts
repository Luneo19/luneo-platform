interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    avatar?: string;
    role: UserRole;
    brandId?: string;
    plan?: SubscriptionPlan;
    emailVerified?: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    preferences?: UserPreferences;
}
type UserRole = 'user' | 'admin' | 'designer' | 'owner' | 'super_admin' | 'CONSUMER' | 'BRAND_USER' | 'BRAND_ADMIN' | 'PLATFORM_ADMIN' | 'FABRICATOR';
interface UserPreferences {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: {
        push: boolean;
        email: boolean;
        sms: boolean;
    };
    biometrics?: boolean;
    autoSync?: boolean;
}
type SubscriptionPlan = 'starter' | 'professional' | 'business' | 'enterprise' | 'FREE' | 'PRO' | 'ENTERPRISE';
interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}
interface RegisterData {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    acceptTerms?: boolean;
}
interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
interface AuthResponse {
    user: User;
    tokens: AuthTokens;
}
interface Brand {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    status: BrandStatus;
    settings?: BrandSettings;
    createdAt: string;
    updatedAt: string;
}
type BrandStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'VERIFIED';
interface BrandSettings {
    colors?: {
        primary: string;
        secondary: string;
        accent?: string;
    };
    fonts?: {
        primary: string;
        secondary?: string;
    };
    currency?: string;
    timezone?: string;
    locale?: string;
}
interface Design {
    id: string;
    name?: string;
    description?: string;
    prompt: string;
    promptHash?: string;
    options?: Record<string, unknown>;
    status: DesignStatus;
    previewUrl?: string;
    highResUrl?: string;
    imageUrl?: string;
    renderUrl?: string;
    metadata?: DesignMetadata;
    costCents?: number;
    provider?: string;
    userId?: string;
    brandId: string;
    productId: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}
type DesignStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'draft' | 'generating' | 'archived';
type DesignStyle = 'moderne' | 'vintage' | 'minimaliste' | 'colore' | 'professionnel' | 'futuriste' | 'organique' | 'geometrique';
type DesignMetadata = Record<string, unknown> & {
    fileSize?: number;
    format?: string;
    generationTime?: number;
    aiModel?: string;
    version?: string;
};
interface GenerateDesignRequest {
    prompt: string;
    style: DesignStyle;
    dimensions: string;
    quality: 'standard' | 'hd';
}
interface GenerateDesignResponse {
    designId: string;
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    estimatedTime: number;
}
interface Product {
    id: string;
    brandId: string;
    name: string;
    description?: string;
    sku?: string;
    price: number;
    currency: string;
    images: string[];
    baseAssetUrl?: string;
    model3dUrl?: string;
    customizationOptions?: Record<string, unknown>;
    rulesJson?: Record<string, unknown>;
    materialOptions?: Record<string, unknown>;
    finishOptions?: Record<string, unknown>;
    productionTime?: number;
    isActive: boolean;
    isPublic?: boolean;
    createdAt: string;
    updatedAt: string;
    variants?: ProductVariant[];
}
interface ProductVariant {
    id: string;
    productId?: string;
    name: string;
    sku?: string;
    price?: number;
    priceModifier?: number;
    attributes?: Record<string, string>;
    stock?: number;
    images?: string[];
    createdAt?: string;
    updatedAt?: string;
}
interface Order {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    customerEmail: string;
    customerName?: string;
    customerPhone?: string;
    subtotalCents: number;
    taxCents: number;
    shippingCents: number;
    totalCents: number;
    currency: string;
    paymentMethod?: string;
    shippingAddress?: Address | Record<string, unknown>;
    billingAddress?: Address | Record<string, unknown>;
    shippingMethod?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    productionBundleUrl?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
    items?: OrderItem[];
    createdAt: string;
    updatedAt: string;
    paidAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
}
interface OrderItem {
    id: string;
    productId: string;
    designId?: string;
    variantId?: string;
    name: string;
    imageUrl?: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
    customization?: Record<string, unknown>;
}
type OrderStatus = 'CREATED' | 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' | 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed';
type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'paid' | 'pending' | 'refunded';
interface Address {
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
interface PaymentMethod {
    type: 'card' | 'apple_pay' | 'google_pay' | 'paypal' | string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
}
interface ApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    permissions: string[];
    rateLimit: number;
    lastUsedAt?: string;
    expiresAt?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    key?: string;
}
interface Model3D {
    id: string;
    name: string;
    url: string;
    format: '3d-model' | 'glb' | 'gltf' | 'usdz';
    thumbnailUrl: string;
    fileSize: number;
    dimensions: {
        width: number;
        height: number;
        depth: number;
    };
    metadata: Model3DMetadata;
    createdAt: string;
    updatedAt: string;
}
interface Model3DMetadata {
    vertices: number;
    faces: number;
    materials: number;
    textures: number;
    animations: number;
}
interface ARConfiguration {
    modelUrl: string;
    posterUrl?: string;
    autoRotate: boolean;
    cameraControls: boolean;
    arMode: boolean;
    environment: string;
    exposure: number;
    shadowIntensity: number;
}
interface Subscription {
    id: string;
    userId: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    billingCycle: 'monthly' | 'yearly';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialEnd?: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    createdAt: string;
    updatedAt: string;
}
type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete' | 'incomplete_expired';
interface PlanFeatures {
    aiGenerations: number | 'unlimited';
    storageGB: number;
    teamMembers: number;
    exportFormats: string[];
    support: 'email' | 'priority' | 'dedicated';
    customBranding: boolean;
    apiAccess: boolean;
}
interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ApiMeta;
}
interface ApiError {
    code: string;
    message: string;
    details?: unknown;
}
interface ApiMeta {
    timestamp: string;
    requestId: string;
    version: string;
}
interface PaginatedResponse<T> {
    data: T[];
    pagination: Pagination;
}
interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
interface WidgetConfig {
    apiKey: string;
    productName: string;
    theme: 'light' | 'dark' | 'auto';
    language: 'fr' | 'en' | 'es' | 'de';
    features: {
        ai: boolean;
        ar: boolean;
        '3d': boolean;
    };
    callbacks?: WidgetCallbacks;
}
interface WidgetCallbacks {
    onDesignGenerated?: (design: Design) => void;
    onError?: (error: Error) => void;
    onLoad?: () => void;
}
interface ShopifyShop {
    id: string;
    domain: string;
    name: string;
    email: string;
    currency: string;
    timezone: string;
    plan: string;
    installedAt: string;
}
interface ShopifyWebhook {
    topic: string;
    shopDomain: string;
    apiVersion: string;
    webhookId: string;
}
type ShopifyWebhookTopic = 'orders/create' | 'orders/updated' | 'orders/paid' | 'orders/cancelled' | 'orders/fulfilled' | 'products/create' | 'products/update' | 'products/delete' | 'customers/create' | 'customers/update' | 'customers/delete' | 'app/uninstalled';
interface Job<T = unknown> {
    id: string;
    type: JobType;
    data: T;
    status: JobStatus;
    progress: number;
    result?: unknown;
    error?: string;
    attempts: number;
    maxAttempts: number;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    failedAt?: string;
}
type JobType = 'image-generation' | 'upscale' | 'blend-texture' | 'export-gltf' | 'ar-preview' | 'email-send' | 'data-sync';
type JobStatus = 'queued' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    icon?: string;
    link?: string;
    read: boolean;
    createdAt: string;
}
type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'design_completed' | 'order_confirmed' | 'subscription_updated';
interface Analytics {
    userId: string;
    event: AnalyticsEvent;
    properties: Record<string, unknown>;
    timestamp: string;
}
type AnalyticsEvent = 'page_view' | 'design_created' | 'design_generated' | 'product_viewed' | 'order_placed' | 'subscription_started' | 'subscription_cancelled';
interface AnalyticsOverview {
    designs: {
        total: number;
        completed: number;
        failed: number;
        processing: number;
    };
    orders: {
        total: number;
        revenue: number;
        averageOrderValue: number;
    };
    users: {
        total: number;
        active: number;
    };
}
interface DesignSummary {
    id: string;
    name?: string;
    description?: string;
    prompt: string;
    status: DesignStatus;
    previewUrl?: string;
    highResUrl?: string;
    metadata?: Record<string, unknown>;
    productId: string;
    createdAt: string;
    updatedAt: string;
}
interface ProductRecord {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    sku?: string;
    base_price: number;
    currency: string;
    images: string[];
    customization_options?: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    product_variants?: ProductVariantRecord[];
}
interface ProductVariantRecord {
    id: string;
    product_id: string;
    name: string;
    sku?: string;
    price_modifier: number;
    attributes: Record<string, unknown>;
    created_at: string;
}
interface OrderItemSummary {
    id: string;
    product_name: string;
    design_name?: string;
    design_preview_url?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    production_status?: string;
}
interface OrderSummary {
    id: string;
    order_number: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    customer_email: string;
    customer_name?: string;
    total_amount: number;
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    discount_amount: number;
    currency: string;
    payment_method?: string;
    shipping_address?: Record<string, unknown>;
    shipping_method?: string;
    tracking_number?: string;
    invoice_url?: string;
    items?: OrderItemSummary[];
    created_at: string;
    updated_at: string;
    shipped_at?: string;
    delivered_at?: string;
}
interface ApiKeySummary {
    id: string;
    name: string;
    key_prefix: string;
    permissions: string[];
    rate_limit: number;
    last_used_at?: string;
    expires_at?: string;
    is_active: boolean;
    created_at: string;
}
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export type { ARConfiguration, Address, Analytics, AnalyticsEvent, AnalyticsOverview, ApiError, ApiKey, ApiKeySummary, ApiMeta, ApiResponse, AuthResponse, AuthTokens, Brand, BrandSettings, BrandStatus, DeepPartial, Design, DesignMetadata, DesignStatus, DesignStyle, DesignSummary, GenerateDesignRequest, GenerateDesignResponse, Job, JobStatus, JobType, LoginCredentials, Model3D, Model3DMetadata, Notification, NotificationType, Order, OrderItem, OrderItemSummary, OrderStatus, OrderSummary, PaginatedResponse, Pagination, PaymentMethod, PaymentStatus, PlanFeatures, Prettify, Product, ProductRecord, ProductVariant, ProductVariantRecord, RegisterData, RequireAtLeastOne, ShopifyShop, ShopifyWebhook, ShopifyWebhookTopic, Subscription, SubscriptionPlan, SubscriptionStatus, User, UserPreferences, UserRole, WidgetCallbacks, WidgetConfig };
