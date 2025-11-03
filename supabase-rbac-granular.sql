-- ═══════════════════════════════════════════════════════════════
-- 🔐 LUNEO PLATFORM - RBAC GRANULAIRE
-- ═══════════════════════════════════════════════════════════════
-- Description: Permissions granulaires (can_view, can_edit, can_delete)
-- Author: AI Expert
-- Date: 2025-10-25
-- ═══════════════════════════════════════════════════════════════

-- ============================================
-- TABLE: role_permissions
-- ============================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'designer', 'viewer')),
  resource TEXT NOT NULL, -- designs, products, orders, etc.
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_share BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT role_resource_unique UNIQUE(role, resource)
);

-- Permissions par défaut
INSERT INTO public.role_permissions (role, resource, can_view, can_create, can_edit, can_delete, can_share, can_export) VALUES
  -- Owner (tous droits)
  ('owner', 'designs', true, true, true, true, true, true),
  ('owner', 'products', true, true, true, true, true, true),
  ('owner', 'orders', true, true, true, true, true, true),
  ('owner', 'team', true, true, true, true, false, false),
  ('owner', 'billing', true, true, true, false, false, true),
  ('owner', 'settings', true, false, true, false, false, false),
  
  -- Admin (presque tous droits)
  ('admin', 'designs', true, true, true, true, true, true),
  ('admin', 'products', true, true, true, true, true, true),
  ('admin', 'orders', true, true, true, false, false, true),
  ('admin', 'team', true, true, true, false, false, false),
  ('admin', 'billing', true, false, false, false, false, true),
  ('admin', 'settings', true, false, true, false, false, false),
  
  -- Designer (création et édition)
  ('designer', 'designs', true, true, true, false, true, true),
  ('designer', 'products', true, true, true, false, false, true),
  ('designer', 'orders', true, false, false, false, false, false),
  ('designer', 'team', true, false, false, false, false, false),
  ('designer', 'billing', false, false, false, false, false, false),
  ('designer', 'settings', true, false, true, false, false, false),
  
  -- Viewer (lecture seule)
  ('viewer', 'designs', true, false, false, false, false, false),
  ('viewer', 'products', true, false, false, false, false, false),
  ('viewer', 'orders', true, false, false, false, false, false),
  ('viewer', 'team', true, false, false, false, false, false),
  ('viewer', 'billing', false, false, false, false, false, false),
  ('viewer', 'settings', true, false, false, false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON public.role_permissions(resource);

-- ============================================
-- AJOUTER COLONNE permissions À team_members
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' 
    AND column_name = 'custom_permissions'
  ) THEN
    ALTER TABLE public.team_members 
    ADD COLUMN custom_permissions JSONB DEFAULT NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.team_members.custom_permissions IS 'Permissions personnalisées qui surchargent les permissions par défaut du rôle';

-- ============================================
-- FUNCTIONS HELPER
-- ============================================

-- Vérifier si un utilisateur a une permission
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_resource TEXT,
  p_action TEXT -- 'view', 'create', 'edit', 'delete', 'share', 'export'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  has_permission BOOLEAN := false;
  custom_perms JSONB;
BEGIN
  -- Récupérer le rôle de l'utilisateur
  SELECT role INTO user_role
  FROM public.team_members
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Si pas de rôle, l'utilisateur est propriétaire de ses propres ressources
  IF user_role IS NULL THEN
    RETURN true;
  END IF;

  -- Vérifier les permissions personnalisées
  SELECT custom_permissions INTO custom_perms
  FROM public.team_members
  WHERE user_id = p_user_id
  AND custom_permissions IS NOT NULL
  LIMIT 1;

  -- Si permissions personnalisées existent, les utiliser
  IF custom_perms IS NOT NULL AND custom_perms ? p_resource THEN
    CASE p_action
      WHEN 'view' THEN has_permission := (custom_perms->p_resource->>'can_view')::boolean;
      WHEN 'create' THEN has_permission := (custom_perms->p_resource->>'can_create')::boolean;
      WHEN 'edit' THEN has_permission := (custom_perms->p_resource->>'can_edit')::boolean;
      WHEN 'delete' THEN has_permission := (custom_perms->p_resource->>'can_delete')::boolean;
      WHEN 'share' THEN has_permission := (custom_perms->p_resource->>'can_share')::boolean;
      WHEN 'export' THEN has_permission := (custom_perms->p_resource->>'can_export')::boolean;
      ELSE has_permission := false;
    END CASE;
    RETURN has_permission;
  END IF;

  -- Sinon, utiliser les permissions par défaut du rôle
  CASE p_action
    WHEN 'view' THEN 
      SELECT can_view INTO has_permission FROM public.role_permissions WHERE role = user_role AND resource = p_resource;
    WHEN 'create' THEN 
      SELECT can_create INTO has_permission FROM public.role_permissions WHERE role = user_role AND resource = p_resource;
    WHEN 'edit' THEN 
      SELECT can_edit INTO has_permission FROM public.role_permissions WHERE role = user_role AND resource = p_resource;
    WHEN 'delete' THEN 
      SELECT can_delete INTO has_permission FROM public.role_permissions WHERE role = user_role AND resource = p_resource;
    WHEN 'share' THEN 
      SELECT can_share INTO has_permission FROM public.role_permissions WHERE role = user_role AND resource = p_resource;
    WHEN 'export' THEN 
      SELECT can_export INTO has_permission FROM public.role_permissions WHERE role = user_role AND resource = p_resource;
    ELSE 
      has_permission := false;
  END CASE;

  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir toutes les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  resource TEXT,
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN,
  can_share BOOLEAN,
  can_export BOOLEAN
) AS $$
DECLARE
  user_role TEXT;
  custom_perms JSONB;
BEGIN
  -- Récupérer le rôle
  SELECT tm.role, tm.custom_permissions INTO user_role, custom_perms
  FROM public.team_members tm
  WHERE tm.user_id = p_user_id
  LIMIT 1;

  -- Si pas de rôle, retourner permissions owner
  IF user_role IS NULL THEN
    RETURN QUERY
    SELECT 
      rp.resource,
      rp.can_view,
      rp.can_create,
      rp.can_edit,
      rp.can_delete,
      rp.can_share,
      rp.can_export
    FROM public.role_permissions rp
    WHERE rp.role = 'owner';
    RETURN;
  END IF;

  -- Retourner les permissions (custom si disponible, sinon par défaut)
  RETURN QUERY
  SELECT 
    rp.resource,
    COALESCE((custom_perms->rp.resource->>'can_view')::boolean, rp.can_view) as can_view,
    COALESCE((custom_perms->rp.resource->>'can_create')::boolean, rp.can_create) as can_create,
    COALESCE((custom_perms->rp.resource->>'can_edit')::boolean, rp.can_edit) as can_edit,
    COALESCE((custom_perms->rp.resource->>'can_delete')::boolean, rp.can_delete) as can_delete,
    COALESCE((custom_perms->rp.resource->>'can_share')::boolean, rp.can_share) as can_share,
    COALESCE((custom_perms->rp.resource->>'can_export')::boolean, rp.can_export) as can_export
  FROM public.role_permissions rp
  WHERE rp.role = user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- ✅ SCRIPT TERMINÉ
-- ═══════════════════════════════════════════════════════════════
-- 
-- Table créée :
--   ✅ role_permissions (permissions par rôle)
-- 
-- Colonne ajoutée :
--   ✅ team_members.custom_permissions
-- 
-- Fonctions :
--   ✅ check_user_permission(user_id, resource, action)
--   ✅ get_user_permissions(user_id)
-- 
-- Rôles configurés :
--   👑 owner (tous droits)
--   👨‍💼 admin (presque tous droits)
--   🎨 designer (création + édition)
--   👀 viewer (lecture seule)
-- 
-- ═══════════════════════════════════════════════════════════════

