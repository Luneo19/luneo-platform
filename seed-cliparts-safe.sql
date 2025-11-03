-- ================================================
-- SEED CLIPARTS - VERSION SÉCURISÉE (UPSERT)
-- ================================================
-- Utilise INSERT ... ON CONFLICT pour éviter les erreurs de doublons

-- Supprimer les données existantes et réinitialiser (OPTIONNEL)
-- TRUNCATE TABLE public.cliparts CASCADE;

-- Insertion avec UPSERT (UPDATE si existe, INSERT sinon)
INSERT INTO public.cliparts (
  id,
  name,
  slug,
  description,
  category,
  subcategory,
  svg_url,
  preview_url,
  width_px,
  height_px,
  file_size_kb,
  color_scheme,
  tags,
  style,
  is_premium,
  license_type,
  attribution_required,
  attribution_text,
  is_published,
  views_count,
  downloads_count,
  favorites_count,
  search_vector
) VALUES
  ('c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c', 'Dog Silhouette', 'dog-silhouette', 'Cute dog silhouette icon', 'Animals', 'Mammals', 'https://www.svgrepo.com/show/13671/dog.svg', 'https://www.svgrepo.com/show/13671/dog.svg', 512, 512, 15, '{"primary": "#000000"}', ARRAY['dog', 'animal', 'pet', 'mammal'], 'flat', false, 'CC0', false, NULL, true, 0, 0, 0, to_tsvector('english', 'Dog Silhouette Cute dog silhouette icon dog animal pet mammal')),
  ('c2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Cat Icon', 'cat-icon', 'Simple cat icon', 'Animals', 'Mammals', 'https://www.svgrepo.com/show/13671/cat.svg', 'https://www.svgrepo.com/show/13671/cat.svg', 512, 512, 12, '{"primary": "#000000"}', ARRAY['cat', 'animal', 'pet', 'mammal'], 'flat', false, 'CC0', false, NULL, true, 0, 0, 0, to_tsvector('english', 'Cat Icon Simple cat icon cat animal pet mammal')),
  ('c3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', 'Star Shape', 'star-shape', 'Five-pointed star', 'Shapes', 'Basic', 'https://www.svgrepo.com/show/13671/star.svg', 'https://www.svgrepo.com/show/13671/star.svg', 512, 512, 8, '{"primary": "#FFD700"}', ARRAY['star', 'shape', 'rating', 'favorite'], 'flat', false, 'CC0', false, NULL, true, 0, 0, 0, to_tsvector('english', 'Star Shape Five-pointed star star shape rating favorite')),
  ('c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f', 'Heart Icon', 'heart-icon', 'Love heart icon', 'Shapes', 'Basic', 'https://www.svgrepo.com/show/13671/heart.svg', 'https://www.svgrepo.com/show/13671/heart.svg', 512, 512, 10, '{"primary": "#FF0000"}', ARRAY['heart', 'love', 'like', 'favorite'], 'flat', false, 'CC0', false, NULL, true, 0, 0, 0, to_tsvector('english', 'Heart Icon Love heart icon heart love like favorite')),
  ('c5e6f7a8-b9c0-1d2e-3f4a-5b6c7d8e9f0a', 'Flower Design', 'flower-design', 'Beautiful flower clipart', 'Nature', 'Plants', 'https://www.svgrepo.com/show/13671/flower.svg', 'https://www.svgrepo.com/show/13671/flower.svg', 512, 512, 18, '{"primary": "#FF69B4"}', ARRAY['flower', 'nature', 'plant', 'spring'], 'flat', true, 'Commercial', false, NULL, true, 0, 0, 0, to_tsvector('english', 'Flower Design Beautiful flower clipart flower nature plant spring')),
  ('c6f7a8b9-c0d1-2e3f-4a5b-6c7d8e9f0a1b', 'Tree Silhouette', 'tree-silhouette', 'Tree silhouette graphic', 'Nature', 'Plants', 'https://www.svgrepo.com/show/13671/tree.svg', 'https://www.svgrepo.com/show/13671/tree.svg', 512, 512, 20, '{"primary": "#228B22"}', ARRAY['tree', 'nature', 'plant', 'forest'], 'flat', false, 'CC0', false, NULL, true, 0, 0, 0, to_tsvector('english', 'Tree Silhouette Tree silhouette graphic tree nature plant forest')),
  ('c7a8b9c0-d1e2-3f4a-5b6c-7d8e9f0a1b2c', 'Sun Icon', 'sun-icon', 'Bright sun icon', 'Nature', 'Weather', 'https://www.svgrepo.com/show/13671/sun.svg', 'https://www.svgrepo.com/show/13671/sun.svg', 512, 512, 14, '{"primary": "#FFA500"}', ARRAY['sun', 'weather', 'summer', 'bright'], 'flat', false, 'CC0', false, NULL, true, 0, 0, 0, to_tsvector('english', 'Sun Icon Bright sun icon sun weather summer bright')),
  ('c8b9c0d1-e2f3-4a5b-6c7d-8e9f0a1b2c3d', 'Moon Crescent', 'moon-crescent', 'Crescent moon icon', 'Nature', 'Weather', 'https://www.svgrepo.com/show/13671/moon.svg', 'https://www.svgrepo.com/show/13671/moon.svg', 512, 512, 11, '{"primary": "#F0E68C"}', ARRAY['moon', 'night', 'weather', 'crescent'], 'flat', false, 'CC0', false, NULL, true, 0, 0, 0, to_tsvector('english', 'Moon Crescent Crescent moon icon moon night weather crescent')),
  ('c9c0d1e2-f3a4-5b6c-7d8e-9f0a1b2c3d4e', 'Cloud Shape', 'cloud-shape', 'Fluffy cloud icon', 'Nature', 'Weather', 'https://www.svgrepo.com/show/13671/cloud.svg', 'https://www.svgrepo.com/show/13671/cloud.svg', 512, 512, 13, '{"primary": "#87CEEB"}', ARRAY['cloud', 'weather', 'sky', 'fluffy'], 'flat', false, 'CC0', false, NULL, true, 0, 0, 0, to_tsvector('english', 'Cloud Shape Fluffy cloud icon cloud weather sky fluffy')),
  ('c0d1e2f3-a4b5-6c7d-8e9f-0a1b2c3d4e5f', 'Lightning Bolt', 'lightning-bolt', 'Electric lightning bolt', 'Nature', 'Weather', 'https://www.svgrepo.com/show/13671/lightning.svg', 'https://www.svgrepo.com/show/13671/lightning.svg', 512, 512, 9, '{"primary": "#FFFF00"}', ARRAY['lightning', 'weather', 'electricity', 'storm'], 'flat', false, 'CC0', false, NULL, true, 0, 0, 0, to_tsvector('english', 'Lightning Bolt Electric lightning bolt lightning weather electricity storm'))
ON CONFLICT (slug) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  svg_url = EXCLUDED.svg_url,
  preview_url = EXCLUDED.preview_url,
  width_px = EXCLUDED.width_px,
  height_px = EXCLUDED.height_px,
  file_size_kb = EXCLUDED.file_size_kb,
  color_scheme = EXCLUDED.color_scheme,
  tags = EXCLUDED.tags,
  style = EXCLUDED.style,
  is_premium = EXCLUDED.is_premium,
  license_type = EXCLUDED.license_type,
  attribution_required = EXCLUDED.attribution_required,
  attribution_text = EXCLUDED.attribution_text,
  is_published = EXCLUDED.is_published,
  search_vector = EXCLUDED.search_vector,
  updated_at = CURRENT_TIMESTAMP;

-- Message de succès
DO $$ 
BEGIN
  RAISE NOTICE '✅ 10 cliparts insérés ou mis à jour avec succès !';
END $$;



