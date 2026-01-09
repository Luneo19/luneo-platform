# ⚡ TEST RAPIDE HOMEPAGE

## 🔥 Démarrage Rapide

```bash
# Terminal 1 - Backend
cd apps/backend
npm run start:dev

# Terminal 2 - Frontend  
cd apps/frontend
npm run dev
```

## 🧪 Test Option 1 : Remplacer Directement

```bash
cd apps/frontend/src/app/\(public\)
cp page.tsx page-old-backup.tsx  # Backup
cp page-new.tsx page.tsx         # Utiliser nouvelle version
```

Puis accéder à : **http://localhost:3000/**

## 🧪 Test Option 2 : Route de Test

```bash
cd apps/frontend/src/app
mkdir -p test-homepage
cp \(public\)/page-new.tsx test-homepage/page.tsx
```

Puis accéder à : **http://localhost:3000/test-homepage**

## ✅ Validation Rapide

- [ ] Page charge sans erreur
- [ ] Hero section visible avec gradient
- [ ] Sections s'affichent au scroll
- [ ] Animations fonctionnent
- [ ] Liens cliquables
- [ ] Responsive OK

## 📝 Commandes Utiles

```bash
# Vérifier erreurs TypeScript
cd apps/frontend && npm run type-check | grep -i "page-new\|marketing\|animations"

# Vérifier lint
cd apps/frontend && npm run lint | grep -i "page-new\|marketing\|animations"
```

