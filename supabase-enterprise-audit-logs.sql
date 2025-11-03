-- ============================================
-- ENTERPRISE AUDIT LOGS SYSTEM
-- Traçabilité complète pour RGPD & Enterprise
-- ============================================

-- 1. TABLE AUDIT_LOGS
-- Log toutes les actions critiques dans la plateforme
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Qui
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  
  -- Quoi
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'logout', 'export', etc.
  resource_type TEXT NOT NULL, -- 'order', 'design', 'product', 'user', 'api_key', etc.
  resource_id TEXT, -- ID de la ressource concernée
  resource_name TEXT, -- Nom de la ressource pour lisibilité
  
  -- Détails
  description TEXT, -- Description human-readable
  changes JSONB, -- {before: {...}, after: {...}} pour les updates
  metadata JSONB, -- Données additionnelles (IP, user_agent, etc.)
  
  -- Contexte
  ip_address INET,
  user_agent TEXT,
  request_method TEXT, -- GET, POST, PUT, DELETE
  request_path TEXT, -- /api/orders/123
  
  -- Statut
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'warning')),
  error_message TEXT, -- Si échec
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Rétention (pour RGPD - supprimer après X mois)
  retention_until TIMESTAMPTZ, -- Calculé automatiquement
  
  -- Sensibilité
  sensitivity TEXT DEFAULT 'normal' CHECK (sensitivity IN ('low', 'normal', 'high', 'critical'))
);

-- 2. INDEXES POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_sensitivity ON audit_logs(sensitivity);

-- Index composite pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_resource ON audit_logs(user_id, resource_type, created_at DESC);

-- 3. RLS POLICIES
-- ============================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Supprimer policies existantes
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role can manage all audit logs" ON audit_logs;

-- Users peuvent voir leurs propres logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins peuvent voir tous les logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role peut tout
CREATE POLICY "Service role can manage all audit logs" ON audit_logs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 4. FUNCTIONS UTILITAIRES
-- ============================================

-- Fonction pour logger une action
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_sensitivity TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  user_info RECORD;
BEGIN
  -- Récupérer infos utilisateur
  SELECT email, name, role INTO user_info
  FROM profiles
  WHERE id = p_user_id;
  
  -- Insérer le log
  INSERT INTO audit_logs (
    user_id,
    user_email,
    user_name,
    user_role,
    action,
    resource_type,
    resource_id,
    description,
    changes,
    metadata,
    status,
    sensitivity,
    retention_until
  ) VALUES (
    p_user_id,
    user_info.email,
    user_info.name,
    user_info.role,
    p_action,
    p_resource_type,
    p_resource_id,
    p_description,
    p_changes,
    p_metadata,
    p_status,
    p_sensitivity,
    NOW() + INTERVAL '7 years' -- RGPD : conservation 7 ans max
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les vieux logs (RGPD)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE retention_until < NOW()
  AND sensitivity IN ('low', 'normal');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGERS AUTOMATIQUES
-- Pour logger automatiquement certaines actions critiques
-- ============================================

-- Logger les changements sur les commandes
CREATE OR REPLACE FUNCTION log_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update
  IF TG_OP = 'UPDATE' THEN
    PERFORM log_audit(
      NEW.user_id,
      'update',
      'order',
      NEW.id::TEXT,
      'Commande ' || NEW.order_number || ' mise à jour',
      jsonb_build_object(
        'before', to_jsonb(OLD),
        'after', to_jsonb(NEW)
      ),
      jsonb_build_object('trigger', 'automatic'),
      'success',
      'high'
    );
  -- Create
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_audit(
      NEW.user_id,
      'create',
      'order',
      NEW.id::TEXT,
      'Commande ' || NEW.order_number || ' créée',
      jsonb_build_object('data', to_jsonb(NEW)),
      jsonb_build_object('trigger', 'automatic'),
      'success',
      'high'
    );
  -- Delete
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit(
      OLD.user_id,
      'delete',
      'order',
      OLD.id::TEXT,
      'Commande ' || OLD.order_number || ' supprimée',
      jsonb_build_object('data', to_jsonb(OLD)),
      jsonb_build_object('trigger', 'automatic'),
      'success',
      'critical'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_order_changes ON orders;
CREATE TRIGGER audit_order_changes
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_changes();

-- Logger les changements sur les designs
CREATE OR REPLACE FUNCTION log_design_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit(
      NEW.user_id,
      'create',
      'design',
      NEW.id::TEXT,
      'Design créé: ' || COALESCE(NEW.prompt, 'Sans titre'),
      jsonb_build_object('data', to_jsonb(NEW)),
      jsonb_build_object('trigger', 'automatic'),
      'success',
      'normal'
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit(
      OLD.user_id,
      'delete',
      'design',
      OLD.id::TEXT,
      'Design supprimé',
      jsonb_build_object('data', to_jsonb(OLD)),
      jsonb_build_object('trigger', 'automatic'),
      'success',
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_design_changes ON designs;
CREATE TRIGGER audit_design_changes
  AFTER INSERT OR DELETE ON designs
  FOR EACH ROW
  EXECUTE FUNCTION log_design_changes();

-- 6. VUES UTILES
-- ============================================

-- Vue pour les logs récents par utilisateur
CREATE OR REPLACE VIEW user_recent_activity AS
SELECT 
  al.*,
  p.avatar_url,
  p.company
FROM audit_logs al
LEFT JOIN profiles p ON p.id = al.user_id
WHERE al.created_at > NOW() - INTERVAL '30 days'
ORDER BY al.created_at DESC;

-- Vue pour les actions critiques
CREATE OR REPLACE VIEW critical_audit_events AS
SELECT *
FROM audit_logs
WHERE sensitivity IN ('high', 'critical')
OR status = 'failure'
ORDER BY created_at DESC;

-- Vue pour statistiques audit
CREATE OR REPLACE VIEW audit_stats AS
SELECT 
  user_id,
  user_email,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN action = 'login' THEN 1 END) as login_count,
  COUNT(CASE WHEN action = 'create' THEN 1 END) as create_count,
  COUNT(CASE WHEN action = 'update' THEN 1 END) as update_count,
  COUNT(CASE WHEN action = 'delete' THEN 1 END) as delete_count,
  COUNT(CASE WHEN status = 'failure' THEN 1 END) as failure_count,
  MAX(created_at) as last_activity
FROM audit_logs
GROUP BY user_id, user_email;

-- 7. SCHEDULED JOB (via pg_cron si disponible)
-- ============================================

-- Nettoyer les vieux logs tous les jours à 2h du matin
-- À configurer manuellement dans Supabase Dashboard > Database > Extensions > pg_cron

/*
SELECT cron.schedule(
  'cleanup-old-audit-logs',
  '0 2 * * *', -- Tous les jours à 2h
  $$SELECT cleanup_old_audit_logs();$$
);
*/

-- 8. ACTIONS À LOGGER (EXEMPLES)
-- ============================================

-- Login/Logout
-- CREATE, READ, UPDATE, DELETE pour:
--   - orders
--   - designs
--   - products
--   - users
--   - api_keys
--   - integrations
-- Export de données (RGPD)
-- Changement de permissions
-- Changement de plan
-- Accès à des données sensibles

-- ============================================
-- EXÉCUTION COMPLÈTE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ AUDIT LOGS SYSTEM CRÉÉ !';
  RAISE NOTICE '📊 Table: audit_logs';
  RAISE NOTICE '🔒 RLS Policies activées';
  RAISE NOTICE '⚡ Triggers automatiques configurés';
  RAISE NOTICE '📈 Vues analytics créées';
  RAISE NOTICE '🎯 Prêt pour compliance RGPD & Enterprise';
END $$;

