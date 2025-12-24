// Cloudflare Worker for Luneo Backend API
class SimpleRouter {
  constructor() {
    this.routes = [];
  }

  get(path, handler) {
    this.routes.push({ method: 'GET', path, handler });
  }

  post(path, handler) {
    this.routes.push({ method: 'POST', path, handler });
  }

  options(path, handler) {
    this.routes.push({ method: 'OPTIONS', path, handler });
  }

  async handle(request) {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    for (const route of this.routes) {
      if (route.method === method && route.path === pathname) {
        return await route.handler(request);
      }
      if (route.method === method && route.path === '*') {
        return await route.handler(request);
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

const router = new SimpleRouter();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({
    status: 'healthy',
    uptime: Date.now(),
    timestamp: new Date().toISOString(),
    modules: {
      productEngine: 'active',
      renderEngine: 'active',
      ecommerce: 'active',
      billing: 'active',
      security: 'active'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Root endpoint
router.get('/', () => {
  return new Response(JSON.stringify({
    message: 'Luneo Backend API - Version Complète',
    version: '2.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    features: [
      'Product Rules Engine',
      'Render Engine 2D/3D',
      'E-commerce Integrations',
      'Usage-Based Billing',
      'Security & RBAC',
      'AI Studio',
      'AR Studio',
      'Analytics',
      'Stripe Integration'
    ]
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Stripe Products
router.get('/api/stripe/products', () => {
  return new Response(JSON.stringify({
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
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price: 9999,
        currency: 'eur',
        interval: 'month',
        features: ['Unlimited designs', 'Custom integrations', 'Dedicated support', 'White-label']
      }
    ]
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Stripe Create Subscription
router.post('/api/stripe/create-subscription', async (request) => {
  const body = await request.json();
  return new Response(JSON.stringify({
    success: true,
    subscriptionId: `sub_demo_${Date.now()}`,
    status: 'active',
    plan: body.planId,
    customerId: body.customerId
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Stripe Create Payment Intent
router.post('/api/stripe/create-payment-intent', async (request) => {
  const body = await request.json();
  return new Response(JSON.stringify({
    success: true,
    clientSecret: `pi_demo_${Date.now()}`,
    amount: body.amount,
    currency: body.currency
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Auth Login
router.post('/api/auth/login', async (request) => {
  const body = await request.json();
  return new Response(JSON.stringify({
    success: true,
    message: 'Login successful',
    token: `demo-token-${Date.now()}`,
    user: {
      id: 'user-1',
      email: body.email,
      role: 'BRAND_ADMIN',
      brandId: 'brand-1'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Auth Register
router.post('/api/auth/register', async (request) => {
  const body = await request.json();
  return new Response(JSON.stringify({
    success: true,
    message: 'Registration successful',
    userId: `user-${Date.now()}`,
    token: `demo-token-${Date.now()}`
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Products
router.get('/api/products', () => {
  return new Response(JSON.stringify({
    success: true,
    products: [
      {
        id: 'prod1',
        name: 'Custom T-Shirt',
        price: 25,
        currency: 'EUR',
        category: 'Apparel',
        images: ['https://example.com/tshirt1.jpg', 'https://example.com/tshirt2.jpg'],
        customizableZones: 3,
        status: 'active'
      },
      {
        id: 'prod2',
        name: 'Personalized Mug',
        price: 15,
        currency: 'EUR',
        category: 'Accessories',
        images: ['https://example.com/mug1.jpg'],
        customizableZones: 1,
        status: 'active'
      }
    ],
    total: 2
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Orders
router.get('/api/orders', () => {
  return new Response(JSON.stringify({
    success: true,
    orders: [
      {
        id: 'order1',
        productId: 'prod1',
        designId: 'design1',
        quantity: 50,
        status: 'processing',
        total: 1250,
        currency: 'EUR',
        createdAt: '2025-10-15T16:45:00Z'
      }
    ],
    total: 1
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Handle CORS preflight
router.options('*', () => {
  return new Response(null, { headers: corsHeaders });
});

// 404 handler - handled in the main router.handle method

export default {
  async fetch(request, env, ctx) {
    return router.handle(request);
  },
};
