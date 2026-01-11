# 📋 Checklist de Déploiement - Luneo Platform V2

## ✅ Pré-déploiement

### Backend (Railway)
- [ ] Variables d'environnement configurées dans Railway
  - [ ] `DATABASE_URL`
  - [ ] `REDIS_URL`
  - [ ] `OPENAI_API_KEY`
  - [ ] `ANTHROPIC_API_KEY`
  - [ ] `MISTRAL_API_KEY`
  - [ ] `SHOPIFY_CLIENT_ID`
  - [ ] `SHOPIFY_CLIENT_SECRET`
  - [ ] `JWT_SECRET`
  - [ ] `FRONTEND_URL`
- [ ] Migrations Prisma appliquées
- [ ] Tests unitaires passent (`npm test`)
- [ ] Build réussit (`npm run build`)
- [ ] Health check endpoint fonctionne (`/health`)

### Frontend (Vercel)
- [ ] Variables d'environnement configurées dans Vercel
  - [ ] `NEXT_PUBLIC_API_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] Build réussit (`npm run build`)
- [ ] Tests unitaires passent (`npm test`)
- [ ] Tests E2E passent (`npm run test:e2e`)

## 🚀 Déploiement

### Backend
1. [ ] Push sur `main` déclenche le CI/CD
2. [ ] Vérifier que le build passe dans GitHub Actions
3. [ ] Vérifier le déploiement sur Railway
4. [ ] Tester l'endpoint `/health`
5. [ ] Tester les endpoints `/agents/luna/chat`
6. [ ] Tester les endpoints `/integrations/shopify/auth`

### Frontend
1. [ ] Push sur `main` déclenche le CI/CD
2. [ ] Vérifier que le build passe dans GitHub Actions
3. [ ] Vérifier le déploiement sur Vercel
4. [ ] Tester la page d'accueil
5. [ ] Tester le widget Luna Chat
6. [ ] Tester le widget Aria
7. [ ] Tester le viewer AR

## 🧪 Tests Post-Déploiement

### Agents IA
- [ ] Luna Chat fonctionne dans le dashboard
- [ ] Aria Widget s'ouvre et propose des suggestions
- [ ] Les conversations sont sauvegardées
- [ ] Les actions Luna sont exécutables

### Intégrations E-commerce
- [ ] OAuth Shopify fonctionne
- [ ] Synchronisation des produits fonctionne
- [ ] Webhooks Shopify sont reçus
- [ ] Commandes avec personnalisation sont traitées

### AR
- [ ] ARViewer s'initialise correctement
- [ ] Face tracking fonctionne (si disponible)
- [ ] Hand tracking fonctionne (si disponible)
- [ ] Capture d'image fonctionne

### Analytics Prédictives
- [ ] Endpoints `/analytics/predictive/trends` fonctionnent
- [ ] Recommandations IA sont générées
- [ ] Détection d'anomalies fonctionne
- [ ] Événements saisonniers sont listés

## 📊 Monitoring

- [ ] Sentry configuré et fonctionne
- [ ] Logs sont accessibles (Railway/Vercel)
- [ ] Métriques de performance surveillées
- [ ] Alertes configurées pour les erreurs critiques

## 🔒 Sécurité

- [ ] HTTPS activé
- [ ] CORS configuré correctement
- [ ] Rate limiting actif
- [ ] Secrets non exposés dans les logs
- [ ] Headers de sécurité configurés

## 📝 Documentation

- [ ] API docs à jour (Swagger)
- [ ] README mis à jour
- [ ] Changelog mis à jour
- [ ] Guide de déploiement à jour

## 🎉 Post-Déploiement

- [ ] Notification Slack envoyée
- [ ] Équipe informée du déploiement
- [ ] Monitoring actif pendant 24h
- [ ] Rollback plan prêt si nécessaire

---

**Date de déploiement:** _______________
**Version:** _______________
**Déployé par:** _______________
