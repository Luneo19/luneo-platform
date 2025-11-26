-- ========================================
-- TABLES MARKETING CONTENT POUR LUNEO
-- ========================================
-- À exécuter sur Supabase pour créer les tables
-- de contenu marketing public
-- ========================================

-- ========================================
-- 1. TABLE: testimonials
-- ========================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(255),
  author_company VARCHAR(255) NOT NULL,
  author_avatar TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  industry VARCHAR(100), -- 'fashion', 'furniture', 'jewelry', etc.
  solution VARCHAR(100), -- 'customizer', 'configurator-3d', 'virtual-try-on'
  metric_label VARCHAR(100), -- 'Conversions', 'Retours', etc.
  metric_value VARCHAR(50), -- '+45%', '-60%', etc.
  featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_testimonials_industry ON public.testimonials(industry);
CREATE INDEX idx_testimonials_solution ON public.testimonials(solution);
CREATE INDEX idx_testimonials_featured ON public.testimonials(featured) WHERE featured = true;
CREATE INDEX idx_testimonials_published ON public.testimonials(is_published) WHERE is_published = true;

-- RLS pour testimonials (lecture publique)
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Testimonials are publicly readable" ON public.testimonials;
CREATE POLICY "Testimonials are publicly readable" ON public.testimonials 
FOR SELECT USING (is_published = true);

-- ========================================
-- 1b. TABLE: client_logos
-- ========================================
CREATE TABLE IF NOT EXISTS public.client_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  industry VARCHAR(100),
  featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_logos_featured ON public.client_logos(featured);
CREATE INDEX idx_client_logos_industry ON public.client_logos(industry);

ALTER TABLE public.client_logos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Client logos are publicly readable" ON public.client_logos;
CREATE POLICY "Client logos are publicly readable" ON public.client_logos 
FOR SELECT USING (is_published = true);

-- ========================================
-- 1c. TABLE: case_studies
-- ========================================
CREATE TABLE IF NOT EXISTS public.case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  industry VARCHAR(100),
  solution VARCHAR(100),
  metrics JSONB DEFAULT '[]'::jsonb, -- [{label, value}]
  client_name VARCHAR(255),
  client_logo TEXT,
  featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_case_studies_slug ON public.case_studies(slug);
CREATE INDEX idx_case_studies_industry ON public.case_studies(industry);
CREATE INDEX idx_case_studies_solution ON public.case_studies(solution);
CREATE INDEX idx_case_studies_featured ON public.case_studies(featured);

ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Case studies are publicly readable" ON public.case_studies;
CREATE POLICY "Case studies are publicly readable" ON public.case_studies 
FOR SELECT USING (is_published = true);

-- ========================================
-- 1d. TABLE: app_config (pour marketing stats)
-- ========================================
CREATE TABLE IF NOT EXISTS public.app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App config is publicly readable" ON public.app_config;
CREATE POLICY "App config is publicly readable" ON public.app_config 
FOR SELECT USING (true);

-- ========================================
-- 2. TABLE: marketing_stats
-- ========================================
CREATE TABLE IF NOT EXISTS public.marketing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(100) NOT NULL,
  value VARCHAR(50) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  category VARCHAR(100), -- 'homepage', 'pricing', 'solutions'
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_stats_category ON public.marketing_stats(category);

ALTER TABLE public.marketing_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Marketing stats are publicly readable" ON public.marketing_stats;
CREATE POLICY "Marketing stats are publicly readable" ON public.marketing_stats 
FOR SELECT USING (is_published = true);

-- ========================================
-- 3. TABLE: solutions
-- ========================================
CREATE TABLE IF NOT EXISTS public.solutions (
  id VARCHAR(100) PRIMARY KEY, -- 'customizer', 'configurator-3d', 'virtual-try-on'
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(500),
  description TEXT NOT NULL,
  hero_image TEXT,
  demo_url VARCHAR(500),
  features JSONB DEFAULT '[]'::jsonb, -- [{title, description, icon}]
  use_cases JSONB DEFAULT '[]'::jsonb, -- [{industry, title, description, result}]
  pricing JSONB DEFAULT '{}'::jsonb, -- {starter: {price, features}, pro: {...}}
  stats JSONB DEFAULT '[]'::jsonb, -- [{value, label}]
  integrations TEXT[], -- ['Shopify', 'WooCommerce']
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solutions are publicly readable" ON public.solutions;
CREATE POLICY "Solutions are publicly readable" ON public.solutions 
FOR SELECT USING (is_published = true);

-- ========================================
-- 4. TABLE: industries
-- ========================================
CREATE TABLE IF NOT EXISTS public.industries (
  id VARCHAR(100) PRIMARY KEY, -- 'fashion', 'furniture', 'jewelry', etc.
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  tagline VARCHAR(500),
  description TEXT NOT NULL,
  hero_image TEXT,
  icon VARCHAR(50), -- Lucide icon name
  features JSONB DEFAULT '[]'::jsonb, -- [{title, description, icon}]
  case_studies JSONB DEFAULT '[]'::jsonb, -- [{company, challenge, solution, results}]
  stats JSONB DEFAULT '[]'::jsonb, -- [{value, label}]
  recommended_solutions TEXT[], -- ['customizer', 'configurator-3d']
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_industries_slug ON public.industries(slug);

ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Industries are publicly readable" ON public.industries;
CREATE POLICY "Industries are publicly readable" ON public.industries 
FOR SELECT USING (is_published = true);

-- ========================================
-- 5. TABLE: platform_integrations
-- ========================================
CREATE TABLE IF NOT EXISTS public.platform_integrations (
  id VARCHAR(100) PRIMARY KEY, -- 'shopify', 'woocommerce', 'stripe', etc.
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL, -- 'E-commerce', 'Payment', 'Print-on-Demand', 'Automation'
  tagline VARCHAR(500),
  description TEXT NOT NULL,
  logo_url TEXT,
  icon VARCHAR(50), -- Lucide icon name
  website VARCHAR(500),
  docs_url VARCHAR(500),
  features JSONB DEFAULT '[]'::jsonb, -- [{title, description}]
  setup_steps TEXT[],
  pricing JSONB DEFAULT '{}'::jsonb, -- {free: boolean, includedIn: ['starter', 'pro']}
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'beta', 'coming_soon'
  is_popular BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_integrations_slug ON public.platform_integrations(slug);
CREATE INDEX idx_platform_integrations_category ON public.platform_integrations(category);

ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Integrations are publicly readable" ON public.platform_integrations;
CREATE POLICY "Integrations are publicly readable" ON public.platform_integrations 
FOR SELECT USING (is_published = true);

-- ========================================
-- 6. TABLE: pricing_plans
-- ========================================
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id VARCHAR(100) PRIMARY KEY, -- 'starter', 'pro', 'enterprise'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_monthly INTEGER, -- en centimes, NULL = sur devis
  price_yearly INTEGER, -- en centimes
  currency VARCHAR(3) DEFAULT 'EUR',
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  features JSONB DEFAULT '[]'::jsonb, -- [{name, included: boolean}]
  limits JSONB DEFAULT '{}'::jsonb, -- {designs: 100, products: 50, storage: '5GB'}
  is_popular BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pricing plans are publicly readable" ON public.pricing_plans;
CREATE POLICY "Pricing plans are publicly readable" ON public.pricing_plans 
FOR SELECT USING (is_published = true);

-- ========================================
-- SEED DATA - Testimonials
-- ========================================
INSERT INTO public.testimonials (content, author_name, author_role, author_company, rating, industry, solution, metric_label, metric_value, featured, display_order) VALUES
('Luneo a transformé notre processus de personnalisation. Nos clients adorent l''expérience 3D !', 'Sophie M.', 'E-commerce Director', 'LuxWatch Co.', 5, 'jewelry', 'configurator-3d', 'Engagement', '+180%', true, 1),
('L''essayage virtuel a réduit nos retours de 40%. Un game-changer pour notre e-commerce.', 'Marc D.', 'CEO', 'OptiStyle', 5, 'fashion', 'virtual-try-on', 'Retours', '-40%', true, 2),
('La génération de fichiers print-ready est un gain de temps énorme. Intégration parfaite avec Shopify.', 'Émilie R.', 'Directrice Production', 'Printify Pro', 5, 'printing', 'customizer', 'Temps prod', '-80%', true, 3),
('Le customizer Luneo a révolutionné notre business. Nos clients adorent créer leurs propres designs.', 'Marie D.', 'CEO', 'PrintShop Pro', 5, 'printing', 'customizer', 'Conversions', '+340%', false, 4),
('L''API est incroyablement simple. Nous avons intégré le configurateur 3D en moins d''une journée.', 'Pierre M.', 'CTO', 'FurnitureLab', 5, 'furniture', 'configurator-3d', 'Intégration', '1 jour', false, 5),
('Le virtual try-on bijoux est bluffant de réalisme. ROI positif en 2 mois.', 'Claire B.', 'Digital Manager', 'Bijoux Paris', 5, 'jewelry', 'virtual-try-on', 'Conversions', '+65%', false, 6)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- SEED DATA - Client Logos
-- ========================================
INSERT INTO public.client_logos (name, logo_url, website_url, industry, featured, display_order) VALUES
('LuxWatch Co.', '/logos/clients/luxwatch.svg', 'https://luxwatch.com', 'jewelry', true, 1),
('OptiStyle', '/logos/clients/optistyle.svg', 'https://optistyle.com', 'fashion', true, 2),
('Printify Pro', '/logos/clients/printify.svg', 'https://printify.com', 'printing', true, 3),
('FurnitureLab', '/logos/clients/furniturelab.svg', 'https://furniturelab.com', 'furniture', true, 4),
('Bijoux Paris', '/logos/clients/bijouxparis.svg', 'https://bijouxparis.com', 'jewelry', true, 5),
('SportGear', '/logos/clients/sportgear.svg', 'https://sportgear.com', 'sports', false, 6)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- SEED DATA - Case Studies
-- ========================================
INSERT INTO public.case_studies (title, slug, excerpt, industry, solution, metrics, client_name, client_logo, featured) VALUES
('Comment LuxWatch a augmenté ses conversions de 180%', 'luxwatch-conversions', 'Découvrez comment LuxWatch a transformé son e-commerce avec le configurateur 3D Luneo.', 'jewelry', 'configurator-3d', '[{"label": "Conversions", "value": "+180%"}, {"label": "Temps sur page", "value": "x3"}, {"label": "Retours", "value": "-30%"}]'::jsonb, 'LuxWatch Co.', '/logos/clients/luxwatch.svg', true),
('OptiStyle réduit ses retours de 40% avec le Virtual Try-On', 'optistyle-retours', 'L''essayage virtuel révolutionne l''achat de lunettes en ligne.', 'fashion', 'virtual-try-on', '[{"label": "Retours", "value": "-40%"}, {"label": "Satisfaction", "value": "95%"}, {"label": "Conversions", "value": "+25%"}]'::jsonb, 'OptiStyle', '/logos/clients/optistyle.svg', true),
('Printify Pro automatise sa production avec Luneo', 'printify-automation', 'De la personnalisation à l''impression en un clic.', 'printing', 'customizer', '[{"label": "Temps prod", "value": "-80%"}, {"label": "Erreurs", "value": "-95%"}, {"label": "Commandes", "value": "+200%"}]'::jsonb, 'Printify Pro', '/logos/clients/printify.svg', true)
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- SEED DATA - App Config
-- ========================================
INSERT INTO public.app_config (key, value, description) VALUES
('marketing_stats', '{"totalBrands": 500, "totalProducts": 10000000, "avgConversion": 40, "avgReturnReduction": 50, "uptime": 99.9, "avgRating": 4.8}', 'Statistiques marketing affichées sur les pages publiques')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ========================================
-- SEED DATA - Marketing Stats
-- ========================================
INSERT INTO public.marketing_stats (label, value, description, icon, category, display_order) VALUES
('Conversions', '+40%', 'Augmentation taux achat', 'TrendingUp', 'homepage', 1),
('Engagement', 'x3', 'Temps sur site', 'Clock', 'homepage', 2),
('Retours', '-60%', 'Réduction retours produits', 'RefreshCw', 'homepage', 3),
('Satisfaction', '95%', 'Clients satisfaits', 'Star', 'homepage', 4),
('Créateurs', '10,000+', 'Créateurs actifs', 'Users', 'homepage', 5),
('Designs', '500M+', 'Designs générés', 'Sparkles', 'homepage', 6)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- SEED DATA - Solutions
-- ========================================
INSERT INTO public.solutions (id, name, tagline, description, features, stats, integrations, display_order) VALUES
('customizer', 'Customizer 2D', 'Personnalisation produit en temps réel', 'Offrez à vos clients une expérience de personnalisation immersive avec notre éditeur 2D professionnel.', 
 '[{"title": "Éditeur visuel drag & drop", "description": "Interface intuitive pour ajouter textes, images, formes", "icon": "Layers"}, {"title": "Zones personnalisables", "description": "Définissez précisément les zones modifiables", "icon": "Target"}, {"title": "Bibliothèque de cliparts", "description": "10,000+ cliparts vectoriels inclus", "icon": "Image"}, {"title": "Export haute résolution", "description": "PNG/PDF 300 DPI, CMYK print-ready", "icon": "Download"}]'::jsonb,
 '[{"value": "+200%", "label": "Panier moyen"}, {"value": "-60%", "label": "Temps de production"}, {"value": "95%", "label": "Satisfaction client"}]'::jsonb,
 ARRAY['Shopify', 'WooCommerce', 'Magento', 'PrestaShop', 'Printful'], 1),
('configurator-3d', 'Configurateur 3D', 'Visualisation produit photoréaliste', 'Présentez vos produits en 3D avec une qualité studio. Rotation 360°, zoom HD, changement de couleurs et matériaux.',
 '[{"title": "Rendu photoréaliste", "description": "Qualité comparable à une photo studio", "icon": "Camera"}, {"title": "Rotation 360°", "description": "Visualisation sous tous les angles", "icon": "RotateCw"}, {"title": "Changement de matériaux", "description": "Cuir, métal, bois, tissu en temps réel", "icon": "Palette"}, {"title": "Export AR (USDZ/GLB)", "description": "Visualisation en réalité augmentée", "icon": "Smartphone"}]'::jsonb,
 '[{"value": "+45%", "label": "Conversions"}, {"value": "-50%", "label": "Retours produits"}, {"value": "3x", "label": "Temps sur page"}]'::jsonb,
 ARRAY['Shopify', 'WooCommerce', 'Magento', 'Custom JS'], 2),
('virtual-try-on', 'Virtual Try-On', 'Essayage virtuel avec IA', 'Permettez à vos clients d''essayer lunettes, montres, bijoux virtuellement grâce à notre technologie de face et hand tracking.',
 '[{"title": "Face tracking 468 points", "description": "Détection précise du visage en temps réel", "icon": "Scan"}, {"title": "Hand tracking 21 points", "description": "Essayage de bagues et bracelets", "icon": "Hand"}, {"title": "Capture photo/vidéo", "description": "Partage sur réseaux sociaux intégré", "icon": "Camera"}, {"title": "Compatible mobile", "description": "Fonctionne sur iOS et Android", "icon": "Smartphone"}]'::jsonb,
 '[{"value": "+40%", "label": "Conversions"}, {"value": "-60%", "label": "Retours"}, {"value": "2M+", "label": "Essayages/mois"}]'::jsonb,
 ARRAY['Shopify', 'WooCommerce', 'iOS SDK', 'Android SDK'], 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  stats = EXCLUDED.stats,
  integrations = EXCLUDED.integrations;

-- ========================================
-- SEED DATA - Industries
-- ========================================
INSERT INTO public.industries (id, name, slug, tagline, description, icon, features, stats, recommended_solutions, display_order) VALUES
('fashion', 'Mode & Textile', 'fashion', 'Personnalisation textile à grande échelle', 'De la fast-fashion au luxe, Luneo accompagne les marques de mode dans leur transformation digitale.', 'Shirt',
 '[{"title": "Personnalisation textile", "description": "T-shirts, sweats, casquettes personnalisables", "icon": "Palette"}, {"title": "Visualisation 3D vêtements", "description": "Rendu réaliste des tissus et coupes", "icon": "Box"}, {"title": "Size guide AR", "description": "Guide des tailles en réalité augmentée", "icon": "Ruler"}]'::jsonb,
 '[{"value": "+180%", "label": "Références produits"}, {"value": "-70%", "label": "Temps de production"}, {"value": "+40%", "label": "Panier moyen"}]'::jsonb,
 ARRAY['customizer', 'configurator-3d'], 1),
('furniture', 'Mobilier & Décoration', 'furniture', 'Visualisez vos meubles en situation', 'Le configurateur 3D et la réalité augmentée révolutionnent la vente de mobilier.', 'Sofa',
 '[{"title": "Configurateur 3D interactif", "description": "Changez couleurs, tissus, dimensions", "icon": "Settings"}, {"title": "AR Room Planner", "description": "Placez les meubles dans votre espace", "icon": "Smartphone"}, {"title": "Rendu photoréaliste", "description": "Qualité studio photo sans shooting", "icon": "Camera"}]'::jsonb,
 '[{"value": "-55%", "label": "Retours produits"}, {"value": "+30%", "label": "Conversions"}, {"value": "3x", "label": "Temps sur page"}]'::jsonb,
 ARRAY['configurator-3d'], 2),
('jewelry', 'Bijouterie & Horlogerie', 'jewelry', 'L''essayage virtuel pour bijoux et montres', 'Virtual try-on et configurateur 3D permettent aux clients d''essayer et personnaliser bijoux et montres.', 'Gem',
 '[{"title": "Virtual Try-On bijoux", "description": "Essayage bagues, boucles, colliers", "icon": "Sparkles"}, {"title": "Hand tracking précis", "description": "21 points de tracking pour bagues", "icon": "Hand"}, {"title": "Configurateur gravure", "description": "Personnalisation et gravure en temps réel", "icon": "PenTool"}]'::jsonb,
 '[{"value": "+65%", "label": "Conversions"}, {"value": "-40%", "label": "Retours"}, {"value": "+€150", "label": "Panier moyen"}]'::jsonb,
 ARRAY['virtual-try-on', 'configurator-3d'], 3),
('automotive', 'Automobile', 'automotive', 'Configurez votre véhicule en 3D', 'Des jantes aux accessoires, visualisez toutes les options de votre véhicule.', 'Car',
 '[{"title": "Configurateur véhicule", "description": "Couleurs, jantes, options en temps réel", "icon": "Settings"}, {"title": "Rendu extérieur/intérieur", "description": "Visualisation complète du véhicule", "icon": "Camera"}, {"title": "AR parking", "description": "Visualisez le véhicule devant chez vous", "icon": "Smartphone"}]'::jsonb,
 '[{"value": "+90%", "label": "Engagement"}, {"value": "+35%", "label": "Conversions"}, {"value": "-25%", "label": "Demandes SAV"}]'::jsonb,
 ARRAY['configurator-3d'], 4),
('sports', 'Sport & Outdoor', 'sports', 'Équipements sportifs personnalisés', 'Personnalisation de maillots aux équipements techniques.', 'Dumbbell',
 '[{"title": "Personnalisation maillots", "description": "Noms, numéros, logos d équipe", "icon": "Shirt"}, {"title": "Configurateur équipement", "description": "Chaussures, raquettes, vélos", "icon": "Settings"}, {"title": "Team builder", "description": "Création de tenues d équipe complètes", "icon": "Users"}]'::jsonb,
 '[{"value": "+200%", "label": "Commandes équipes"}, {"value": "-80%", "label": "Temps de saisie"}, {"value": "+50%", "label": "Panier moyen"}]'::jsonb,
 ARRAY['customizer'], 5),
('printing', 'Impression & Print-on-Demand', 'printing', 'Production print-ready automatisée', 'Générez automatiquement des fichiers d''impression optimisés.', 'Printer',
 '[{"title": "Export multi-formats", "description": "PDF/X-4, TIFF, PNG 300 DPI", "icon": "FileOutput"}, {"title": "Profils couleur ICC", "description": "CMYK, Pantone, profils custom", "icon": "Palette"}, {"title": "Marques de coupe auto", "description": "Bleed, crop marks, zones sécurisées", "icon": "Scissors"}]'::jsonb,
 '[{"value": "-95%", "label": "Erreurs fichiers"}, {"value": "-60%", "label": "Temps prépresse"}, {"value": "+30%", "label": "Marge"}]'::jsonb,
 ARRAY['customizer'], 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  features = EXCLUDED.features,
  stats = EXCLUDED.stats,
  recommended_solutions = EXCLUDED.recommended_solutions;

-- ========================================
-- SEED DATA - Platform Integrations
-- ========================================
INSERT INTO public.platform_integrations (id, name, slug, category, tagline, description, icon, features, setup_steps, pricing, status, is_popular, display_order) VALUES
('shopify', 'Shopify', 'shopify', 'E-commerce', 'Intégration native pour Shopify', 'Connectez votre boutique Shopify en quelques clics.', 'ShoppingBag',
 '[{"title": "Sync automatique des produits", "description": "Vos produits Shopify sont automatiquement importés"}, {"title": "Bouton Personnaliser", "description": "Ajout automatique sur vos fiches produits"}, {"title": "Commandes synchronisées", "description": "Les commandes personnalisées sont envoyées à Shopify"}]'::jsonb,
 ARRAY['Installez l app Luneo depuis le Shopify App Store', 'Connectez votre compte Luneo', 'Sélectionnez les produits à personnaliser', 'Publiez et testez'],
 '{"free": false, "includedIn": ["starter", "pro", "enterprise"]}'::jsonb,
 'available', true, 1),
('woocommerce', 'WooCommerce', 'woocommerce', 'E-commerce', 'Plugin officiel pour WordPress/WooCommerce', 'Plugin WordPress certifié pour intégrer Luneo à votre boutique WooCommerce.', 'ShoppingCart',
 '[{"title": "Installation en 1 clic", "description": "Plugin disponible sur le repository WordPress"}, {"title": "Shortcodes flexibles", "description": "Intégrez le customizer n importe où"}, {"title": "Support des variations", "description": "Compatible avec les produits variables"}]'::jsonb,
 ARRAY['Téléchargez le plugin depuis WordPress.org', 'Activez le plugin dans WordPress', 'Entrez votre clé API Luneo', 'Configurez les produits'],
 '{"free": false, "includedIn": ["starter", "pro", "enterprise"]}'::jsonb,
 'available', true, 2),
('printful', 'Printful', 'printful', 'Print-on-Demand', 'Synchronisation automatique avec Printful', 'Envoyez automatiquement vos designs vers Printful.', 'Printer',
 '[{"title": "Envoi automatique des fichiers", "description": "Les fichiers print-ready sont envoyés à Printful"}, {"title": "Catalogue produits", "description": "Accédez au catalogue Printful depuis Luneo"}, {"title": "Suivi de production", "description": "Suivez le statut en temps réel"}]'::jsonb,
 ARRAY['Connectez votre compte Printful', 'Sélectionnez les produits à synchroniser', 'Configurez les zones d impression', 'Activez l envoi automatique'],
 '{"free": false, "includedIn": ["pro", "enterprise"]}'::jsonb,
 'available', true, 3),
('stripe', 'Stripe', 'stripe', 'Paiement', 'Paiements sécurisés par Stripe', 'Acceptez les paiements directement dans votre configurateur.', 'CreditCard',
 '[{"title": "Checkout intégré", "description": "Paiement sans quitter le configurateur"}, {"title": "Multi-devises", "description": "135+ devises supportées"}, {"title": "Abonnements", "description": "Gestion des abonnements récurrents"}]'::jsonb,
 ARRAY['Créez un compte Stripe', 'Copiez vos clés API dans Luneo', 'Configurez les webhooks', 'Testez en mode sandbox'],
 '{"free": true, "includedIn": ["starter", "pro", "enterprise"]}'::jsonb,
 'available', true, 4),
('zapier', 'Zapier', 'zapier', 'Automation', 'Connectez Luneo à 5000+ applications', 'Automatisez vos workflows en connectant Luneo à des milliers d apps.', 'Zap',
 '[{"title": "Triggers Luneo", "description": "Nouveau design, commande, etc."}, {"title": "Actions Luneo", "description": "Créer un design, exporter, etc."}, {"title": "5000+ apps", "description": "Connectez à Slack, Gmail, Notion..."}]'::jsonb,
 ARRAY['Créez un compte Zapier', 'Recherchez Luneo dans le catalogue', 'Connectez votre compte Luneo', 'Créez votre premier Zap'],
 '{"free": false, "includedIn": ["pro", "enterprise"]}'::jsonb,
 'available', false, 5),
('make', 'Make (Integromat)', 'make', 'Automation', 'Scénarios d automatisation avancés', 'Créez des scénarios d automatisation puissants avec Make.', 'GitBranch',
 '[{"title": "Scénarios visuels", "description": "Interface drag & drop intuitive"}, {"title": "Logique conditionnelle", "description": "Filtres et routeurs avancés"}, {"title": "Transformations de données", "description": "Manipulation de données puissante"}]'::jsonb,
 ARRAY['Créez un compte Make', 'Ajoutez le module Luneo', 'Connectez votre compte', 'Construisez votre scénario'],
 '{"free": false, "includedIn": ["pro", "enterprise"]}'::jsonb,
 'available', false, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  category = EXCLUDED.category,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  features = EXCLUDED.features,
  setup_steps = EXCLUDED.setup_steps,
  pricing = EXCLUDED.pricing,
  status = EXCLUDED.status,
  is_popular = EXCLUDED.is_popular;

-- ========================================
-- SEED DATA - Pricing Plans
-- ========================================
INSERT INTO public.pricing_plans (id, name, description, price_monthly, price_yearly, features, limits, is_popular, display_order) VALUES
('starter', 'Starter', 'Parfait pour démarrer', 2900, 29000, 
 '[{"name": "100 designs/mois", "included": true}, {"name": "Customizer 2D", "included": true}, {"name": "Export PNG/PDF", "included": true}, {"name": "Support email", "included": true}, {"name": "Configurateur 3D", "included": false}, {"name": "Virtual Try-On", "included": false}]'::jsonb,
 '{"designs": 100, "products": 50, "storage": "5 GB", "apiCalls": 0}'::jsonb,
 false, 1),
('pro', 'Pro', 'Pour les équipes en croissance', 7900, 79000,
 '[{"name": "1000 designs/mois", "included": true}, {"name": "Customizer 2D", "included": true}, {"name": "Configurateur 3D", "included": true}, {"name": "Export tous formats", "included": true}, {"name": "Virtual Try-On", "included": true}, {"name": "API access", "included": true}, {"name": "Support prioritaire", "included": true}]'::jsonb,
 '{"designs": 1000, "products": 500, "storage": "50 GB", "apiCalls": 10000}'::jsonb,
 true, 2),
('enterprise', 'Enterprise', 'Solutions sur-mesure', NULL, NULL,
 '[{"name": "Designs illimités", "included": true}, {"name": "Toutes les fonctionnalités", "included": true}, {"name": "White-label complet", "included": true}, {"name": "API illimitée", "included": true}, {"name": "SSO/SAML", "included": true}, {"name": "SLA 99.99%", "included": true}, {"name": "Account manager dédié", "included": true}]'::jsonb,
 '{"designs": -1, "products": -1, "storage": "Illimité", "apiCalls": -1}'::jsonb,
 false, 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_popular = EXCLUDED.is_popular;

-- ========================================
-- VERIFICATION
-- ========================================
SELECT 
  'Tables marketing créées avec succès!' as message,
  (SELECT COUNT(*) FROM public.testimonials) as testimonials_count,
  (SELECT COUNT(*) FROM public.marketing_stats) as stats_count,
  (SELECT COUNT(*) FROM public.solutions) as solutions_count,
  (SELECT COUNT(*) FROM public.industries) as industries_count,
  (SELECT COUNT(*) FROM public.platform_integrations) as integrations_count,
  (SELECT COUNT(*) FROM public.pricing_plans) as plans_count;

-- ========================================
-- FIN
-- ========================================

