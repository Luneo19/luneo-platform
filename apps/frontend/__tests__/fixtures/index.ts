/**
 * Fixtures centralisées pour les tests
 * T-003: Créer fixtures et mocks globaux
 */

// ============================================
// USER FIXTURES
// ============================================

export const mockUsers = {
  admin: {
    id: 'admin-001',
    email: 'admin@luneo.app',
    name: 'Admin User',
    avatar_url: 'https://example.com/admin-avatar.png',
    company: 'Luneo',
    role: 'admin',
    subscription_tier: 'enterprise',
    created_at: '2024-01-01T00:00:00.000Z',
  },
  pro: {
    id: 'user-pro-001',
    email: 'pro@example.com',
    name: 'Pro User',
    avatar_url: null,
    company: 'Pro Company',
    role: 'user',
    subscription_tier: 'professional',
    created_at: '2024-06-01T00:00:00.000Z',
  },
  starter: {
    id: 'user-starter-001',
    email: 'starter@example.com',
    name: 'Starter User',
    avatar_url: null,
    company: null,
    role: 'user',
    subscription_tier: 'starter',
    created_at: '2024-10-01T00:00:00.000Z',
  },
  free: {
    id: 'user-free-001',
    email: 'free@example.com',
    name: 'Free User',
    avatar_url: null,
    company: null,
    role: 'user',
    subscription_tier: 'free',
    created_at: '2024-11-01T00:00:00.000Z',
  },
};

// ============================================
// SESSION FIXTURES
// ============================================

export const mockSessions = {
  valid: {
    access_token: 'valid-access-token-123',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'valid-refresh-token-123',
    user: mockUsers.pro,
  },
  expired: {
    access_token: 'expired-access-token-123',
    token_type: 'bearer',
    expires_in: 0,
    expires_at: Math.floor(Date.now() / 1000) - 3600,
    refresh_token: 'expired-refresh-token-123',
    user: mockUsers.pro,
  },
  admin: {
    access_token: 'admin-access-token-123',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'admin-refresh-token-123',
    user: mockUsers.admin,
  },
};

// ============================================
// DESIGN FIXTURES
// ============================================

export const mockDesigns = {
  completed: {
    id: 'design-001',
    name: 'Design Complété',
    description: 'Un design finalisé',
    preview_url: 'https://example.com/designs/001-preview.png',
    thumbnail_url: 'https://example.com/designs/001-thumb.png',
    status: 'completed',
    user_id: mockUsers.pro.id,
    product_id: 'product-001',
    canvas_data: { objects: [], background: '#ffffff' },
    created_at: '2024-11-01T00:00:00.000Z',
    updated_at: '2024-11-15T00:00:00.000Z',
  },
  draft: {
    id: 'design-002',
    name: 'Brouillon',
    description: 'Un design en cours',
    preview_url: null,
    thumbnail_url: null,
    status: 'draft',
    user_id: mockUsers.pro.id,
    product_id: 'product-002',
    canvas_data: { objects: [], background: '#f0f0f0' },
    created_at: '2024-11-20T00:00:00.000Z',
    updated_at: '2024-11-20T00:00:00.000Z',
  },
  processing: {
    id: 'design-003',
    name: 'En traitement',
    description: 'Design en cours de génération',
    preview_url: null,
    thumbnail_url: null,
    status: 'processing',
    user_id: mockUsers.pro.id,
    product_id: 'product-001',
    canvas_data: null,
    created_at: '2024-11-25T00:00:00.000Z',
    updated_at: '2024-11-25T00:00:00.000Z',
  },
};

// ============================================
// PRODUCT FIXTURES
// ============================================

export const mockProducts = {
  tshirt: {
    id: 'product-001',
    name: 'T-Shirt Premium',
    description: 'T-shirt 100% coton bio',
    price: 29.99,
    currency: 'EUR',
    images: [
      'https://example.com/products/tshirt-front.png',
      'https://example.com/products/tshirt-back.png',
    ],
    category: 'clothing',
    variants: [
      { id: 'v1', size: 'S', color: 'white', stock: 100 },
      { id: 'v2', size: 'M', color: 'white', stock: 150 },
      { id: 'v3', size: 'L', color: 'white', stock: 80 },
    ],
    is_active: true,
    is_customizable: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
  mug: {
    id: 'product-002',
    name: 'Mug Personnalisé',
    description: 'Mug en céramique 350ml',
    price: 14.99,
    currency: 'EUR',
    images: ['https://example.com/products/mug.png'],
    category: 'accessories',
    variants: [
      { id: 'v4', size: 'standard', color: 'white', stock: 200 },
      { id: 'v5', size: 'standard', color: 'black', stock: 150 },
    ],
    is_active: true,
    is_customizable: true,
    created_at: '2024-02-01T00:00:00.000Z',
  },
  poster: {
    id: 'product-003',
    name: 'Poster A2',
    description: 'Impression haute qualité',
    price: 19.99,
    currency: 'EUR',
    images: ['https://example.com/products/poster.png'],
    category: 'print',
    variants: [
      { id: 'v6', size: 'A2', color: 'glossy', stock: 500 },
      { id: 'v7', size: 'A2', color: 'matte', stock: 500 },
    ],
    is_active: true,
    is_customizable: true,
    created_at: '2024-03-01T00:00:00.000Z',
  },
};

// ============================================
// PRICING FIXTURES
// ============================================

export const mockPlans = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour découvrir Luneo',
    price: { monthly: 29, yearly: 278.40 },
    currency: 'EUR',
    features: [
      '50 designs/mois',
      '100 rendus 2D',
      '10 rendus 3D',
      'Support email',
    ],
    limits: {
      designs: 50,
      renders2d: 100,
      renders3d: 10,
      storage: 5, // GB
    },
    stripePriceId: {
      monthly: 'price_starter_monthly',
      yearly: 'price_starter_yearly',
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Pour les créateurs sérieux',
    price: { monthly: 49, yearly: 470.40 },
    currency: 'EUR',
    features: [
      '200 designs/mois',
      '500 rendus 2D',
      '50 rendus 3D',
      'Virtual Try-On',
      'Support prioritaire',
    ],
    limits: {
      designs: 200,
      renders2d: 500,
      renders3d: 50,
      storage: 25, // GB
    },
    stripePriceId: {
      monthly: 'price_professional_monthly',
      yearly: 'price_professional_yearly',
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'Pour les équipes en croissance',
    price: { monthly: 99, yearly: 950.40 },
    currency: 'EUR',
    features: [
      'Designs illimités',
      '2000 rendus 2D',
      '200 rendus 3D',
      'Virtual Try-On',
      'API access',
      'Support dédié',
    ],
    limits: {
      designs: -1, // unlimited
      renders2d: 2000,
      renders3d: 200,
      storage: 100, // GB
    },
    stripePriceId: {
      monthly: 'price_business_monthly',
      yearly: 'price_business_yearly',
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solutions sur mesure',
    price: { monthly: null, yearly: null },
    currency: 'EUR',
    features: [
      'Tout illimité',
      'Custom integrations',
      'SLA garanti',
      'Account manager',
    ],
    limits: {
      designs: -1,
      renders2d: -1,
      renders3d: -1,
      storage: -1,
    },
    stripePriceId: null,
  },
};

// ============================================
// NOTIFICATION FIXTURES
// ============================================

export const mockNotifications = {
  info: {
    id: 'notif-001',
    type: 'info',
    title: 'Bienvenue !',
    message: 'Bienvenue sur Luneo Platform',
    read: false,
    action_url: '/dashboard',
    action_label: 'Voir le tableau de bord',
    created_at: '2024-11-25T10:00:00.000Z',
  },
  success: {
    id: 'notif-002',
    type: 'success',
    title: 'Design exporté',
    message: 'Votre design a été exporté avec succès',
    read: true,
    action_url: '/dashboard/designs',
    action_label: 'Voir mes designs',
    created_at: '2024-11-24T15:30:00.000Z',
  },
  warning: {
    id: 'notif-003',
    type: 'warning',
    title: 'Quota presque atteint',
    message: 'Vous avez utilisé 90% de vos rendus 3D ce mois',
    read: false,
    action_url: '/pricing',
    action_label: 'Upgrader',
    created_at: '2024-11-23T08:00:00.000Z',
  },
  error: {
    id: 'notif-004',
    type: 'error',
    title: 'Échec de paiement',
    message: 'Votre paiement a échoué. Veuillez mettre à jour vos informations.',
    read: false,
    action_url: '/dashboard/billing',
    action_label: 'Mettre à jour',
    created_at: '2024-11-22T12:00:00.000Z',
  },
};

// ============================================
// SUPPORT TICKET FIXTURES
// ============================================

export const mockTickets = {
  open: {
    id: 'ticket-001',
    user_id: mockUsers.pro.id,
    user_email: mockUsers.pro.email,
    subject: 'Problème d\'export PDF',
    description: 'Le PDF généré est vide',
    category: 'technical',
    priority: 'high',
    status: 'open',
    messages_count: 1,
    assigned_to: null,
    created_at: '2024-11-25T09:00:00.000Z',
    updated_at: '2024-11-25T09:00:00.000Z',
  },
  inProgress: {
    id: 'ticket-002',
    user_id: mockUsers.pro.id,
    user_email: mockUsers.pro.email,
    subject: 'Question facturation',
    description: 'Comment puis-je obtenir une facture ?',
    category: 'billing',
    priority: 'medium',
    status: 'in_progress',
    messages_count: 3,
    assigned_to: mockUsers.admin.id,
    created_at: '2024-11-20T14:00:00.000Z',
    updated_at: '2024-11-24T10:30:00.000Z',
  },
  resolved: {
    id: 'ticket-003',
    user_id: mockUsers.starter.id,
    user_email: mockUsers.starter.email,
    subject: 'Comment utiliser le 3D ?',
    description: 'Je ne comprends pas comment configurer le viewer 3D',
    category: 'feature',
    priority: 'low',
    status: 'resolved',
    messages_count: 5,
    assigned_to: mockUsers.admin.id,
    created_at: '2024-11-15T11:00:00.000Z',
    updated_at: '2024-11-18T16:00:00.000Z',
  },
};

// ============================================
// API RESPONSE FIXTURES
// ============================================

export const mockApiResponses = {
  success: {
    success: true,
    data: {},
    message: 'Operation successful',
  },
  error: {
    success: false,
    error: 'Something went wrong',
    message: 'An error occurred',
  },
  unauthorized: {
    success: false,
    error: 'Unauthorized',
    message: 'You must be logged in to perform this action',
  },
  forbidden: {
    success: false,
    error: 'Forbidden',
    message: 'You do not have permission to perform this action',
  },
  notFound: {
    success: false,
    error: 'Not Found',
    message: 'The requested resource was not found',
  },
  validationError: {
    success: false,
    error: 'Validation Error',
    message: 'Invalid input data',
    details: [
      { field: 'email', message: 'Email is required' },
      { field: 'password', message: 'Password must be at least 8 characters' },
    ],
  },
  rateLimited: {
    success: false,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: 60,
  },
};

// ============================================
// FORM DATA FIXTURES
// ============================================

export const mockFormData = {
  login: {
    valid: {
      email: 'test@example.com',
      password: 'SecurePassword123!',
    },
    invalidEmail: {
      email: 'invalid-email',
      password: 'SecurePassword123!',
    },
    weakPassword: {
      email: 'test@example.com',
      password: '123',
    },
  },
  register: {
    valid: {
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      company: 'Test Company',
      acceptTerms: true,
    },
    passwordMismatch: {
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      confirmPassword: 'DifferentPassword123!',
      company: 'Test Company',
      acceptTerms: true,
    },
    missingTerms: {
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      company: 'Test Company',
      acceptTerms: false,
    },
  },
  contact: {
    valid: {
      name: 'Contact User',
      email: 'contact@example.com',
      subject: 'General Inquiry',
      message: 'This is a test message for the contact form.',
      company: 'Contact Company',
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Générer un ID unique pour les tests
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Générer un email unique pour les tests
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test-luneo.app`;
}

/**
 * Cloner et modifier une fixture
 */
export function cloneFixture<T>(fixture: T, overrides: Partial<T> = {}): T {
  return { ...fixture, ...overrides };
}


