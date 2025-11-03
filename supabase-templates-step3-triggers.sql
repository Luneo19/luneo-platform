-- =====================================================
-- ÉTAPE 3: CRÉER LES TRIGGERS ET FUNCTIONS
-- Exécute ce fichier APRÈS supabase-templates-step2-indexes-policies.sql
-- =====================================================

-- =====================================================
-- FUNCTIONS - Update counters
-- =====================================================

-- Function: Increment template downloads
CREATE OR REPLACE FUNCTION increment_template_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.templates
  SET downloads_count = downloads_count + 1
  WHERE id = NEW.resource_id AND NEW.resource_type = 'template';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour downloads
DROP TRIGGER IF EXISTS trigger_increment_template_downloads ON public.user_downloads;
CREATE TRIGGER trigger_increment_template_downloads
  AFTER INSERT ON public.user_downloads
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_downloads();

-- Function: Increment clipart downloads
CREATE OR REPLACE FUNCTION increment_clipart_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.cliparts
  SET downloads_count = downloads_count + 1
  WHERE id = NEW.resource_id AND NEW.resource_type = 'clipart';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour downloads
DROP TRIGGER IF EXISTS trigger_increment_clipart_downloads ON public.user_downloads;
CREATE TRIGGER trigger_increment_clipart_downloads
  AFTER INSERT ON public.user_downloads
  FOR EACH ROW
  EXECUTE FUNCTION increment_clipart_downloads();

-- Function: Update favorites count
CREATE OR REPLACE FUNCTION update_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.resource_type = 'template' THEN
      UPDATE public.templates SET favorites_count = favorites_count + 1 WHERE id = NEW.resource_id;
    ELSIF NEW.resource_type = 'clipart' THEN
      UPDATE public.cliparts SET favorites_count = favorites_count + 1 WHERE id = NEW.resource_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.resource_type = 'template' THEN
      UPDATE public.templates SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = OLD.resource_id;
    ELSIF OLD.resource_type = 'clipart' THEN
      UPDATE public.cliparts SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = OLD.resource_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour favorites
DROP TRIGGER IF EXISTS trigger_update_favorites_count ON public.user_favorites;
CREATE TRIGGER trigger_update_favorites_count
  AFTER INSERT OR DELETE ON public.user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorites_count();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS trigger_templates_updated_at ON public.templates;
CREATE TRIGGER trigger_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF EXISTS trigger_cliparts_updated_at ON public.cliparts;
CREATE TRIGGER trigger_cliparts_updated_at
  BEFORE UPDATE ON public.cliparts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

SELECT 'Setup completed!' as message;
