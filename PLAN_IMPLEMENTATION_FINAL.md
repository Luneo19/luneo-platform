# Plan d'Implémentation Final

## Étape 1: Améliorer OrdersService pour gérer plusieurs items ✅ EN COURS

### Objectif
Permettre la création de commandes avec plusieurs items (OrderItem) au lieu d'un seul design.

### Modifications nécessaires:
1. Mettre à jour `OrdersService.create()` pour accepter un array d'items
2. Créer les OrderItem lors de la création de commande
3. Calculer le total basé sur tous les items
4. Générer les line_items Stripe pour tous les items
5. Mettre à jour `findOne()` pour inclure les items

### Schéma Prisma (déjà existant):
- `Order` a une relation `items OrderItem[]`
- `OrderItem` a `productId`, `designId`, `quantity`, `priceCents`, `totalCents`, `metadata`

---

## Étape 2: Implémenter les routes AI dans le backend

### Routes à créer:
1. `POST /ai/generate` - Génération d'images avec DALL-E
2. `POST /ai/upscale` - Amélioration de résolution
3. `POST /ai/background-removal` - Suppression de fond
4. `POST /ai/extract-colors` - Extraction de couleurs
5. `POST /ai/smart-crop` - Recadrage intelligent
6. `POST /ai/text-to-design` - Génération de design depuis texte

### Service existant:
- `AIStudioService` existe déjà dans `apps/backend/src/modules/ai/services/ai-studio.service.ts`
- Doit être étendu avec les méthodes manquantes

### Intégrations nécessaires:
- OpenAI API (DALL-E 3)
- Cloudinary (upscale, background removal)
- Sharp (extract colors, smart crop)

---

## Étape 3: Implémenter les routes billing/credits

### Routes credits:
1. `POST /credits/buy` - Créer une session Stripe Checkout pour acheter des crédits
   - Module credits existe déjà
   - Doit ajouter la méthode `buyCredits()` qui crée une session Stripe

### Routes billing:
1. `POST /billing/create-checkout-session` - Créer une session Stripe Checkout pour abonnement
   - `BillingService` existe déjà
   - Doit vérifier si la méthode existe ou la créer

---

## Étape 4: Tester toutes les routes

### Script de test:
- Utiliser `scripts/test-api-routes.sh` créé précédemment
- Ajouter les nouvelles routes au script

---

## Priorité
1. ⚡ OrdersService (critique pour le business)
2. ⚡ Routes AI (forte demande utilisateur)
3. ⚡ Routes billing/credits (monétisation)
4. ✅ Tests finaux
