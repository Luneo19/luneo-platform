-- =====================================================
-- SEED TEMPLATES (20 templates de base)
-- =====================================================

-- Business Cards
INSERT INTO public.templates (name, slug, description, category, subcategory, preview_url, thumbnail_url, konva_json, width, height, unit, is_premium, is_featured, tags, keywords, price) VALUES
('Modern Business Card - Blue', 'modern-business-card-blue', 'Clean and professional business card design with blue accent', 'Business Cards', 'Modern', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#2563eb","width":350,"height":200}]}', 85, 55, 'mm', false, true, ARRAY['business', 'professional', 'modern'], ARRAY['business card', 'corporate', 'professional'], 0),

('Minimalist Business Card - Black', 'minimalist-business-card-black', 'Elegant minimalist business card with black and white theme', 'Business Cards', 'Minimalist', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#000000","width":350,"height":200}]}', 85, 55, 'mm', false, false, ARRAY['business', 'minimalist', 'elegant'], ARRAY['business card', 'minimal', 'black'], 0),

('Creative Business Card - Gradient', 'creative-business-card-gradient', 'Eye-catching business card with gradient background', 'Business Cards', 'Creative', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"linear-gradient(90deg, #667eea 0%, #764ba2 100%)","width":350,"height":200}]}', 85, 55, 'mm', true, true, ARRAY['business', 'creative', 'colorful'], ARRAY['business card', 'gradient', 'modern'], 4.99);

-- T-Shirts
INSERT INTO public.templates (name, slug, description, category, subcategory, preview_url, thumbnail_url, konva_json, width, height, unit, is_premium, is_featured, tags, keywords, price) VALUES
('Classic T-Shirt - White', 'classic-tshirt-white', 'Basic white t-shirt template for custom designs', 'T-Shirts', 'Classic', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#ffffff","width":400,"height":500}]}', 300, 400, 'mm', false, true, ARRAY['tshirt', 'apparel', 'classic'], ARRAY['t-shirt', 'clothing', 'white'], 0),

('Oversized T-Shirt - Black', 'oversized-tshirt-black', 'Trendy oversized t-shirt template', 'T-Shirts', 'Oversized', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#000000","width":450,"height":550}]}', 350, 450, 'mm', false, false, ARRAY['tshirt', 'apparel', 'oversized'], ARRAY['t-shirt', 'clothing', 'black'], 0),

('V-Neck T-Shirt - Gray', 'vneck-tshirt-gray', 'Elegant v-neck t-shirt template', 'T-Shirts', 'V-Neck', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#6b7280","width":400,"height":500}]}', 300, 400, 'mm', true, false, ARRAY['tshirt', 'apparel', 'vneck'], ARRAY['t-shirt', 'clothing', 'gray'], 2.99);

-- Mugs
INSERT INTO public.templates (name, slug, description, category, subcategory, preview_url, thumbnail_url, konva_json, width, height, unit, is_premium, is_featured, tags, keywords, price) VALUES
('Classic Mug - White', 'classic-mug-white', 'Standard white ceramic mug template', 'Mugs', 'Classic', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#ffffff","width":200,"height":100}]}', 220, 95, 'mm', false, true, ARRAY['mug', 'drinkware', 'classic'], ARRAY['coffee mug', 'ceramic', 'white'], 0),

('Color Pop Mug - Blue', 'colorpop-mug-blue', 'Vibrant blue mug template', 'Mugs', 'Color Pop', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#3b82f6","width":200,"height":100}]}', 220, 95, 'mm', false, false, ARRAY['mug', 'drinkware', 'colorful'], ARRAY['coffee mug', 'ceramic', 'blue'], 0),

('Magic Mug - Heat Activated', 'magic-mug-heat', 'Heat-activated color-changing mug', 'Mugs', 'Magic', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#000000","width":200,"height":100}]}', 220, 95, 'mm', true, true, ARRAY['mug', 'drinkware', 'magic'], ARRAY['coffee mug', 'magic mug', 'heat'], 5.99);

-- Posters
INSERT INTO public.templates (name, slug, description, category, subcategory, preview_url, thumbnail_url, konva_json, width, height, unit, is_premium, is_featured, tags, keywords, price) VALUES
('A3 Poster - Vertical', 'a3-poster-vertical', 'Standard A3 vertical poster template', 'Posters', 'A3', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#ffffff","width":297,"height":420}]}', 297, 420, 'mm', false, true, ARRAY['poster', 'print', 'vertical'], ARRAY['poster', 'a3', 'vertical'], 0),

('A2 Poster - Horizontal', 'a2-poster-horizontal', 'Large A2 horizontal poster template', 'Posters', 'A2', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#ffffff","width":594,"height":420}]}', 594, 420, 'mm', false, false, ARRAY['poster', 'print', 'horizontal'], ARRAY['poster', 'a2', 'horizontal'], 0),

('Movie Poster - 27x40', 'movie-poster-27x40', 'Standard movie poster size template', 'Posters', 'Movie', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#000000","width":686,"height":1016}]}', 686, 1016, 'mm', true, true, ARRAY['poster', 'print', 'movie'], ARRAY['poster', 'movie', '27x40'], 7.99);

-- Flyers
INSERT INTO public.templates (name, slug, description, category, subcategory, preview_url, thumbnail_url, konva_json, width, height, unit, is_premium, is_featured, tags, keywords, price) VALUES
('A5 Flyer - Event', 'a5-flyer-event', 'Compact A5 event flyer template', 'Flyers', 'Event', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#ffffff","width":148,"height":210}]}', 148, 210, 'mm', false, true, ARRAY['flyer', 'marketing', 'event'], ARRAY['flyer', 'a5', 'event'], 0),

('A4 Flyer - Business', 'a4-flyer-business', 'Professional A4 business flyer', 'Flyers', 'Business', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#ffffff","width":210,"height":297}]}', 210, 297, 'mm', false, false, ARRAY['flyer', 'marketing', 'business'], ARRAY['flyer', 'a4', 'business'], 0),

('DL Flyer - Promotional', 'dl-flyer-promo', 'Slim DL promotional flyer', 'Flyers', 'Promotional', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#f59e0b","width":99,"height":210}]}', 99, 210, 'mm', true, false, ARRAY['flyer', 'marketing', 'promo'], ARRAY['flyer', 'dl', 'promotional'], 3.99);

-- Invitations
INSERT INTO public.templates (name, slug, description, category, subcategory, preview_url, thumbnail_url, konva_json, width, height, unit, is_premium, is_featured, tags, keywords, price) VALUES
('Wedding Invitation - Elegant', 'wedding-invitation-elegant', 'Classic elegant wedding invitation', 'Invitations', 'Wedding', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#fef3c7","width":140,"height":200}]}', 140, 200, 'mm', true, true, ARRAY['invitation', 'wedding', 'elegant'], ARRAY['invitation', 'wedding', 'marriage'], 6.99),

('Birthday Invitation - Fun', 'birthday-invitation-fun', 'Colorful fun birthday invitation', 'Invitations', 'Birthday', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#fbbf24","width":140,"height":200}]}', 140, 200, 'mm', false, true, ARRAY['invitation', 'birthday', 'fun'], ARRAY['invitation', 'birthday', 'party'], 0),

('Party Invitation - Modern', 'party-invitation-modern', 'Modern party invitation template', 'Invitations', 'Party', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#8b5cf6","width":140,"height":200}]}', 140, 200, 'mm', false, false, ARRAY['invitation', 'party', 'modern'], ARRAY['invitation', 'party', 'celebration'], 0);

-- Labels & Stickers
INSERT INTO public.templates (name, slug, description, category, subcategory, preview_url, thumbnail_url, konva_json, width, height, unit, is_premium, is_featured, tags, keywords, price) VALUES
('Product Label - Circle', 'product-label-circle', 'Circular product label template', 'Labels', 'Product', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=400', '{"version":"5.3.0","objects":[{"type":"circle","fill":"#ffffff","radius":50}]}', 100, 100, 'mm', false, true, ARRAY['label', 'product', 'circle'], ARRAY['label', 'sticker', 'circular'], 0),

('Sticker - Square', 'sticker-square', 'Square sticker template', 'Stickers', 'Square', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=400', '{"version":"5.3.0","objects":[{"type":"rect","fill":"#ffffff","width":100,"height":100}]}', 100, 100, 'mm', false, false, ARRAY['sticker', 'square', 'adhesive'], ARRAY['sticker', 'label', 'square'], 0);

