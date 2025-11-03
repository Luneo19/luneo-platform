-- ============================================
-- 🔥 TABLES DASHBOARD - BACKEND FONCTIONNEL
-- ============================================
-- Date: 3 Novembre 2025
-- Pour: Connexion complète des 9 pages dashboard
-- ============================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USER SESSIONS (Settings Page)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON public.user_sessions(last_activity);

-- ============================================
-- 2. TOTP SECRETS (2FA - Settings Page)
-- ============================================

CREATE TABLE IF NOT EXISTS public.totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[],
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_totp_user ON public.totp_secrets(user_id);

-- ============================================
-- 3. TEAM INVITES (Team Page)
-- ============================================

CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invites_email ON public.team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_org ON public.team_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON public.team_invites(token);

-- ============================================
-- 4. TEAM MEMBERS (Team Page)
-- ============================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_org ON public.team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

-- ============================================
-- 5. INVOICES (Billing Page)
-- ============================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- en cents
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
  stripe_invoice_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  pdf_url TEXT,
  hosted_invoice_url TEXT,
  plan_name TEXT,
  billing_period TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(created_at DESC);

-- ============================================
-- 6. PAYMENT METHODS (Billing Page)
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'paypal', 'sepa')),
  stripe_payment_method_id TEXT UNIQUE,
  last4 TEXT,
  brand TEXT, -- 'visa', 'mastercard', 'amex'
  expiry_month TEXT,
  expiry_year TEXT,
  email TEXT, -- pour PayPal
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON public.payment_methods(user_id);

-- ============================================
-- 7. USER TEMPLATES (Library Page)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  thumbnail_url TEXT,
  template_data JSONB NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_templates_user ON public.user_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_category ON public.user_templates(category);
CREATE INDEX IF NOT EXISTS idx_user_templates_tags ON public.user_templates USING GIN(tags);

-- ============================================
-- 8. TEMPLATE FAVORITES (Library Page)
-- ============================================

CREATE TABLE IF NOT EXISTS public.template_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.user_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_template_favorites_user ON public.template_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_template ON public.template_favorites(template_id);

-- ============================================
-- 9. VERIFY EXISTING TABLES
-- ============================================

-- Vérifier que ces tables existent déjà:
-- - profiles (users)
-- - designs (user designs)
-- - orders (existe déjà)
-- - products (existe déjà)
-- - ar_models (existe déjà)
-- - integrations (existe déjà)
-- - api_keys (existe déjà)
-- - webhook_endpoints (existe déjà)

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.totp_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_favorites ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view own data
DROP POLICY IF EXISTS "Users view own sessions" ON public.user_sessions;
CREATE POLICY "Users view own sessions" ON public.user_sessions 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own sessions" ON public.user_sessions;
CREATE POLICY "Users manage own sessions" ON public.user_sessions 
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own 2FA" ON public.totp_secrets;
CREATE POLICY "Users view own 2FA" ON public.totp_secrets 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own 2FA" ON public.totp_secrets;
CREATE POLICY "Users manage own 2FA" ON public.totp_secrets 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view team invites" ON public.team_invites;
CREATE POLICY "Users view team invites" ON public.team_invites 
  FOR SELECT USING (auth.uid() = invited_by OR auth.uid() = organization_id);

DROP POLICY IF EXISTS "Users manage team invites" ON public.team_invites;
CREATE POLICY "Users manage team invites" ON public.team_invites 
  FOR ALL USING (auth.uid() = invited_by OR auth.uid() = organization_id);

DROP POLICY IF EXISTS "Users view team members" ON public.team_members;
CREATE POLICY "Users view team members" ON public.team_members 
  FOR SELECT USING (auth.uid() = organization_id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners manage team members" ON public.team_members;
CREATE POLICY "Owners manage team members" ON public.team_members 
  FOR ALL USING (auth.uid() = organization_id);

DROP POLICY IF EXISTS "Users view own invoices" ON public.invoices;
CREATE POLICY "Users view own invoices" ON public.invoices 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own payment methods" ON public.payment_methods;
CREATE POLICY "Users view own payment methods" ON public.payment_methods 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own payment methods" ON public.payment_methods;
CREATE POLICY "Users manage own payment methods" ON public.payment_methods 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own templates" ON public.user_templates;
CREATE POLICY "Users view own templates" ON public.user_templates 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own templates" ON public.user_templates;
CREATE POLICY "Users manage own templates" ON public.user_templates 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own favorites" ON public.template_favorites;
CREATE POLICY "Users manage own favorites" ON public.template_favorites 
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_templates_updated_at ON public.user_templates;
CREATE TRIGGER update_user_templates_updated_at
  BEFORE UPDATE ON public.user_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS UTILES
-- ============================================

-- Function: Générer invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT := TO_CHAR(NOW(), 'YYYY');
  seq TEXT := LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
BEGIN
  RETURN 'INV-' || year || '-' || seq;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- ============================================
-- 🎉 SCRIPT PRÊT !
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Copier tout ce script
-- 2. Aller dans Supabase SQL Editor
-- 3. Coller et exécuter
-- 4. Vérifier que toutes les tables sont créées
-- 
-- ============================================

