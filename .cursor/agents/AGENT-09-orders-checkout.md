# AGENT-09: Orders & Checkout

**Objectif**: Rendre le module Orders & Checkout production-ready avec gestion complète des commandes, intégration Stripe, et workflow complet

**Priorité**: P1 (Critique)  
**Complexité**: 4/5  
**Estimation**: 1-2 semaines  
**Dépendances**: AGENT-08 (Products), AGENT-11 (Billing)

---

## 📋 SCOPE

### Routes Concernées
- `/dashboard/orders` - Liste commandes (✅ existe, Server Component)
- `/dashboard/orders/[id]` - Détails commande (à créer/améliorer)
- `/checkout` - Page checkout (à créer si publique)
- `/dashboard/orders/[id]/invoice` - Facture (à créer)

### Composants Existants
- `apps/frontend/src/app/(dashboard)/dashboard/orders/page.tsx` (✅ Server Component)
- `apps/frontend/src/app/(dashboard)/dashboard/orders/orders-page-client.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/orders/components/`
  - `orders-list.tsx`
  - `orders-stats.tsx`
  - `orders-filters.tsx`
  - `order-detail-dialog.tsx`
  - `order-row.tsx`

### API Endpoints Requis

#### Backend (NestJS)
- `GET /api/v1/orders` - Liste commandes (✅ existe)
- `GET /api/v1/orders/:id` - Détails commande (✅ existe)
- `POST /api/v1/orders` - Créer commande (✅ existe)
- `POST /api/v1/orders/:id/cancel` - Annuler commande (✅ existe)
- `POST /api/v1/orders/:id/refund` - Rembourser (à créer)
- `POST /api/v1/orders/:id/fulfill` - Marquer comme expédié (à créer)
- `GET /api/v1/orders/:id/invoice` - Générer facture (à créer)

#### Frontend API Routes
- `GET /api/orders` - Proxy vers backend (✅ existe)
- `GET /api/orders/list` - Liste avec filtres (✅ existe)
- `POST /api/orders` - Créer commande (à créer)
- `GET /api/orders/[id]` - Détails (à créer)
- `POST /api/orders/[id]/cancel` - Annuler (à créer)

#### Stripe Integration
- `POST /api/billing/create-checkout-session` - Créer session Stripe (✅ existe)
- `POST /api/stripe/webhook` - Webhook Stripe (✅ existe)

---

## ✅ TÂCHES

### Phase 1: Amélioration Liste Commandes (2 jours)

- [ ] Analyser la page actuelle (Server Component)
- [ ] Améliorer filtres:
  - [ ] Par statut (CREATED, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
  - [ ] Par date (début/fin)
  - [ ] Par montant
  - [ ] Recherche (numéro commande, email client)
- [ ] Améliorer pagination:
  - [ ] Pagination infinie OU pagination classique
  - [ ] Limite configurable (10, 20, 50, 100)
- [ ] Ajouter tri (date, montant, statut)
- [ ] Améliorer stats en temps réel
- [ ] Ajouter export CSV/JSON

### Phase 2: Page Détails Commande (2 jours)

- [ ] Créer page `/dashboard/orders/[id]/page.tsx`
  - [ ] Informations commande complètes
  - [ ] Items de commande (OrderItems)
  - [ ] Historique statuts (timeline)
  - [ ] Informations client
  - [ ] Informations paiement (Stripe)
  - [ ] Informations livraison
  - [ ] Notes internes
- [ ] Tabs:
  - [ ] Overview (détails généraux)
  - [ ] Items (liste items avec designs)
  - [ ] Payment (détails paiement)
  - [ ] Shipping (livraison)
  - [ ] History (timeline)
- [ ] Actions:
  - [ ] Annuler commande
  - [ ] Rembourser
  - [ ] Marquer comme expédié
  - [ ] Générer facture
  - [ ] Envoyer email client
  - [ ] Dupliquer commande

### Phase 3: Workflow Checkout (3 jours)

- [ ] Créer/modifier workflow checkout
  - [ ] Panier (si applicable)
  - [ ] Page checkout:
    - [ ] Récapitulatif commande
    - [ ] Informations livraison
    - [ ] Méthode de paiement
    - [ ] Intégration Stripe Checkout
  - [ ] Page succès (`/checkout/success`)
  - [ ] Page annulation (`/checkout/cancel`)
- [ ] Intégration Stripe:
  - [ ] Session checkout
  - [ ] Payment Intent (si nécessaire)
  - [ ] Webhook pour mettre à jour statut
- [ ] Gestion stock (si applicable)
- [ ] Génération production files

### Phase 4: Features Avancées (2 jours)

- [ ] Factures PDF
  - [ ] Template facture
  - [ ] Génération PDF (pdfkit/jspdf)
  - [ ] Téléchargement
- [ ] Emails automatiques:
  - [ ] Confirmation commande
  - [ ] Paiement reçu
  - [ ] Commande expédiée
  - [ ] Commande annulée
- [ ] Notifications temps réel:
  - [ ] Nouvelle commande
  - [ ] Paiement reçu
  - [ ] Statut changé
- [ ] Analytics commandes:
  - [ ] Métriques (revenus, volume, panier moyen)
  - [ ] Graphiques
  - [ ] Export données

### Phase 5: Intégrations & Tests (1-2 jours)

- [ ] Connecter tous les endpoints backend
- [ ] Tests unitaires hooks
- [ ] Tests E2E flux complet:
  - [ ] Créer commande → Paiement → Confirmation
  - [ ] Annuler commande
  - [ ] Rembourser commande
- [ ] Tests webhooks Stripe
- [ ] Gestion erreurs complète

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Structure Fichiers

```
apps/frontend/src/app/(dashboard)/dashboard/orders/
├── page.tsx                    # Liste (✅ Server Component)
├── [id]/
│   ├── page.tsx               # Détails (à créer)
│   └── invoice/
│       └── page.tsx           # Facture PDF (à créer)
└── components/
    ├── orders-list.tsx        # ✅ existe
    ├── orders-stats.tsx       # ✅ existe
    ├── orders-filters.tsx     # ✅ existe
    ├── order-detail.tsx       # À créer/améliorer
    ├── order-timeline.tsx     # À créer
    ├── order-items-list.tsx   # À créer
    └── invoice-pdf.tsx        # À créer
```

### Hooks

```typescript
// useOrders.ts (améliorer)
export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => api.orders.list(filters),
  });
}

// useOrder.ts (créer)
export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api.orders.get(id),
    enabled: !!id,
  });
}

// useCancelOrder.ts (créer)
export function useCancelOrder() {
  return useMutation({
    mutationFn: (id: string) => api.orders.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
    },
  });
}
```

### Schema Prisma (Order)

```prisma
model Order {
  id          String      @id @default(cuid())
  orderNumber String      @unique
  status      OrderStatus @default(CREATED)
  items       OrderItem[]  # Multi-items support
  // ... autres champs
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  designId  String?
  quantity  Int     @default(1)
  priceCents Int
  totalCents Int
  // ...
}
```

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] Liste commandes fonctionnelle avec filtres/tri/pagination
- [ ] Page détails complète avec toutes les informations
- [ ] Workflow checkout complet avec Stripe
- [ ] Génération factures PDF
- [ ] Emails automatiques fonctionnels
- [ ] Webhooks Stripe fonctionnels
- [ ] Tests E2E passent
- [ ] Performance: < 2s chargement liste
- [ ] UX: Feedback clair à chaque étape

---

## 🔗 RESSOURCES

- Page actuelle: `apps/frontend/src/app/(dashboard)/dashboard/orders/`
- Backend: `apps/backend/src/modules/orders/`
- Schema Prisma: `apps/backend/prisma/schema.prisma` (modèles Order, OrderItem)
- Stripe Docs: https://stripe.com/docs/payments/checkout
- Webhook handler: `apps/frontend/src/app/api/stripe/webhook/route.ts`

---

## 📝 NOTES

- La page liste est déjà en Server Component (bonne pratique)
- Support multi-items (OrderItem) déjà dans le schema
- Intégration Stripe déjà en place (checkout session)
- Prioriser la robustesse du workflow checkout (flux critique business)
- Gérer les cas edge (paiement échoué, timeout, etc.)



