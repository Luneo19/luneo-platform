# AGENT-19: Integrations E-commerce

**Objectif**: Completer les integrations e-commerce (Shopify bidirectionnel, WooCommerce, PrestaShop) pour la synchronisation produits/commandes/inventaire

**Priorité**: P1  
**Complexité**: 3/5  
**Estimation**: 5-8 jours  
**Dépendances**: AGENT-09 (Orders), AGENT-08 (Products)

---

## 📋 SCOPE

### Integrations Cibles

| Integration | Etat actuel | Manquant |
|-------------|-------------|----------|
| Shopify | OAuth + structure sync | Sync bidirectionnel complet |
| WooCommerce | Plugin basique | Webhook handling avance |
| PrestaShop | Service existant | Tests et validation |

### Fichiers Cles

- `apps/backend/src/modules/integrations/shopify/shopify.service.ts`
- `apps/backend/src/modules/integrations/shopify/shopify.controller.ts`
- `apps/backend/src/modules/integrations/services/webhook-processor.service.ts`
- `apps/backend/src/modules/integrations/prestashop/prestashop.service.ts`
- `apps/backend/src/modules/ecommerce/`
- `woocommerce-plugin/`

---

## ✅ TÂCHES

### Phase 1: Shopify Sync Bidirectionnel (3-5 jours)

- [ ] Implementer sync produits Luneo -> Shopify (creation/maj/suppression)
- [ ] Implementer sync produits Shopify -> Luneo (via webhooks)
- [ ] Implementer sync commandes Shopify -> Luneo
- [ ] Implementer sync inventaire bidirectionnel
- [ ] Gerer les conflits de sync (timestamp-based resolution)
- [ ] Ajouter queue BullMQ pour les syncs asynchrones
- [ ] Tester le flow complet : creer produit Luneo -> apparait dans Shopify -> commande Shopify -> apparait dans Luneo

### Phase 2: WooCommerce Webhooks (2-3 jours)

- [ ] Completer le handling des webhooks WooCommerce (product.created, product.updated, order.created)
- [ ] Implementer la verification de signature webhook
- [ ] Ajouter retry logic pour les webhooks echoues
- [ ] Tester avec le plugin WooCommerce

### Phase 3: Verification et Documentation (1 jour)

- [ ] Tester chaque integration end-to-end
- [ ] Documenter les env vars necessaires par integration
- [ ] Verifier la gestion d'erreurs (rate limiting Shopify, timeouts, etc.)

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Sync Bidirectionnel Shopify

```typescript
// Pattern sync avec detection de conflits
async syncProductToShopify(product: Product) {
  const shopifyProduct = await this.shopify.product.get(product.externalId);
  
  if (shopifyProduct.updated_at > product.lastSyncAt) {
    // Conflit : Shopify a ete modifie depuis le dernier sync
    await this.resolveConflict(product, shopifyProduct);
    return;
  }
  
  await this.shopify.product.update(product.externalId, {
    title: product.name,
    body_html: product.description,
    variants: product.variants.map(v => ({
      price: v.price,
      inventory_quantity: v.stock,
    })),
  });
  
  await this.prisma.product.update({
    where: { id: product.id },
    data: { lastSyncAt: new Date() },
  });
}
```

### Queue Async

```typescript
// Utiliser BullMQ pour les syncs lourds
@Processor('integration-sync')
export class IntegrationSyncProcessor {
  @Process('shopify-product-sync')
  async handleProductSync(job: Job) {
    const { productId, direction } = job.data;
    // ...
  }
}
```

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **Shopify** : Sync bidirectionnel fonctionnel (produits + commandes + inventaire)
- [ ] **WooCommerce** : Webhooks traites correctement avec retry
- [ ] **Conflits** : Resolution automatique sans perte de donnees
- [ ] **Performance** : Sync de 1000 produits en < 5 minutes
- [ ] **Resilience** : Gestion des rate limits et timeouts

---

## 🔗 RESSOURCES

- Shopify : `apps/backend/src/modules/integrations/shopify/`
- WooCommerce : `woocommerce-plugin/` + `apps/backend/src/modules/ecommerce/`
- PrestaShop : `apps/backend/src/modules/integrations/prestashop/`
- Webhook processor : `apps/backend/src/modules/integrations/services/webhook-processor.service.ts`

---

## 📝 NOTES

- Shopify rate limit : 2 requests/seconde (utiliser throttling)
- WooCommerce : verifier la compatibilite v3 API
- Les syncs doivent etre idempotents (meme webhook traite 2x = meme resultat)
- Ajouter des metriques de sync (derniere sync, erreurs, produits synces)
