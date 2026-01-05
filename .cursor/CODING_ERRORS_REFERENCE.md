# 📚 RÉFÉRENCE RAPIDE - ERREURS DE CODAGE

**Ce fichier référence le document complet des erreurs : `docs/CODING_ERRORS_REGISTRY.md`**

## ⚠️ ERREURS CRITIQUES À ÉVITER

### JSX Structurelles
- ❌ **TS17008** : Balises JSX non fermées
- ❌ **TS17002** : Balises de fermeture manquantes ou mal placées
- ❌ **TS1381** : Tokens JSX inattendus (accolades mal formées)
- ❌ **TS2657** : Expressions JSX nécessitant un élément parent

**Solution :** Toujours vérifier que toutes les balises sont fermées correctement.

### Architecture
- ❌ **Composants > 300 lignes** (Règle CURSOR #1, #46)
- ❌ **`'use client'` au mauvais niveau** (Règle CURSOR #7, #15, #40)
- ❌ **Data fetching dans Client Components** (Règle CURSOR #44)
- ❌ **APIs browser sans protection** (Règle CURSOR #18, #45)

### TypeScript
- ❌ **Utilisation de `any`** (Règle CURSOR #23, #42)
- ❌ **Types de props non explicites** (Règle CURSOR #24)

### Build
- ❌ **Masquer les erreurs de build** (Règle CURSOR #30, #32)
- ❌ **Dépendances circulaires** (Règle CURSOR #2, #47)

### Performance
- ❌ **Librairies lourdes non dynamiques** (Règle CURSOR #16, #19, #20)

---

## ✅ CHECKLIST RAPIDE

Avant chaque modification de code :

- [ ] Toutes les balises JSX sont fermées ?
- [ ] Le composant fait < 300 lignes ?
- [ ] Aucun `any` dans le code ?
- [ ] `'use client'` est au niveau le plus bas ?
- [ ] Pas de data fetching dans Client Components ?
- [ ] APIs browser protégées avec `typeof window` ?
- [ ] Le build passe (`pnpm build`) ?

---

**Pour plus de détails, consulter : `docs/CODING_ERRORS_REGISTRY.md`**



