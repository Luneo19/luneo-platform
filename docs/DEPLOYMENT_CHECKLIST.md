# ✅ Checklist de Déploiement

**Date:** Décembre 2024  
**Objectif:** Vérifier que tout est prêt pour le déploiement

---

## 📋 Pré-déploiement

### **1. Installation Dépendances**
```bash
# Root
npm install

# Frontend
cd apps/frontend
npm install
```

### **2. Variables d'Environnement**

Vérifier que `.env.local` contient:
- [ ] `NEXT_PUBLIC_APP_URL` (production URL)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `SENDGRID_API_KEY` (si utilisé)

### **3. Build de Production**
```bash
cd apps/frontend
npm run build
```

**Vérifications:**
- [ ] Build réussi sans erreurs
- [ ] Pas d'erreurs TypeScript
- [ ] Pas d'erreurs critiques ESLint
- [ ] Taille du build acceptable

### **4. Tests Locaux**

**Responsive:**
- [ ] Mobile (375px, 414px)
- [ ] Tablet (768px, 1024px)
- [ ] Desktop (1280px, 1920px)

**Fonctionnalités:**
- [ ] Navigation complète
- [ ] Toutes les pages chargent
- [ ] APIs fonctionnelles
- [ ] Notifications fonctionnent
- [ ] Infinite scroll fonctionne
- [ ] Dark theme cohérent

---

## 🚀 Déploiement Vercel

### **Option 1: Via Dashboard**

1. Aller sur https://vercel.com
2. Connecter le repository GitHub
3. Configurer le projet:
   - **Root Directory:** `apps/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. Ajouter les variables d'environnement
5. Déployer

### **Option 2: Via CLI**

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
cd apps/frontend
vercel --prod
```

---

## ✅ Post-déploiement

### **Vérifications Immédiates**

- [ ] Site accessible
- [ ] Homepage charge correctement
- [ ] Navigation fonctionne
- [ ] Login/Register fonctionne
- [ ] Dashboard accessible
- [ ] APIs répondent

### **Tests Fonctionnels**

- [ ] Créer un compte
- [ ] Se connecter
- [ ] Accéder au dashboard
- [ ] Voir les notifications
- [ ] Naviguer entre les pages
- [ ] Tester responsive mobile

### **Performance**

- [ ] Temps de chargement acceptable
- [ ] Pas d'erreurs console
- [ ] Images chargent
- [ ] Lazy loading fonctionne

### **Monitoring**

- [ ] Configurer Sentry (si utilisé)
- [ ] Configurer analytics
- [ ] Vérifier les logs Vercel
- [ ] Configurer les alertes

---

## 🐛 En Cas de Problème

### **Build Échoue**
1. Vérifier les erreurs dans les logs
2. Vérifier les variables d'environnement
3. Vérifier les dépendances
4. Vérifier TypeScript errors

### **Site Ne Charge Pas**
1. Vérifier les variables d'environnement
2. Vérifier les logs Vercel
3. Vérifier la configuration Vercel
4. Vérifier le domaine DNS

### **APIs Ne Fonctionnent Pas**
1. Vérifier les variables Supabase
2. Vérifier les permissions
3. Vérifier les logs backend
4. Tester les routes API

---

## 📊 Métriques à Surveiller

- **Temps de chargement:** < 3s
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Erreurs 4xx/5xx:** < 1%
- **Uptime:** > 99.9%

---

## 📝 Notes

- Tester en staging avant production si possible
- Faire un rollback plan en cas de problème
- Documenter les changements
- Communiquer aux utilisateurs si nécessaire

---

**Status:** 📋 Checklist créée  
**Dernière mise à jour:** Décembre 2024

