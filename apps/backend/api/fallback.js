// ⚠️⚠️⚠️ ATTENTION: FICHIER DE DÉVELOPPEMENT UNIQUEMENT ⚠️⚠️⚠️
// Ce fichier contient des credentials hardcodés et ne doit JAMAIS être utilisé en production
// Il sert uniquement de fallback quand le backend NestJS n'est pas disponible en DEV

if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERREUR CRITIQUE: fallback.js ne doit PAS être utilisé en production !');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Luneo Backend API - Fallback Mode',
    version: '2.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    mode: 'fallback'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mode: 'fallback'
  });
});

// API endpoints
app.get('/api', (req, res) => {
  res.json({
    message: 'Luneo API Documentation - Fallback Mode',
    endpoints: {
      'GET /': 'API Information',
      'GET /health': 'Health Check',
      'GET /api': 'API Documentation',
      
      // Authentication
      'POST /api/auth/login': 'User Login',
      'POST /api/auth/register': 'User Registration',
      
      // Products & Designs
      'GET /api/products': 'Get Products',
      'GET /api/designs': 'Get Designs',
      'GET /api/orders': 'Get Orders',
      
      // Stripe Integration
      'GET /api/stripe/products': 'Get Stripe Products',
      'POST /api/stripe/create-subscription': 'Create Subscription',
      'POST /api/stripe/create-payment-intent': 'Create Payment Intent',
      
      // Analytics
      'GET /api/analytics/dashboard': 'Dashboard Analytics',
      'GET /api/analytics/usage': 'Usage Analytics'
    }
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'test@example.com' && password === 'password') {
    res.json({ 
      success: true, 
      message: 'Login successful', 
      token: `demo-token-${Date.now()}`,
      user: {
        id: 'user-1',
        email: email,
        role: 'BRAND_ADMIN',
        brandId: 'brand-1'
      }
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  if (email && password) {
    res.json({ 
      success: true, 
      message: 'Registration successful', 
      userId: `user-${Date.now()}`,
      token: `demo-token-${Date.now()}`
    });
  } else {
    res.status(400).json({ success: false, message: 'Email and password are required' });
  }
});

// Products endpoints
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    products: [
      { 
        id: 'prod1', 
        name: 'Custom T-Shirt', 
        price: 25.00,
        currency: 'EUR',
        category: 'Apparel',
        images: ['https://example.com/tshirt1.jpg'],
        customizableZones: 3,
        status: 'active'
      },
      { 
        id: 'prod2', 
        name: 'Personalized Mug', 
        price: 15.00,
        currency: 'EUR', 
        category: 'Accessories',
        images: ['https://example.com/mug1.jpg'],
        customizableZones: 1,
        status: 'active'
      }
    ],
    total: 2
  });
});

app.get('/api/designs', (req, res) => {
  res.json({
    success: true,
    designs: [
      {
        id: 'design1',
        name: 'Summer Collection Logo',
        productId: 'prod1',
        status: 'completed',
        imageUrl: 'https://example.com/design1.png',
        createdAt: '2025-10-15T14:30:00Z',
        renderUrl: 'https://example.com/design1-render.png'
      }
    ],
    total: 1
  });
});

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    orders: [
      {
        id: 'order1',
        productId: 'prod1',
        designId: 'design1',
        quantity: 50,
        status: 'processing',
        total: 1250.00,
        currency: 'EUR',
        createdAt: '2025-10-15T16:45:00Z'
      }
    ],
    total: 1
  });
});

// Stripe endpoints
app.get('/api/stripe/products', (req, res) => {
  res.json({
    success: true,
    products: [
      { 
        id: 'starter', 
        name: 'Starter Plan', 
        price: 0, 
        currency: 'eur', 
        interval: 'month', 
        features: ['10 designs/month', 'Basic templates', 'Email support'] 
      },
      { 
        id: 'pro', 
        name: 'Pro Plan', 
        price: 2999, 
        currency: 'eur', 
        interval: 'month', 
        features: ['100 designs/month', 'Premium templates', 'Priority support', 'API access'] 
      }
    ]
  });
});

app.post('/api/stripe/create-subscription', (req, res) => {
  const { planId, customerId } = req.body;
  res.json({ 
    success: true, 
    subscriptionId: `sub_demo_${Date.now()}`, 
    status: 'active', 
    plan: planId,
    customerId: customerId || 'cus_demo_user'
  });
});

app.post('/api/stripe/create-payment-intent', (req, res) => {
  const { amount, currency } = req.body;
  res.json({ 
    success: true, 
    clientSecret: `pi_demo_${Date.now()}`, 
    amount, 
    currency: currency || 'eur'
  });
});

// Analytics endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    success: true,
    period: 'last_30_days',
    metrics: {
      totalDesigns: 1250,
      totalRenders: 3400,
      activeUsers: 89,
      revenue: 15420.50,
      conversionRate: 12.5,
      avgSessionDuration: '8m 30s'
    }
  });
});

app.get('/api/analytics/usage', (req, res) => {
  res.json({
    success: true,
    usage: {
      designs: { used: 45, limit: 100, unit: 'designs' },
      renders: { used: 120, limit: 500, unit: 'renders' },
      storage: { used: 2.5, limit: 10, unit: 'GB' },
      apiCalls: { used: 15000, limit: 100000, unit: 'calls' }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Fallback Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel serverless function
module.exports = (req, res) => {
  return app(req, res);
};
