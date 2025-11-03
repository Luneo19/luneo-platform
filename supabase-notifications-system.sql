-- ═══════════════════════════════════════════════════════════════
-- 🔔 LUNEO PLATFORM - NOTIFICATIONS SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- Description: Système de notifications in-app temps réel
-- Created: 2025-10-25
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- 1. TABLE: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de notification
  type TEXT NOT NULL CHECK (type IN (
    'order_created', 'order_shipped', 'order_delivered',
    'design_generated', 'design_liked', 'design_downloaded',
    'payment_succeeded', 'payment_failed', 'subscription_renewed',
    'team_invite', 'team_member_joined',
    'integration_connected', 'integration_error',
    'system_alert', 'feature_announcement'
  )),
  
  -- Contenu
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Ressource liée (optionnel)
  resource_type TEXT, -- 'order', 'design', 'product', 'integration'
  resource_id UUID,
  
  -- Action à effectuer (optionnel)
  action_url TEXT, -- URL vers laquelle rediriger
  action_label TEXT, -- Label du bouton d'action
  
  -- Statut
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Priorité
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);

-- Index composite pour boîte de réception
CREATE INDEX IF NOT EXISTS idx_notifications_inbox 
  ON public.notifications(user_id, is_read, created_at DESC) 
  WHERE is_archived = false;

-- Index pour notifications non lues
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON public.notifications(user_id, created_at DESC) 
  WHERE is_read = false AND is_archived = false;

-- ============================================
-- 2. TABLE: notification_preferences
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Préférences par canal
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  
  -- Préférences par type
  preferences JSONB DEFAULT '{
    "order_created": {"email": true, "in_app": true, "push": false},
    "order_shipped": {"email": true, "in_app": true, "push": true},
    "design_generated": {"email": false, "in_app": true, "push": false},
    "payment_succeeded": {"email": true, "in_app": true, "push": false},
    "team_invite": {"email": true, "in_app": true, "push": true},
    "system_alert": {"email": true, "in_app": true, "push": true}
  }'::jsonb,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON public.notification_preferences(user_id);

-- ============================================
-- 3. RLS (ROW LEVEL SECURITY)
-- ============================================

-- Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies pour notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service can insert notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true); -- API routes utilisent service role

-- Policies pour notification_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own preferences" 
  ON public.notification_preferences FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own preferences" 
  ON public.notification_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own preferences" 
  ON public.notification_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. TRIGGER: create_default_preferences
-- ============================================

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer les préférences par défaut pour le nouveau user
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users (exécuté à la création d'un compte)
DROP TRIGGER IF EXISTS create_notification_prefs_on_signup ON auth.users;
CREATE TRIGGER create_notification_prefs_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================
-- 5. TRIGGER: cleanup_old_notifications
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Supprimer les notifications lues de plus de 90 jours
  DELETE FROM public.notifications
  WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '90 days';
  
  -- Archiver automatiquement les notifications de plus de 30 jours
  UPDATE public.notifications
  SET is_archived = true
  WHERE is_read = true 
    AND is_archived = false
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FONCTIONS HELPER
-- ============================================

-- Marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id 
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compter les notifications non lues
CREATE OR REPLACE FUNCTION count_unread_notifications(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM public.notifications
  WHERE user_id = p_user_id 
    AND is_read = false 
    AND is_archived = false;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- ✅ NOTIFICATIONS SYSTEM CRÉÉ AVEC SUCCÈS !
-- ═══════════════════════════════════════════════════════════════
-- 
-- Tables créées :
--   - notifications (notifications in-app)
--   - notification_preferences (préférences utilisateur)
-- 
-- Types de notifications :
--   - Orders (created, shipped, delivered)
--   - Designs (generated, liked, downloaded)
--   - Payments (succeeded, failed, renewed)
--   - Team (invite, member joined)
--   - Integrations (connected, error)
--   - System (alerts, announcements)
-- 
-- Features :
--   - Temps réel (Supabase Realtime)
--   - Priorités (low, normal, high, urgent)
--   - Actions cliquables
--   - Préférences personnalisables
--   - Auto-cleanup (90 jours)
--   - Quiet hours
-- 
-- Next steps :
--   1. Créer API routes /api/notifications
--   2. Créer composant NotificationBell
--   3. Intégrer Supabase Realtime
-- 
-- ═══════════════════════════════════════════════════════════════

