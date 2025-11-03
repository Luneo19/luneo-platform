-- ═══════════════════════════════════════════════════════════════
-- 🔧 LUNEO PLATFORM - SCRIPT SQL COMPLET
-- ═══════════════════════════════════════════════════════════════
-- Description: Supprime et recrée TOUTES les tables manquantes
-- Ordre: 2FA → AR Models → Integrations → Notifications → Performance
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- NETTOYAGE: Supprimer les anciennes tables
-- ============================================

DROP TABLE IF EXISTS public.sync_logs CASCADE;
DROP TABLE IF EXISTS public.integrations CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.ar_interactions CASCADE;
DROP TABLE IF EXISTS public.ar_models CASCADE;
DROP TABLE IF EXISTS public.totp_attempts CASCADE;
DROP TABLE IF EXISTS public.totp_secrets CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 1: 2FA SYSTEM
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  backup_codes TEXT[],
  is_enabled BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_totp_secrets_user_id ON public.totp_secrets(user_id);
CREATE INDEX idx_totp_secrets_enabled ON public.totp_secrets(is_enabled);

CREATE TABLE public.totp_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_totp_attempts_user_id ON public.totp_attempts(user_id);
CREATE INDEX idx_totp_attempts_created_at ON public.totp_attempts(created_at);

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 2: AR MODELS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.ar_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  model_url TEXT NOT NULL,
  usdz_url TEXT,
  thumbnail_url TEXT,
  format TEXT NOT NULL DEFAULT 'glb',
  file_size BIGINT,
  dimensions JSONB DEFAULT '{"width":1.0,"height":1.0,"depth":1.0,"unit":"meters"}'::jsonb,
  mesh_info JSONB DEFAULT '{"vertices":0,"faces":0,"materials":0}'::jsonb,
  ar_config JSONB DEFAULT'{"scale":1.0,"rotation":{"x":0,"y":0,"z":0},"position":{"x":0,"y":0,"z":0},"allow_scaling":true,"allow_rotation":true,"placement_mode":"horizontal"}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[],
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  is_public BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  ar_launches_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ
);

CREATE INDEX idx_ar_models_user_id ON public.ar_models(user_id);
CREATE INDEX idx_ar_models_design_id ON public.ar_models(design_id);
CREATE INDEX idx_ar_models_status ON public.ar_models(status);
CREATE INDEX idx_ar_models_is_public ON public.ar_models(is_public);
CREATE INDEX idx_ar_models_created_at ON public.ar_models(created_at DESC);
CREATE INDEX idx_ar_models_tags ON public.ar_models USING GIN(tags);

CREATE TABLE public.ar_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ar_model_id UUID NOT NULL REFERENCES public.ar_models(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'ar_launch', 'download', 'share')),
  session_duration INTEGER,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ar_interactions_model_id ON public.ar_interactions(ar_model_id);
CREATE INDEX idx_ar_interactions_user_id ON public.ar_interactions(user_id);
CREATE INDEX idx_ar_interactions_type ON public.ar_interactions(interaction_type);
CREATE INDEX idx_ar_interactions_created_at ON public.ar_interactions(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 3: INTEGRATIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce', 'etsy', 'amazon', 'bigcommerce', 'custom')),
  platform_name TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  oauth_expires_at TIMESTAMPTZ,
  oauth_scope TEXT[],
  store_url TEXT,
  store_name TEXT,
  store_currency TEXT DEFAULT 'EUR',
  sync_config JSONB DEFAULT '{"auto_sync":true,"sync_interval":"1h","sync_products":true,"sync_orders":false,"sync_inventory":true,"sync_direction":"bidirectional"}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed', 'pending') OR last_sync_status IS NULL),
  last_sync_error TEXT,
  products_synced INTEGER DEFAULT 0,
  orders_synced INTEGER DEFAULT 0,
  total_syncs INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  UNIQUE(user_id, platform, store_url)
);

CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX idx_integrations_platform ON public.integrations(platform);
CREATE INDEX idx_integrations_status ON public.integrations(status);
CREATE INDEX idx_integrations_is_active ON public.integrations(is_active);
CREATE INDEX idx_integrations_last_sync ON public.integrations(last_sync_at DESC);

CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'automatic', 'webhook')),
  direction TEXT NOT NULL CHECK (direction IN ('import', 'export', 'bidirectional')),
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'success', 'partial', 'failed')),
  items_total INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  items_succeeded INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  summary JSONB,
  errors JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_integration_id ON public.sync_logs(integration_id);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(status);
CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 4: NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order_created','order_shipped','order_delivered','design_generated','design_liked','design_downloaded','payment_succeeded','payment_failed','subscription_renewed','team_invite','team_member_joined','integration_connected','integration_error','system_alert','feature_announcement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  action_url TEXT,
  action_label TEXT,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_priority ON public.notifications(priority);
CREATE INDEX idx_notifications_inbox ON public.notifications(user_id, is_read, created_at DESC) WHERE is_archived = false;
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, created_at DESC) WHERE is_read = false AND is_archived = false;

CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{"order_created":{"email":true,"in_app":true,"push":false},"order_shipped":{"email":true,"in_app":true,"push":true},"design_generated":{"email":false,"in_app":true,"push":false},"payment_succeeded":{"email":true,"in_app":true,"push":false},"team_invite":{"email":true,"in_app":true,"push":true},"system_alert":{"email":true,"in_app":true,"push":true}}'::jsonb,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_notification_prefs_user_id ON public.notification_preferences(user_id);

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 5: RLS (ROW LEVEL SECURITY)
-- ═══════════════════════════════════════════════════════════════

-- 2FA
ALTER TABLE public.totp_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.totp_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own TOTP secret" ON public.totp_secrets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own TOTP secret" ON public.totp_secrets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own TOTP secret" ON public.totp_secrets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own TOTP secret" ON public.totp_secrets FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own TOTP attempts" ON public.totp_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert TOTP attempts" ON public.totp_attempts FOR INSERT WITH CHECK (true);

-- AR Models
ALTER TABLE public.ar_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AR models" ON public.ar_models FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can insert own AR models" ON public.ar_models FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AR models" ON public.ar_models FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own AR models" ON public.ar_models FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert AR interactions" ON public.ar_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own interactions" ON public.ar_interactions FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.ar_models WHERE ar_models.id = ar_interactions.ar_model_id AND ar_models.user_id = auth.uid()));

-- Integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations" ON public.integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own integrations" ON public.integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integrations" ON public.integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own integrations" ON public.integrations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own sync logs" ON public.sync_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.integrations WHERE integrations.id = sync_logs.integration_id AND integrations.user_id = auth.uid()));
CREATE POLICY "Service can insert sync logs" ON public.sync_logs FOR INSERT WITH CHECK (true);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 6: TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Fonction update_updated_at_column (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_totp_secrets_updated_at BEFORE UPDATE ON public.totp_secrets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ar_models_updated_at BEFORE UPDATE ON public.ar_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger AR counters
CREATE OR REPLACE FUNCTION increment_ar_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.interaction_type = 'view' THEN
    UPDATE public.ar_models SET views_count = views_count + 1, last_viewed_at = NOW() WHERE id = NEW.ar_model_id;
  ELSIF NEW.interaction_type = 'ar_launch' THEN
    UPDATE public.ar_models SET ar_launches_count = ar_launches_count + 1 WHERE id = NEW.ar_model_id;
  ELSIF NEW.interaction_type = 'download' THEN
    UPDATE public.ar_models SET downloads_count = downloads_count + 1 WHERE id = NEW.ar_model_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER increment_ar_counters AFTER INSERT ON public.ar_interactions FOR EACH ROW EXECUTE FUNCTION increment_ar_counter();

-- Trigger sync duration
CREATE OR REPLACE FUNCTION calculate_sync_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_sync_duration_trigger BEFORE UPDATE ON public.sync_logs FOR EACH ROW WHEN (NEW.completed_at IS NOT NULL) EXECUTE FUNCTION calculate_sync_duration();

-- Trigger integration stats
CREATE OR REPLACE FUNCTION update_integration_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.integrations
  SET 
    last_sync_at = NEW.completed_at,
    last_sync_status = NEW.status,
    total_syncs = total_syncs + 1,
    products_synced = products_synced + NEW.items_succeeded,
    last_sync_error = CASE WHEN NEW.status = 'failed' THEN NEW.errors::text ELSE NULL END
  WHERE id = NEW.integration_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_integration_stats_trigger AFTER UPDATE ON public.sync_logs FOR EACH ROW WHEN (NEW.completed_at IS NOT NULL) EXECUTE FUNCTION update_integration_stats();

-- Trigger notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_notification_prefs_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 7: FONCTIONS HELPER
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION cleanup_old_totp_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.totp_attempts WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_recent_failed_attempts(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE failed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO failed_count FROM public.totp_attempts WHERE user_id = p_user_id AND success = false AND created_at > NOW() - INTERVAL '15 minutes';
  RETURN failed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications WHERE is_read = true AND created_at < NOW() - INTERVAL '90 days';
  UPDATE public.notifications SET is_archived = true WHERE is_read = true AND is_archived = false AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications SET is_read = true, read_at = NOW() WHERE user_id = p_user_id AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION count_unread_notifications(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count FROM public.notifications WHERE user_id = p_user_id AND is_read = false AND is_archived = false;
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- PARTIE 8: AJOUTER COLONNE requires_2fa À profiles
-- ═══════════════════════════════════════════════════════════════

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'requires_2fa') THEN
    ALTER TABLE public.profiles ADD COLUMN requires_2fa BOOLEAN DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_requires_2fa ON public.profiles(requires_2fa);

-- ═══════════════════════════════════════════════════════════════
-- ✅ SCRIPT COMPLET EXÉCUTÉ AVEC SUCCÈS !
-- ═══════════════════════════════════════════════════════════════
-- 
-- Tables créées :
--   ✅ totp_secrets + totp_attempts (2FA)
--   ✅ ar_models + ar_interactions (AR Studio)
--   ✅ integrations + sync_logs (Shopify/WooCommerce)
--   ✅ notifications + notification_preferences
-- 
-- Prochaine étape :
--   Exécuter supabase-performance-indexes.sql (50+ indexes)
-- 
-- ═══════════════════════════════════════════════════════════════

