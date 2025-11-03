# 🔥 PLAN CONNEXION BACKEND COMPLET - OPTION A

**Date:** 3 Novembre 2025  
**Objectif:** Connecter les 9 pages dashboard au backend Supabase  
**Durée:** 3-4h  
**Statut:** EN COURS

---

## 📋 **TABLES EXISTANTES (d'après code)**

✅ **Déjà créées:**
- `profiles` (users data)
- `designs` (user designs)
- `orders` (commandes)
- `products` (produits)
- `templates` (templates)
- `cliparts` (cliparts)
- `ar_models` (modèles AR)
- `integrations` (intégrations)
- `api_keys` (clés API)
- `team_members` (membres équipe)
- `webhook_endpoints` (webhooks)
- `notifications` (notifications)

---

## ❌ **TABLES MANQUANTES À CRÉER**

### **Pour Settings Page:**
- `user_sessions` (sessions actives)
- `password_resets` (réinitialisation mdp)
- `totp_secrets` (2FA)

### **Pour Team Page:**
- `team_invites` (invitations en attente)
- `team_roles` (rôles personnalisés)

### **Pour Billing Page:**
- `invoices` (factures)
- `payment_methods` (moyens de paiement)

### **Pour Library Page:**
- `user_templates` (templates utilisateur)
- `template_favorites` (favoris)

---

## 🎯 **PHASE 1: CRÉER TABLES MANQUANTES (30min)**

### **1.1 Script SQL Complet**

```sql
-- ============================================
-- TABLES POUR DASHBOARD FONCTIONNEL
-- ============================================

-- 1. SESSIONS ACTIVES
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TEAM INVITES
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- en cents
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed')),
  stripe_invoice_id TEXT,
  pdf_url TEXT,
  plan_name TEXT,
  billing_period TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENT METHODS
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'paypal', 'sepa')),
  stripe_payment_method_id TEXT UNIQUE,
  last4 TEXT,
  brand TEXT, -- 'visa', 'mastercard', etc.
  expiry_month TEXT,
  expiry_year TEXT,
  email TEXT, -- pour PayPal
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. USER TEMPLATES (Library)
CREATE TABLE IF NOT EXISTS user_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  thumbnail_url TEXT,
  template_data JSONB NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TEMPLATE FAVORITES
CREATE TABLE IF NOT EXISTS template_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES user_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

-- 7. TOTP SECRETS (2FA)
CREATE TABLE IF NOT EXISTS totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_team_invites_email ON team_invites(email);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_user_templates_user ON user_templates(user_id);
CREATE INDEX idx_template_favorites_user ON template_favorites(user_id);

-- RLS Policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE totp_secrets ENABLE ROW LEVEL SECURITY;

-- Users can view own data
CREATE POLICY "Users view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own invites" ON team_invites FOR SELECT USING (auth.uid() = invited_by OR auth.uid() = organization_id);
CREATE POLICY "Users view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own payment methods" ON payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own templates" ON user_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own favorites" ON template_favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own 2FA" ON totp_secrets FOR SELECT USING (auth.uid() = user_id);
```

---

## 🎯 **PHASE 2: CRÉER API ROUTES (1h)**

### **Structure:**
```
apps/frontend/src/app/api/
├── settings/
│   ├── profile/route.ts
│   ├── password/route.ts
│   ├── 2fa/route.ts
│   └── sessions/route.ts
├── team/
│   ├── members/route.ts
│   ├── invite/route.ts
│   └── remove/route.ts
├── billing/
│   ├── invoices/route.ts
│   └── payment-methods/route.ts
├── orders/
│   ├── list/route.ts
│   └── update/route.ts
├── integrations/
│   ├── connect/route.ts
│   ├── api-keys/route.ts
│   └── webhooks/route.ts
├── library/
│   ├── templates/route.ts
│   └── favorites/route.ts
└── ar-studio/
    ├── models/route.ts
    └── upload/route.ts
```

---

## 🎯 **PHASE 3: CONNECTER CHAQUE PAGE (1.5-2h)**

### **3.1 Settings Page**
```typescript
// Remplacer:
const handleSave = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  toast({ title: "Sauvegardé" });
};

// Par:
const handleSave = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ name, email, company })
    .eq('id', user.id);
    
  if (error) throw error;
  toast({ title: "Sauvegardé" });
};
```

### **3.2 Team Page**
```typescript
// Vraie invitation:
const handleInvite = async () => {
  const { data, error } = await supabase
    .from('team_invites')
    .insert({ 
      email: inviteEmail, 
      role: inviteRole,
      invited_by: user.id,
      organization_id: user.id,
      token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 7*24*60*60*1000)
    });
    
  // Envoyer email via API route
  await fetch('/api/team/invite', {
    method: 'POST',
    body: JSON.stringify({ email: inviteEmail, token: data.token })
  });
};
```

### **3.3 Billing Page**
```typescript
// Fetch vraies factures:
const { data: invoices } = await supabase
  .from('invoices')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

### **3.4 Orders Page**
```typescript
// Fetch vraies commandes:
const { data: orders } = await supabase
  .from('orders')
  .select('*, order_items(*)')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

### **3.5 Library Page**
```typescript
// CRUD templates:
const { data: templates } = await supabase
  .from('user_templates')
  .select('*, template_favorites(*)')
  .eq('user_id', user.id);
```

### **3.6 Integrations Page**
```typescript
// Fetch intégrations:
const { data: integrations } = await supabase
  .from('integrations')
  .select('*')
  .eq('user_id', user.id);
  
// API keys:
const { data: apiKeys } = await supabase
  .from('api_keys')
  .select('*')
  .eq('user_id', user.id);
```

### **3.7 AR Studio Page**
```typescript
// Upload modèle 3D:
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('ar-models')
  .upload(`${user.id}/${file.name}`, file);
  
// Créer record:
const { data, error } = await supabase
  .from('ar_models')
  .insert({
    user_id: user.id,
    name: modelName,
    file_url: uploadData.path,
    type: modelType
  });
```

---

## 🎯 **PHASE 4: TESTER (30min)**

### **Tests par page:**
1. ✅ Settings: Save profile, change password, enable 2FA
2. ✅ Team: Invite member, change role, remove member
3. ✅ Billing: View invoices, add payment method
4. ✅ Orders: View orders, update status
5. ✅ Library: Create template, toggle favorite, delete
6. ✅ Integrations: Connect integration, create API key
7. ✅ AR Studio: Upload model, delete model
8. ✅ Analytics: (read-only, fetch data)
9. ✅ Plans: (redirect to checkout)

---

## ⏱️ **TIMELINE**

```
Phase 1: Tables SQL          [30min] ░░░░░░░░░░
Phase 2: API Routes          [60min] ░░░░░░░░░░░░░░░░░░░░
Phase 3: Connecter pages     [90min] ░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Phase 4: Tests               [30min] ░░░░░░░░░░

TOTAL: 3h30min
```

---

## 🚀 **ON COMMENCE MAINTENANT !**

**Ordre d'exécution:**
1. ✅ Créer script SQL tables
2. ✅ Exécuter dans Supabase
3. ✅ Créer API routes essentielles
4. ✅ Connecter Settings page (plus simple)
5. ✅ Connecter Team page
6. ✅ Connecter autres pages
7. ✅ Tester tout

**JE COMMENCE PAR LE SCRIPT SQL !**

