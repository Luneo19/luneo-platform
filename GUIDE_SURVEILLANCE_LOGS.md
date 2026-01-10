# 🔍 GUIDE SURVEILLANCE LOGS RAILWAY

**Date** : 10 Janvier 2025  
**Guide pratique pour surveiller le build Railway**

---

## 🎯 OBJECTIF

Surveiller attentivement les logs Railway pour détecter et corriger rapidement toute erreur de build ou runtime.

---

## 📋 CHECKLIST DE SURVEILLANCE

### Phase 1 : Build (5-10 minutes)

**✅ Indicateurs de succès** :
```
✅ "Successfully built"
✅ "Build completed"
✅ "Starting application"
✅ "Application started"
```

**❌ Erreurs à surveiller** :
```
❌ "Module not found"
❌ "Cannot find module"
❌ "Error:"
❌ "Failed to"
❌ "TypeError"
❌ "SyntaxError"
❌ "Dependency injection"
❌ "Nest can't resolve dependencies"
```

### Phase 2 : Runtime (après démarrage)

**✅ Indicateurs de succès** :
```
✅ "Nest application successfully started"
✅ "Application is running on"
✅ "Listening on port"
✅ "Health check passed"
```

**❌ Erreurs à surveiller** :
```
❌ "Error:"
❌ "Failed to"
❌ "Cannot connect"
❌ "ECONNREFUSED"
❌ "500 Internal Server Error"
❌ "Database connection failed"
```

---

## 🔍 POINTS DE VIGILANCE SPÉCIFIQUES

### 1. DiscountService
**Erreur attendue** :
```
Cannot find module './services/discount.service'
```
**Action** : Vérifier que le fichier existe et est commité

### 2. StorageService
**Erreur attendue** :
```
Nest can't resolve dependencies of ArStudioService (..., StorageService)
```
**Action** : Vérifier que StorageModule est importé dans ArStudioModule

### 3. useAuth Hook
**Erreur attendue** :
```
API_BASE_URL is not defined
```
**Action** : Vérifier que NEXT_PUBLIC_API_URL est définie dans Vercel

---

## 🛠️ ACTIONS IMMÉDIATES EN CAS D'ERREUR

1. **Copier l'erreur complète** depuis les logs Railway
2. **Consulter** `ACTIONS_CORRECTIVES.md` pour la solution
3. **Appliquer** la correction
4. **Re-commiter** et re-déployer
5. **Surveiller** à nouveau les logs

---

## 📊 TIMELINE ATTENDUE

- **0-2 min** : Installation des dépendances
- **2-5 min** : Génération Prisma Client
- **5-10 min** : Build TypeScript/NestJS
- **10-12 min** : Démarrage de l'application
- **12+ min** : Application en cours d'exécution

---

## 🚨 ALERTES CRITIQUES

Si vous voyez ces erreurs, **action immédiate requise** :

1. **"Module not found"** → Vérifier les imports
2. **"Dependency injection"** → Vérifier les modules
3. **"Build failed"** → Vérifier TypeScript
4. **"Application crashed"** → Vérifier les logs runtime

---

## 📝 NOTES IMPORTANTES

- Les erreurs de build apparaissent généralement dans les **premières 10 minutes**
- Les erreurs runtime apparaissent **après le démarrage**
- Surveiller **au moins 15 minutes** après le push
- Consulter les logs **complets**, pas seulement les erreurs

---

**🔍 Surveillance active - Prêt à analyser les logs Railway !**

*Guide créé le 10 Janvier 2025*
