# 📚 Documentation API tRPC

## Vue d'ensemble

Cette documentation décrit tous les endpoints tRPC disponibles dans l'application Luneo.

---

## 🔐 Authentification

Tous les endpoints protégés nécessitent une authentification via Supabase. Le token est automatiquement inclus dans les headers.

---

## 📦 Routers Disponibles

### 1. Customization Router (`trpc.customization`)

Gestion des personnalisations de produits.

#### `generate`
Génère une personnalisation depuis un prompt utilisateur.

**Input:**
```typescript
{
  productId: string;
  zoneId: string;
  prompt: string;
  font?: string;
  color?: string;
  size?: number;
  effect?: 'NORMAL' | 'EMBOSSED' | 'ENGRAVED' | 'THREE_D';
  orientation?: 'horizontal' | 'vertical' | 'curved';
  options?: Record<string, any>;
}
```

**Output:**
```typescript
{
  id: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  previewUrl?: string;
  modelUrl?: string;
  jobId?: string;
}
```

**Exemple:**
```typescript
const result = await trpc.customization.generate.mutate({
  productId: 'prod_123',
  zoneId: 'zone_456',
  prompt: 'Hello World',
  font: 'Arial',
  color: '#FF0000',
  size: 24,
});
```

#### `getById`
Récupère une personnalisation par ID.

**Input:**
```typescript
{ id: string }
```

**Output:**
```typescript
{
  id: string;
  name?: string;
  prompt: string;
  status: string;
  previewUrl?: string;
  modelUrl?: string;
  // ... autres champs
}
```

#### `getZonesByProduct`
Récupère toutes les zones d'un produit.

**Input:**
```typescript
{ productId: string }
```

**Output:**
```typescript
Array<{
  id: string;
  name: string;
  type: 'TEXT' | 'IMAGE' | 'PATTERN' | 'COLOR';
  // ... autres champs
}>
```

---

### 2. Product Router (`trpc.product`)

Gestion des produits.

#### `list`
Liste tous les produits avec pagination et filtres.

**Input:**
```typescript
{
  limit?: number;
  offset?: number;
  search?: string;
  category?: string;
}
```

**Output:**
```typescript
{
  products: Array<Product>;
  total: number;
  hasMore: boolean;
}
```

#### `getById`
Récupère un produit par ID.

**Input:**
```typescript
{ id: string }
```

**Output:**
```typescript
Product & {
  zones: Zone[];
  brand: Brand;
}
```

#### `create`
Crée un nouveau produit.

**Input:**
```typescript
{
  name: string;
  description?: string;
  category?: string;
  price?: number;
  // ... autres champs
}
```

#### `update`
Met à jour un produit.

**Input:**
```typescript
{
  id: string;
  name?: string;
  description?: string;
  // ... autres champs
}
```

#### `delete`
Supprime un produit.

**Input:**
```typescript
{ id: string }
```

---

### 3. Order Router (`trpc.order`)

Gestion des commandes.

#### `create`
Crée une nouvelle commande.

**Input:**
```typescript
{
  items: Array<{
    productId: string;
    productName: string;
    customizationId?: string;
    designId?: string;
    quantity: number;
    price: number;
    totalPrice: number;
    metadata?: Record<string, any>;
  }>;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: ShippingAddress;
  paymentMethodId?: string;
  customerNotes?: string;
  metadata?: Record<string, any>;
}
```

**Output:**
```typescript
{
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  // ... autres champs
}
```

#### `list`
Liste les commandes avec filtres et pagination.

**Input:**
```typescript
{
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
```

#### `getById`
Récupère une commande par ID.

#### `update`
Met à jour une commande.

#### `cancel`
Annule une commande.

#### `generateProductionFiles`
Génère les fichiers de production pour une commande.

**Input:**
```typescript
{
  orderId: string;
  formats?: string[];
  quality?: 'standard' | 'high' | 'print-ready';
  cmyk?: boolean;
}
```

**Output:**
```typescript
{
  jobId: string;
  status: string;
  files: Array<{ url: string; format: string }>;
  progress: number;
}
```

#### `checkProductionStatus`
Vérifie le statut d'un job de production.

**Input:**
```typescript
{ jobId: string }
```

---

### 4. Billing Router (`trpc.billing`)

Gestion de la facturation et des abonnements.

#### `getSubscription`
Récupère l'abonnement actuel.

#### `updateSubscription`
Met à jour l'abonnement.

#### `cancelSubscription`
Annule l'abonnement.

#### `listInvoices`
Liste les factures.

#### `getInvoice`
Récupère une facture par ID.

#### `downloadInvoice`
Télécharge une facture en PDF.

#### `getUsageMetrics`
Récupère les métriques d'utilisation.

#### `getBillingLimits`
Récupère les limites du plan.

#### `listPaymentMethods`
Liste les méthodes de paiement.

#### `addPaymentMethod`
Ajoute une méthode de paiement.

#### `removePaymentMethod`
Supprime une méthode de paiement.

#### `setDefaultPaymentMethod`
Définit la méthode de paiement par défaut.

---

### 5. Analytics Router (`trpc.analytics`)

Analytics et statistiques.

#### `getDashboardStats`
Statistiques du dashboard.

#### `getProductStats`
Statistiques par produit.

#### `getCustomizationStats`
Statistiques des personnalisations.

#### `getOrderStats`
Statistiques des commandes.

#### `getRevenueStats`
Statistiques de revenus.

#### `getARStats`
Statistiques AR.

---

### 6. Notification Router (`trpc.notification`)

Gestion des notifications.

#### `list`
Liste les notifications.

#### `markAsRead`
Marque une notification comme lue.

#### `markAllAsRead`
Marque toutes les notifications comme lues.

#### `delete`
Supprime une notification.

#### `getPreferences`
Récupère les préférences de notification.

#### `updatePreferences`
Met à jour les préférences.

---

### 7. AR Router (`trpc.ar`)

Gestion AR.

#### `createSession`
Crée une session AR.

#### `trackInteraction`
Enregistre une interaction AR.

#### `getProductAnalytics`
Récupère les analytics AR d'un produit.

#### `listModels`
Liste les modèles AR.

---

### 8. Team Router (`trpc.team`)

Gestion d'équipe.

#### `listMembers`
Liste les membres de l'équipe.

#### `inviteMember`
Invite un nouveau membre.

#### `updateMemberRole`
Met à jour le rôle d'un membre.

#### `removeMember`
Supprime un membre.

#### `cancelInvite`
Annule une invitation.

---

### 9. Library Router (`trpc.library`)

Gestion de la bibliothèque de templates.

#### `listTemplates`
Liste les templates.

#### `getTemplate`
Récupère un template par ID.

---

### 10. Design Router (`trpc.design`)

Gestion des versions de designs.

#### `listVersions`
Liste les versions d'un design.

#### `createVersion`
Crée une nouvelle version.

#### `restoreVersion`
Restaure une version.

#### `deleteVersion`
Supprime une version.

---

### 11. Profile Router (`trpc.profile`)

Gestion du profil utilisateur.

#### `get`
Récupère le profil.

#### `update`
Met à jour le profil.

#### `changePassword`
Change le mot de passe.

#### `uploadAvatar`
Upload un avatar.

---

### 12. AI Router (`trpc.ai`)

Génération IA.

#### `generate`
Génère un design avec IA.

#### `listGenerated`
Liste les designs générés.

---

### 13. AB Testing Router (`trpc.abTesting`)

Tests A/B.

#### `list`
Liste les expériences A/B.

#### `create`
Crée une expérience A/B.

#### `update`
Met à jour une expérience A/B.

---

## 🔗 Utilisation

### Client React (Hooks)

```typescript
import { trpc } from '@/lib/trpc/client';

// Query
const { data, isLoading } = trpc.product.getById.useQuery({ id: 'prod_123' });

// Mutation
const createMutation = trpc.order.create.useMutation({
  onSuccess: (data) => {
    console.log('Order created:', data);
  },
});

createMutation.mutate({
  items: [...],
  shippingAddress: {...},
});
```

### Client Vanilla (Services)

```typescript
import { trpcVanilla } from '@/lib/trpc/vanilla-client';

const order = await trpcVanilla.order.create.mutate({
  items: [...],
  shippingAddress: {...},
});
```

---

## 🛡️ Gestion d'erreurs

Tous les endpoints utilisent `TRPCError` avec des codes standardisés :

- `UNAUTHORIZED` - Non authentifié
- `FORBIDDEN` - Pas de permission
- `NOT_FOUND` - Ressource introuvable
- `BAD_REQUEST` - Requête invalide
- `INTERNAL_SERVER_ERROR` - Erreur serveur

---

## 📝 Notes

- Tous les endpoints sont typés avec TypeScript
- La validation est effectuée avec Zod
- Les erreurs sont loggées automatiquement
- Les réponses sont standardisées avec `ApiResponseBuilder`

---

*Dernière mise à jour: $(date)*

