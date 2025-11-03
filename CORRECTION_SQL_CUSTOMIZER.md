# ⚠️ **CORRECTION SQL CUSTOMIZER**

**Erreur détectée** : `relation "public.orders" does not exist`

## 🔧 **CORRECTION APPLIQUÉE**

Le SQL référençait la table `orders` qui peut ne pas exister dans certaines bases.

### **Solution** :
```sql
-- Avant (ERREUR):
order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,

-- Après (CORRIGÉ):
order_id UUID, -- FK optionnelle, sera ajoutée plus tard si needed
```

## ✅ **MAINTENANT**

Exécute le script corrigé : `supabase-customizer-system.sql`

**Il va créer** :
- ✅ Table `custom_designs` (designs customisés)
- ✅ Table `templates` (100+ templates pré-faits)
- ✅ Table `cliparts` (1000+ cliparts)

**Sans erreur !** 🎉

---

**📝 Note** : Si tu as déjà la table `orders` (du script précédent `supabase-orders-system.sql`), tu peux ajouter la contrainte FK manuellement après :

```sql
-- Optionnel: Ajouter FK si orders existe
ALTER TABLE public.custom_designs 
  ADD CONSTRAINT fk_custom_designs_order 
  FOREIGN KEY (order_id) 
  REFERENCES public.orders(id) 
  ON DELETE SET NULL;
```

Mais ce n'est **pas obligatoire** pour commencer !

