const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Luneo Backend API - Simple Mode',
    version: '2.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    mode: 'simple'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mode: 'simple'
  });
});

// API endpoints
app.get('/api', (req, res) => {
  res.json({
    message: 'Luneo API Documentation - Simple Mode',
    endpoints: {
      'GET /': 'API Information',
      'GET /health': 'Health Check',
      'GET /api': 'API Documentation',
      'POST /api/auth/login': 'User Login',
      'GET /api/products': 'Get Products',
      'GET /api/stripe/products': 'Get Stripe Products'
    }
  });
});

// Authentication
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

// Products
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    products: [
      { 
        id: 'prod1', 
        name: 'Custom T-Shirt', 
        price: 25.00,
        currency: 'EUR',
        status: 'active'
      }
    ],
    total: 1
  });
});

// Stripe
app.get('/api/stripe/products', (req, res) => {
  res.json({
    success: true,
    products: [
      { 
        id: 'starter', 
        name: 'Starter Plan', 
        price: 0, 
        currency: 'eur'
      }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
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

// Export for Vercel
module.exports = app;


