# 🚀 Quick Start - Déploiement

**Guide rapide pour déployer après les optimisations**

---

## ⚡ Étapes Rapides

### **1. Installer les Dépendances**

```bash
# Depuis la racine du projet
npm install

# Puis dans frontend
cd apps/frontend
npm install
```

**Note:** Si erreur `workspace:*`, c'est normal pour un monorepo. Utiliser `npm install` depuis la racine.

---

### **2. Créer les Pull Requests**

**4 PRs à créer sur GitHub:**

1. **Phase 1** (Critique)
   - Lien: https://github.com/Luneo19/luneo-platform/pull/new/feature/critique-fixes
   - Description: Voir `docs/NEXT_STEPS.md`

2. **Phase 2** (Urgent)
   - Lien: https://github.com/Luneo19/luneo-platform/pull/new/feature/urgent-responsive
   - Description: Voir `docs/NEXT_STEPS.md`

3. **Phase 3** (Important)
   - Lien: https://github.com/Luneo19/luneo-platform/pull/new/feature/important-quality
   - Description: Voir `docs/NEXT_STEPS.md`

4. **Phase 4** (Finitions)
   - Lien: https://github.com/Luneo19/luneo-platform/pull/new/feature/finish-polish
   - Description: Documentation et guides

---

### **3. Merge les PRs**

**Ordre recommandé:**
1. Phase 1 → main
2. Phase 2 → main
3. Phase 3 → main
4. Phase 4 → main

---

### **4. Build Local (Optionnel)**

```bash
cd apps/frontend
npm run build
```

**Si erreur:** Vérifier que toutes les dépendances sont installées.

---

### **5. Déployer sur Vercel**

**Option A: Via Dashboard**
1. Aller sur https://vercel.com
2. Connecter le repo GitHub
3. Configurer:
   - Root: `apps/frontend`
   - Build: `npm run build`
   - Output: `.next`
4. Ajouter variables d'environnement
5. Déployer

**Option B: Via CLI**
```bash
npm i -g vercel
cd apps/frontend
vercel --prod
```

---

## ✅ Checklist Rapide

- [ ] Dépendances installées
- [ ] 4 PRs créées
- [ ] PRs mergées dans l'ordre
- [ ] Variables d'environnement configurées
- [ ] Déployé sur Vercel
- [ ] Site testé en production

---

## 🆘 En Cas de Problème

### **Erreur Installation**
- Utiliser `npm install` depuis la racine
- Vérifier Node.js version (>=18)

### **Erreur Build**
- Vérifier variables d'environnement
- Vérifier TypeScript errors
- Vérifier les dépendances

### **Erreur Déploiement**
- Vérifier configuration Vercel
- Vérifier variables d'environnement
- Vérifier les logs Vercel

---

## 📚 Documentation Complète

- `docs/NEXT_STEPS.md` - Guide détaillé
- `docs/DEPLOYMENT_CHECKLIST.md` - Checklist complète
- `scripts/prepare-deployment.sh` - Script automatique

---

**Status:** ✅ Prêt pour déploiement  
**Dernière mise à jour:** Décembre 2024

