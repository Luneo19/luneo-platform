# 🎯 SOLUTION COMPLÈTE - PLAN D'IMPLÉMENTATION TECHNIQUE

**Date** : 25 Octobre 2025  
**Status** : ✅ **PRÊT POUR IMPLÉMENTATION**  
**Approche** : Phase par phase, testable à chaque étape

---

## 📋 **TABLE DES MATIÈRES**

1. [Phase 1 : Infrastructure Backend](#phase-1)
2. [Phase 2 : Connexion Pages Dashboard](#phase-2)
3. [Phase 3 : Features Avancées](#phase-3)
4. [Phase 4 : Features Complexes](#phase-4)
5. [Phase 5 : API Publique](#phase-5)
6. [Scripts d'Automatisation](#scripts)
7. [Tests & Validation](#tests)

---

<a name="phase-1"></a>
## 🏗️ **PHASE 1 : INFRASTRUCTURE BACKEND**

**Durée estimée** : 2-3 jours  
**Priorité** : 🔴 CRITIQUE

### **Objectif**

Créer toute l'infrastructure backend nécessaire :
- Tables Supabase
- API Routes
- Hooks React

---

### **1.1 Tables Supabase à Créer**

#### **Fichier SQL Complet** : `create-all-missing-tables.sql`

```sql
-- ============================================
-- LUNEO PLATFORM - TABLES MANQUANTES
-- Création de toutes les tables nécessaires
-- ============================================

-- 1. TABLE: team_members
-- Gestion des équipes et membres
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'designer', 'manager', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_team_members_org ON team_members(organization_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);

-- 2. TABLE: integrations
-- Services externes connectés
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('slack', 'google_drive', 'figma', 'hubspot', 'google_analytics', 'stripe')),
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMP WITH TIME ZONE,
  config JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_sync TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service)
);

CREATE INDEX idx_integrations_user ON integrations(user_id);
CREATE INDEX idx_integrations_status ON integrations(status);

-- 3. TABLE: api_keys
-- Clés API pour accès programmatique
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash
  key_prefix TEXT NOT NULL, -- Pour affichage (ex: "luneo_••••")
  permissions JSONB DEFAULT '["read"]'::jsonb,
  rate_limit INTEGER DEFAULT 1000, -- Requêtes par heure
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;

-- 4. TABLE: webhooks
-- Configuration des webhooks sortants
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- Pour signature HMAC
  events TEXT[] NOT NULL, -- ['design.created', 'order.completed', etc.]
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user ON webhooks(user_id);
CREATE INDEX idx_webhooks_active ON webhooks(is_active) WHERE is_active = TRUE;

-- 5. TABLE: webhook_history
-- Logs des webhooks envoyés
CREATE TABLE IF NOT EXISTS webhook_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_history_webhook ON webhook_history(webhook_id);
CREATE INDEX idx_webhook_history_created ON webhook_history(created_at DESC);

-- 6. TABLE: ar_experiences
-- Expériences de réalité augmentée
CREATE TABLE IF NOT EXISTS ar_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model_url TEXT NOT NULL, -- URL Cloudinary du modèle 3D
  model_format TEXT CHECK (model_format IN ('gltf', 'glb', 'usdz')),
  scene_config JSONB DEFAULT '{}'::jsonb, -- Configuration de la scène (lighting, etc.)
  share_url TEXT UNIQUE,
  qr_code_url TEXT,
  views INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0, -- Secondes
  is_public BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ar_experiences_user ON ar_experiences(user_id);
CREATE INDEX idx_ar_experiences_design ON ar_experiences(design_id);
CREATE INDEX idx_ar_experiences_share ON ar_experiences(share_url);

-- 7. TABLE: notifications
-- Système de notifications utilisateur
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- 8. TABLE: invitations
-- Invitations à rejoindre une équipe
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'designer', 'manager', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);

-- 9. TABLE: sessions
-- Sessions actives pour monitoring sécurité
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  location JSONB, -- { country, city, lat, lng }
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_active ON sessions(is_active, expires_at) WHERE is_active = TRUE;

-- 10. TABLE: revenue_tracking
-- Tracking détaillé des revenus
CREATE TABLE IF NOT EXISTS revenue_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('subscription', 'design_sale', 'api_usage', 'custom')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_revenue_tracking_user ON revenue_tracking(user_id);
CREATE INDEX idx_revenue_tracking_date ON revenue_tracking(recorded_at DESC);
CREATE INDEX idx_revenue_tracking_source ON revenue_tracking(source);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;

-- Policies pour team_members
CREATE POLICY "Users can view team members of their organization"
  ON team_members FOR SELECT
  USING (organization_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Organization owners can manage team members"
  ON team_members FOR ALL
  USING (organization_id = auth.uid());

-- Policies pour integrations
CREATE POLICY "Users can manage their own integrations"
  ON integrations FOR ALL
  USING (user_id = auth.uid());

-- Policies pour api_keys
CREATE POLICY "Users can manage their own API keys"
  ON api_keys FOR ALL
  USING (user_id = auth.uid());

-- Policies pour webhooks
CREATE POLICY "Users can manage their own webhooks"
  ON webhooks FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their webhook history"
  ON webhook_history FOR SELECT
  USING (webhook_id IN (SELECT id FROM webhooks WHERE user_id = auth.uid()));

-- Policies pour ar_experiences
CREATE POLICY "Users can manage their own AR experiences"
  ON ar_experiences FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Public AR experiences are viewable by anyone"
  ON ar_experiences FOR SELECT
  USING (is_public = TRUE OR user_id = auth.uid());

-- Policies pour notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Policies pour invitations
CREATE POLICY "Users can view invitations sent by their organization"
  ON invitations FOR SELECT
  USING (organization_id = auth.uid() OR email = auth.email());

CREATE POLICY "Organization owners can manage invitations"
  ON invitations FOR ALL
  USING (organization_id = auth.uid());

-- Policies pour sessions
CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON sessions FOR DELETE
  USING (user_id = auth.uid());

-- Policies pour revenue_tracking
CREATE POLICY "Users can view their own revenue"
  ON revenue_tracking FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ar_experiences_updated_at
  BEFORE UPDATE ON ar_experiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-expire invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE expires_at < NOW()
  AND status = 'pending';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Notify user of new notification
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('notification_' || NEW.user_id::text, json_build_object(
    'id', NEW.id,
    'type', NEW.type,
    'title', NEW.title,
    'message', NEW.message
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_user_on_new_notification
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION notify_new_notification();

-- ============================================
-- VIEWS UTILITAIRES
-- ============================================

-- View: Analytics quotidiennes
CREATE OR REPLACE VIEW analytics_daily AS
SELECT
  user_id,
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE created_at IS NOT NULL) as designs_created,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as designs_completed,
  0 as revenue -- À calculer depuis revenue_tracking
FROM designs
GROUP BY user_id, DATE(created_at);

-- View: Stats utilisateur
CREATE OR REPLACE VIEW user_stats AS
SELECT
  p.id as user_id,
  p.email,
  COUNT(DISTINCT d.id) as total_designs,
  COUNT(DISTINCT pr.id) as total_products,
  COUNT(DISTINCT tm.id) as team_members_count,
  COALESCE(SUM(rt.amount), 0) as total_revenue,
  p.created_at as member_since
FROM profiles p
LEFT JOIN designs d ON d.user_id = p.id
LEFT JOIN products pr ON pr.user_id = p.id
LEFT JOIN team_members tm ON tm.organization_id = p.id
LEFT JOIN revenue_tracking rt ON rt.user_id = p.id
GROUP BY p.id, p.email, p.created_at;

-- ============================================
-- DONNÉES INITIALES (OPTIONNEL)
-- ============================================

-- Exemple: Ajouter des événements webhook standards
INSERT INTO webhooks (user_id, url, secret, events, is_active)
VALUES
  -- Ces lignes seront ajoutées par les utilisateurs via l'UI
ON CONFLICT DO NOTHING;

-- ============================================
-- FINALISATION
-- ============================================

-- Rafraîchir les permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Toutes les tables ont été créées avec succès !';
  RAISE NOTICE '✅ RLS policies configurées';
  RAISE NOTICE '✅ Triggers activés';
  RAISE NOTICE '✅ Views créées';
  RAISE NOTICE '🎉 Base de données prête pour production !';
END
$$;
```

---

### **1.2 Script d'Exécution Automatique**

**Fichier** : `execute-sql-supabase.js`

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath) {
  console.log(`📝 Reading SQL file: ${filePath}`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`🚀 Executing SQL...`);
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('❌ Error executing SQL:', error);
    throw error;
  }
  
  console.log('✅ SQL executed successfully');
  return data;
}

async function main() {
  try {
    console.log('🏗️ Setting up Luneo Platform database...\n');
    
    // Exécuter le fichier SQL
    await executeSQLFile(path.join(__dirname, 'create-all-missing-tables.sql'));
    
    console.log('\n🎉 Database setup complete!');
    console.log('✅ All tables created');
    console.log('✅ RLS policies configured');
    console.log('✅ Triggers activated');
    console.log('✅ Views created\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
```

---

## **ÉTAPE 1.3 : Créer les API Routes**

Je vais maintenant continuer avec la création de toutes les API routes manquantes...

---

**📄 FIN DE LA PARTIE 1/5 DU DOCUMENT**

Voulez-vous que je continue avec :
1. La création de toutes les API routes (25+ fichiers)
2. Les hooks React personnalisés
3. La connexion des pages Dashboard
4. Les tests et validation

Ou préférez-vous que je commence directement l'implémentation en créant ces fichiers dans votre projet ?
