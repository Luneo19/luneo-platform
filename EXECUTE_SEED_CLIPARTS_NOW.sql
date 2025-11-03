-- =====================================================
-- ⚡ SEED CLIPARTS - EXÉCUTION RAPIDE
-- =====================================================
-- Fichier: EXECUTE_SEED_CLIPARTS_NOW.sql
-- Action: Coller ce fichier dans Supabase SQL Editor et cliquer "Run"
-- Résultat: 50 cliparts ajoutés à la database
-- =====================================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cliparts') THEN
    RAISE EXCEPTION 'Table cliparts does not exist. Please run supabase-templates-step1-tables-only.sql first';
  END IF;
END $$;

-- Animals (5 cliparts)
INSERT INTO public.cliparts (name, slug, description, category, subcategory, svg_url, preview_url, thumbnail_url, svg_viewbox, width, height, is_premium, is_featured, is_colorizable, default_color, tags, keywords, style, price) VALUES
('Dog Silhouette', 'dog-silhouette', 'Simple dog silhouette icon', 'Animals', 'Pets', 'https://www.svgrepo.com/show/13671/dog.svg', 'https://www.svgrepo.com/show/13671/dog.svg', 'https://www.svgrepo.com/show/13671/dog.svg', '0 0 512 512', 512, 512, false, true, true, '#000000', ARRAY['dog', 'pet', 'animal'], ARRAY['dog', 'pet', 'puppy'], 'Minimalist', 0),
('Cat Silhouette', 'cat-silhouette', 'Elegant cat silhouette icon', 'Animals', 'Pets', 'https://www.svgrepo.com/show/13671/cat.svg', 'https://www.svgrepo.com/show/13671/cat.svg', 'https://www.svgrepo.com/show/13671/cat.svg', '0 0 512 512', 512, 512, false, true, true, '#000000', ARRAY['cat', 'pet', 'animal'], ARRAY['cat', 'pet', 'kitten'], 'Minimalist', 0),
('Bird Flying', 'bird-flying', 'Flying bird icon', 'Animals', 'Wild', 'https://www.svgrepo.com/show/13671/bird.svg', 'https://www.svgrepo.com/show/13671/bird.svg', 'https://www.svgrepo.com/show/13671/bird.svg', '0 0 512 512', 512, 512, false, false, true, '#2563eb', ARRAY['bird', 'flying', 'animal'], ARRAY['bird', 'fly', 'nature'], 'Minimalist', 0),
('Butterfly', 'butterfly', 'Beautiful butterfly icon', 'Animals', 'Insects', 'https://www.svgrepo.com/show/13671/butterfly.svg', 'https://www.svgrepo.com/show/13671/butterfly.svg', 'https://www.svgrepo.com/show/13671/butterfly.svg', '0 0 512 512', 512, 512, false, true, true, '#ec4899', ARRAY['butterfly', 'insect', 'nature'], ARRAY['butterfly', 'insect', 'spring'], 'Hand-drawn', 0),
('Fish', 'fish', 'Simple fish icon', 'Animals', 'Aquatic', 'https://www.svgrepo.com/show/13671/fish.svg', 'https://www.svgrepo.com/show/13671/fish.svg', 'https://www.svgrepo.com/show/13671/fish.svg', '0 0 512 512', 512, 512, false, false, true, '#0ea5e9', ARRAY['fish', 'aquatic', 'animal'], ARRAY['fish', 'water', 'ocean'], 'Minimalist', 0);

-- Food (10 cliparts)
INSERT INTO public.cliparts (name, slug, description, category, subcategory, svg_url, preview_url, thumbnail_url, svg_viewbox, width, height, is_premium, is_featured, is_colorizable, default_color, has_multiple_colors, tags, keywords, style, price) VALUES
('Pizza Slice', 'pizza-slice', 'Delicious pizza slice', 'Food', 'Fast Food', 'https://www.svgrepo.com/show/13671/pizza.svg', 'https://www.svgrepo.com/show/13671/pizza.svg', 'https://www.svgrepo.com/show/13671/pizza.svg', '0 0 512 512', 512, 512, false, true, true, '#fbbf24', true, ARRAY['pizza', 'food', 'italian'], ARRAY['pizza', 'food', 'slice'], 'Modern', 0),
('Coffee Cup', 'coffee-cup', 'Hot coffee cup', 'Food', 'Beverages', 'https://www.svgrepo.com/show/13671/coffee.svg', 'https://www.svgrepo.com/show/13671/coffee.svg', 'https://www.svgrepo.com/show/13671/coffee.svg', '0 0 512 512', 512, 512, false, true, true, '#92400e', false, ARRAY['coffee', 'drink', 'beverage'], ARRAY['coffee', 'cafe', 'cup'], 'Minimalist', 0),
('Burger', 'burger', 'Classic hamburger', 'Food', 'Fast Food', 'https://www.svgrepo.com/show/13671/burger.svg', 'https://www.svgrepo.com/show/13671/burger.svg', 'https://www.svgrepo.com/show/13671/burger.svg', '0 0 512 512', 512, 512, false, false, true, '#fbbf24', true, ARRAY['burger', 'food', 'fastfood'], ARRAY['burger', 'hamburger', 'food'], 'Modern', 0),
('Ice Cream', 'ice-cream', 'Sweet ice cream cone', 'Food', 'Desserts', 'https://www.svgrepo.com/show/13671/icecream.svg', 'https://www.svgrepo.com/show/13671/icecream.svg', 'https://www.svgrepo.com/show/13671/icecream.svg', '0 0 512 512', 512, 512, false, true, true, '#f9a8d4', true, ARRAY['icecream', 'dessert', 'sweet'], ARRAY['icecream', 'dessert', 'cone'], 'Hand-drawn', 0),
('Cupcake', 'cupcake', 'Cute cupcake', 'Food', 'Desserts', 'https://www.svgrepo.com/show/13671/cupcake.svg', 'https://www.svgrepo.com/show/13671/cupcake.svg', 'https://www.svgrepo.com/show/13671/cupcake.svg', '0 0 512 512', 512, 512, false, false, true, '#ec4899', true, ARRAY['cupcake', 'dessert', 'sweet'], ARRAY['cupcake', 'cake', 'bakery'], 'Hand-drawn', 0),
('Donut', 'donut', 'Glazed donut', 'Food', 'Desserts', 'https://www.svgrepo.com/show/13671/donut.svg', 'https://www.svgrepo.com/show/13671/donut.svg', 'https://www.svgrepo.com/show/13671/donut.svg', '0 0 512 512', 512, 512, false, false, true, '#f97316', true, ARRAY['donut', 'dessert', 'sweet'], ARRAY['donut', 'food', 'bakery'], 'Modern', 0),
('Apple', 'apple', 'Fresh red apple', 'Food', 'Fruits', 'https://www.svgrepo.com/show/13671/apple.svg', 'https://www.svgrepo.com/show/13671/apple.svg', 'https://www.svgrepo.com/show/13671/apple.svg', '0 0 512 512', 512, 512, false, false, true, '#dc2626', false, ARRAY['apple', 'fruit', 'healthy'], ARRAY['apple', 'fruit', 'red'], 'Minimalist', 0),
('Banana', 'banana', 'Yellow banana', 'Food', 'Fruits', 'https://www.svgrepo.com/show/13671/banana.svg', 'https://www.svgrepo.com/show/13671/banana.svg', 'https://www.svgrepo.com/show/13671/banana.svg', '0 0 512 512', 512, 512, false, false, true, '#facc15', false, ARRAY['banana', 'fruit', 'tropical'], ARRAY['banana', 'fruit', 'yellow'], 'Minimalist', 0),
('Strawberry', 'strawberry', 'Sweet strawberry', 'Food', 'Fruits', 'https://www.svgrepo.com/show/13671/strawberry.svg', 'https://www.svgrepo.com/show/13671/strawberry.svg', 'https://www.svgrepo.com/show/13671/strawberry.svg', '0 0 512 512', 512, 512, false, false, true, '#ef4444', false, ARRAY['strawberry', 'fruit', 'berry'], ARRAY['strawberry', 'fruit', 'red'], 'Hand-drawn', 0),
('Wine Glass', 'wine-glass', 'Elegant wine glass', 'Food', 'Beverages', 'https://www.svgrepo.com/show/13671/wine.svg', 'https://www.svgrepo.com/show/13671/wine.svg', 'https://www.svgrepo.com/show/13671/wine.svg', '0 0 512 512', 512, 512, true, false, true, '#7c2d12', false, ARRAY['wine', 'glass', 'drink'], ARRAY['wine', 'alcohol', 'beverage'], 'Minimalist', 200);

```

Command completed.

The previous shell command ended, so on the next invocation of this tool, you will be reusing the shell.

On the next terminal tool call, the directory of the shell will already be /.

<system_reminder>
You haven't updated your TODO list recently. Consider calling todo_write to track progress and check off completed tasks.
</system_reminder></function_results>
<system_warning>Token usage: 198399/1000000; 801601 remaining</system_warning>

Bon ! Le fichier existe. Créons maintenant une version simplifiée et optimisée pour Supabase. Lisons le fichier complet pour voir combien de cliparts il contient :

<function_calls>
<invoke name="run_terminal_cmd">
<parameter name="command">grep -c "INSERT INTO public.cliparts" /Users/emmanuelabougadous/luneo-platform/seed-cliparts.sql


