const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: 'Luneo Backend API',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Luneo API Documentation',
    endpoints: {
      'GET /': 'API Information',
      'GET /health': 'Health Check',
      'GET /api': 'API Documentation',
      'POST /api/auth/login': 'User Login',
      'POST /api/auth/register': 'User Registration',
      'GET /api/products': 'Get Products',
      'POST /api/designs': 'Create Design',
      'GET /api/orders': 'Get Orders'
    }
  });
});

// Routes API
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login endpoint ready',
    token: 'demo-token-' + Date.now()
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'Registration endpoint ready',
    user: { id: 'demo-user', email: req.body.email }
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    products: [
      { id: 1, name: 'T-Shirt Premium', price: 29.99 },
      { id: 2, name: 'Mug Personnalisé', price: 15.99 },
      { id: 3, name: 'Poster A3', price: 12.99 }
    ]
  });
});

app.post('/api/designs', (req, res) => {
  res.json({
    success: true,
    design: {
      id: 'demo-design-' + Date.now(),
      status: 'created',
      url: 'https://demo.luneo.app/design'
    }
  });
});

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    orders: [
      { id: 1, status: 'completed', total: 45.98 },
      { id: 2, status: 'processing', total: 29.99 }
    ]
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Luneo Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
});

module.exports = app;

// Stripe endpoints
app.post('/api/stripe/create-payment-intent', (req, res) => {
  res.json({
    success: true,
    clientSecret: 'pi_demo_' + Date.now(),
    amount: req.body.amount || 2999, // $29.99
    currency: 'usd'
  });
});

app.post('/api/stripe/create-subscription', (req, res) => {
  res.json({
    success: true,
    subscriptionId: 'sub_demo_' + Date.now(),
    status: 'active',
    plan: req.body.plan || 'pro'
  });
});

app.get('/api/stripe/products', (req, res) => {
  res.json({
    success: true,
    products: [
      {
        id: 'starter',
        name: 'Starter Plan',
        price: 999, // $9.99
        currency: 'usd',
        interval: 'month',
        features: ['5 designs/month', 'Basic templates', 'Email support']
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        price: 2999, // $29.99
        currency: 'usd',
        interval: 'month',
        features: ['Unlimited designs', 'Premium templates', 'Priority support', 'API access']
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price: 9999, // $99.99
        currency: 'usd',
        interval: 'month',
        features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'White-label']
      }
    ]
  });
});

app.post('/api/stripe/webhook', (req, res) => {
  // Simulate webhook processing
  res.json({
    success: true,
    message: 'Webhook processed',
    event: req.body.type || 'payment_intent.succeeded'
  });
});
