-- ═══════════════════════════════════════════════════════════════
-- 🔔 LUNEO PLATFORM - OUTGOING WEBHOOKS SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- Description: Webhooks sortants pour notifier les clients
-- Author: AI Expert
-- Date: 2025-10-25
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- TABLE: webhook_endpoints
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL, -- URL du webhook client
  secret TEXT NOT NULL, -- Secret pour signer les requêtes (HMAC)
  is_active BOOLEAN DEFAULT true,
  events TEXT[] NOT NULL DEFAULT '{}', -- Events auxquels le webhook est abonné
  last_triggered_at TIMESTAMPTZ,
  last_status TEXT, -- success, failed
  last_error TEXT,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_url CHECK (url ~* '^https?://.*')
);

-- Index
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user_id ON public.webhook_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON public.webhook_endpoints(is_active) WHERE is_active = true;

-- ============================================
-- TABLE: webhook_deliveries
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- design.created, order.completed, etc.
  payload JSONB NOT NULL,
  signature TEXT NOT NULL, -- HMAC signature du payload
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON public.webhook_deliveries(webhook_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON public.webhook_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON public.webhook_deliveries(next_retry_at) WHERE status = 'retrying';

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Policies pour webhook_endpoints
DROP POLICY IF EXISTS "Users can view own webhooks" ON public.webhook_endpoints;
CREATE POLICY "Users can view own webhooks" 
  ON public.webhook_endpoints FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own webhooks" ON public.webhook_endpoints;
CREATE POLICY "Users can create own webhooks" 
  ON public.webhook_endpoints FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own webhooks" ON public.webhook_endpoints;
CREATE POLICY "Users can update own webhooks" 
  ON public.webhook_endpoints FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own webhooks" ON public.webhook_endpoints;
CREATE POLICY "Users can delete own webhooks" 
  ON public.webhook_endpoints FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies pour webhook_deliveries
DROP POLICY IF EXISTS "Users can view deliveries of own webhooks" ON public.webhook_deliveries;
CREATE POLICY "Users can view deliveries of own webhooks" 
  ON public.webhook_deliveries FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.webhook_endpoints 
      WHERE webhook_endpoints.id = webhook_deliveries.webhook_endpoint_id 
      AND webhook_endpoints.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can insert deliveries" ON public.webhook_deliveries;
CREATE POLICY "Service can insert deliveries" 
  ON public.webhook_deliveries FOR INSERT 
  WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_webhook_endpoints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_webhooks_updated_at ON public.webhook_endpoints;
CREATE TRIGGER trigger_update_webhooks_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_endpoints_updated_at();

-- Trigger pour mettre à jour les stats du webhook après delivery
CREATE OR REPLACE FUNCTION update_webhook_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE public.webhook_endpoints
    SET 
      success_count = success_count + 1,
      last_triggered_at = NEW.delivered_at,
      last_status = 'success',
      last_error = NULL
    WHERE id = NEW.webhook_endpoint_id;
  ELSIF NEW.status = 'failed' AND NEW.attempts >= NEW.max_attempts THEN
    UPDATE public.webhook_endpoints
    SET 
      failure_count = failure_count + 1,
      last_triggered_at = NOW(),
      last_status = 'failed',
      last_error = NEW.error_message
    WHERE id = NEW.webhook_endpoint_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_webhook_stats ON public.webhook_deliveries;
CREATE TRIGGER trigger_update_webhook_stats
  AFTER UPDATE ON public.webhook_deliveries
  FOR EACH ROW
  WHEN (NEW.status IN ('success', 'failed'))
  EXECUTE FUNCTION update_webhook_stats();

-- ============================================
-- FUNCTIONS HELPER
-- ============================================

-- Créer une delivery webhook
CREATE OR REPLACE FUNCTION create_webhook_delivery(
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS void AS $$
DECLARE
  webhook_rec RECORD;
  signature TEXT;
BEGIN
  -- Parcourir tous les webhooks actifs abonnés à cet event
  FOR webhook_rec IN 
    SELECT * FROM public.webhook_endpoints 
    WHERE is_active = true 
    AND p_event_type = ANY(events)
  LOOP
    -- Générer la signature HMAC
    signature := encode(
      hmac(p_payload::text, webhook_rec.secret, 'sha256'),
      'hex'
    );

    -- Créer la delivery
    INSERT INTO public.webhook_deliveries (
      webhook_endpoint_id,
      event_type,
      payload,
      signature,
      status,
      next_retry_at
    ) VALUES (
      webhook_rec.id,
      p_event_type,
      p_payload,
      signature,
      'pending',
      NOW() + INTERVAL '1 minute'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nettoyer les anciennes deliveries
CREATE OR REPLACE FUNCTION cleanup_old_webhook_deliveries()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webhook_deliveries 
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND status IN ('success', 'failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- ✅ SCRIPT TERMINÉ
-- ═══════════════════════════════════════════════════════════════
-- 
-- Tables créées :
--   ✅ webhook_endpoints (endpoints clients)
--   ✅ webhook_deliveries (historique des envois)
-- 
-- Fonctionnalités :
--   ✅ Signature HMAC pour sécurité
--   ✅ Retry automatique (max 3 tentatives)
--   ✅ Analytics par webhook
--   ✅ Events configurables
--   ✅ RLS complet
-- 
-- Events supportés :
--   - design.created
--   - design.completed
--   - order.created
--   - order.completed
--   - order.shipped
--   - payment.succeeded
--   - subscription.renewed
-- 
-- ═══════════════════════════════════════════════════════════════

