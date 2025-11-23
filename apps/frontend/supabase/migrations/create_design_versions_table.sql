-- Migration: Create design_versions table for versioning system
-- TODO-036: Table pour système de versioning automatique

CREATE TABLE IF NOT EXISTS design_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES custom_designs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  design_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_design_version UNIQUE (design_id, version_number)
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_design_versions_design_id ON design_versions(design_id);
CREATE INDEX IF NOT EXISTS idx_design_versions_created_at ON design_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_design_versions_version_number ON design_versions(design_id, version_number DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_design_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_design_versions_updated_at
  BEFORE UPDATE ON design_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_design_versions_updated_at();

-- RLS (Row Level Security)
ALTER TABLE design_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own design versions
CREATE POLICY "Users can view own design versions"
  ON design_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM custom_designs
      WHERE custom_designs.id = design_versions.design_id
      AND custom_designs.user_id = auth.uid()
    )
  );

-- Policy: Users can create versions for their own designs
CREATE POLICY "Users can create own design versions"
  ON design_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_designs
      WHERE custom_designs.id = design_versions.design_id
      AND custom_designs.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own design versions
CREATE POLICY "Users can update own design versions"
  ON design_versions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM custom_designs
      WHERE custom_designs.id = design_versions.design_id
      AND custom_designs.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own design versions
CREATE POLICY "Users can delete own design versions"
  ON design_versions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM custom_designs
      WHERE custom_designs.id = design_versions.design_id
      AND custom_designs.user_id = auth.uid()
    )
  );

-- Commentaires pour documentation
COMMENT ON TABLE design_versions IS 'Historique des versions de designs avec versioning automatique';
COMMENT ON COLUMN design_versions.design_id IS 'Référence au design parent';
COMMENT ON COLUMN design_versions.version_number IS 'Numéro de version (1, 2, 3...)';
COMMENT ON COLUMN design_versions.design_data IS 'Snapshot complet des données du design à ce moment';
COMMENT ON COLUMN design_versions.metadata IS 'Métadonnées: auto_save, manual, restored, etc.';

