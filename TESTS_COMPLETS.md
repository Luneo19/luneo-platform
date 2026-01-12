# 🧪 TESTS COMPLETS - LUNEO PLATFORM

## ✅ Tests Créés

### Backend - Tests Unitaires

#### 1. TwoFactorService Tests ✅
**Fichier:** `apps/backend/src/modules/auth/services/two-factor.service.spec.ts`

**Tests couverts:**
- ✅ Génération de secret 2FA
- ✅ Génération QR Code
- ✅ Vérification de token TOTP
- ✅ Génération de codes de backup
- ✅ Validation de codes de backup
- ✅ Case insensitive pour codes de backup

**Commande:**
```bash
cd apps/backend
npm test -- two-factor.service.spec.ts
```

#### 2. BruteForceService Tests ✅
**Fichier:** `apps/backend/src/modules/auth/services/brute-force.service.spec.ts`

**Tests couverts:**
- ✅ Vérification des tentatives (canAttempt)
- ✅ Enregistrement des tentatives échouées
- ✅ Réinitialisation après succès
- ✅ Calcul du temps restant
- ✅ Exception TooManyRequestsException
- ✅ Mode dégradé si Redis indisponible

**Commande:**
```bash
cd apps/backend
npm test -- brute-force.service.spec.ts
```

### Frontend - Tests E2E (Playwright)

#### 3. Login 2FA Flow Tests ✅
**Fichier:** `apps/frontend/src/app/(auth)/login/login.e2e.spec.ts`

**Tests couverts:**
- ✅ Affichage du formulaire de login
- ✅ Gestion des erreurs d'identifiants invalides
- ✅ Affichage du formulaire 2FA quand requis
- ✅ Validation de la longueur du code 2FA
- ✅ Flow complet de connexion avec 2FA

**Commande:**
```bash
cd apps/frontend
npm run test:e2e -- login.e2e.spec.ts
```

#### 4. Security Settings Tests ✅
**Fichier:** `apps/frontend/src/app/(dashboard)/settings/security/security.e2e.spec.ts`

**Tests couverts:**
- ✅ Affichage de la page de sécurité
- ✅ Bouton de configuration 2FA quand désactivé
- ✅ Affichage du QR Code lors de la configuration
- ✅ Vérification et activation de la 2FA
- ✅ Désactivation de la 2FA

**Commande:**
```bash
cd apps/frontend
npm run test:e2e -- security.e2e.spec.ts
```

## 📊 Coverage Cible

### Backend
- **Lignes:** 80%
- **Fonctions:** 75%
- **Branches:** 70%

### Frontend
- **Lignes:** 70%
- **Fonctions:** 65%
- **Branches:** 60%

## 🚀 Exécution des Tests

### Tous les tests
```bash
# Backend
cd apps/backend
npm test

# Frontend
cd apps/frontend
npm run test:all
```

### Tests avec coverage
```bash
# Backend
cd apps/backend
npm run test:cov

# Frontend
cd apps/frontend
npm run test:coverage
```

### Tests E2E uniquement
```bash
cd apps/frontend
npm run test:e2e
```

## 📝 Tests Manuels Recommandés

### 1. Flow 2FA Complet
1. Créer un compte
2. Se connecter
3. Aller dans Paramètres > Sécurité
4. Configurer la 2FA
5. Scanner le QR Code avec Google Authenticator
6. Entrer le code de vérification
7. Sauvegarder les codes de backup
8. Se déconnecter
9. Se reconnecter avec code 2FA
10. Tester avec un code de backup

### 2. Protection Brute Force
1. Essayer de se connecter 5 fois avec un mauvais mot de passe
2. Vérifier que le 6ème essai est bloqué
3. Attendre 15 minutes ou réinitialiser via Redis
4. Vérifier que la connexion fonctionne à nouveau

### 3. Analytics Avancés
1. Créer des données de test (commandes, designs, etc.)
2. Appeler `/api/v1/analytics/advanced/funnel`
3. Vérifier les métriques de conversion
4. Appeler `/api/v1/analytics/advanced/cohort`
5. Vérifier les données de rétention

## 🔧 Configuration CI/CD

Les tests sont automatiquement exécutés dans:
- `.github/workflows/ci.yml` (Backend)
- `apps/frontend/.github/workflows/ci.yml` (Frontend)

## ✅ Checklist Tests

- [x] Tests unitaires TwoFactorService
- [x] Tests unitaires BruteForceService
- [x] Tests E2E Login avec 2FA
- [x] Tests E2E Security Settings
- [ ] Tests d'intégration Auth complète (à créer)
- [ ] Tests de performance (à créer)
- [ ] Tests de charge brute force (à créer)

---

*Dernière mise à jour: $(date)*
