# 🚀 Déploiement Vercel - Manuel

## 📋 Comment déployer sur Vercel

Par défaut, **les builds Vercel sont désactivés** pour éviter les déploiements automatiques non désirés.

### ✅ Pour déployer sur Vercel

Ajoutez `[deploy vercel]` dans votre message de commit :

```bash
git commit -m "fix: Correction bug [deploy vercel]"
git push
```

### ❌ Builds automatiques désactivés

Les commits normaux **ne déclencheront plus** de build Vercel :
- ✅ Builds Dependabot : ignorés
- ✅ Commits normaux : ignorés
- ✅ Seuls les commits avec `[deploy vercel]` : builds activés

### 📝 Exemples

**✅ Déploiera sur Vercel :**
```bash
git commit -m "feat: Nouvelle fonctionnalité [deploy vercel]"
git commit -m "fix: Correction [deploy vercel]"
```

**❌ Ne déploiera PAS sur Vercel :**
```bash
git commit -m "fix: Correction bug"
git commit -m "feat: Nouvelle fonctionnalité"
```

---

**Configuration** : `ignoreCommand` dans `vercel.json` ignore tous les builds sauf ceux avec `[deploy vercel]` dans le message de commit.
