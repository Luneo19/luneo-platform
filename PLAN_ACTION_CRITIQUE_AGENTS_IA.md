# 🚀 PLAN D'ACTION COMPLET - FONCTIONNALITÉS CRITIQUES AGENTS IA

## 📋 VUE D'ENSEMBLE

**Objectif**: Rendre le système Agents IA prêt pour la production  
**Durée estimée**: 3-5 jours  
**Priorité**: 🔴 CRITIQUE

---

## 🎯 PHASE 1: FONCTIONNALITÉS CRITIQUES (Jours 1-2)

### ✅ Tâche 1.1: Tracking des Coûts LLM

**Objectif**: Enregistrer tous les coûts LLM générés par les agents

**Fichiers à modifier**:
- `apps/backend/src/modules/agents/services/llm-router.service.ts`
- `apps/backend/src/modules/agents/agents.module.ts`

**Étapes**:
1. ✅ Créer service de calcul des coûts (`LLMCostCalculatorService`)
2. ✅ Intégrer `AiService` dans `LLMRouterService`
3. ✅ Calculer coûts après chaque appel LLM
4. ✅ Enregistrer dans `AICost` table
5. ✅ Ajouter métadonnées (agentType, intent, etc.)

**Tests**:
- Vérifier enregistrement dans DB
- Vérifier calcul correct des coûts
- Vérifier budget enforcement

---

### ✅ Tâche 1.2: Rate Limiting

**Objectif**: Protéger les endpoints agents contre les abus

**Fichiers à modifier**:
- `apps/backend/src/modules/agents/luna/luna.controller.ts`
- `apps/backend/src/modules/agents/aria/aria.controller.ts`
- `apps/backend/src/modules/agents/nova/nova.controller.ts`

**Étapes**:
1. ✅ Ajouter `@RateLimit()` sur tous les endpoints
2. ✅ Configurer limites par type d'agent
3. ✅ Ajouter headers de rate limit dans réponses
4. ✅ Tester avec requêtes multiples

**Limites proposées**:
- Luna (B2B): 30 req/min
- Aria (B2C): 20 req/min
- Nova (Support): 50 req/min

**Tests**:
- Vérifier blocage après limite
- Vérifier headers dans réponses
- Vérifier reset après window

---

### ✅ Tâche 1.3: Retry & Circuit Breaker

**Objectif**: Gérer les erreurs temporaires et éviter les cascades

**Fichiers à créer/modifier**:
- `apps/backend/src/modules/agents/services/retry.service.ts` (NOUVEAU)
- `apps/backend/src/modules/agents/services/circuit-breaker.service.ts` (NOUVEAU)
- `apps/backend/src/modules/agents/services/llm-router.service.ts`

**Étapes**:
1. ✅ Créer `RetryService` avec exponential backoff
2. ✅ Créer `CircuitBreakerService` par provider
3. ✅ Intégrer dans `LLMRouterService`
4. ✅ Implémenter fallback automatique entre providers
5. ✅ Ajouter logging des retries

**Configuration**:
- Retry: 3 tentatives max
- Backoff: 1s, 2s, 4s
- Circuit breaker: 50% erreurs = open, 60s reset

**Tests**:
- Simuler erreurs temporaires
- Vérifier retry automatique
- Vérifier circuit breaker activation
- Vérifier fallback provider

---

## 🎯 PHASE 2: MONITORING & QUALITÉ (Jours 3-4)

### ✅ Tâche 2.1: Monitoring & Observability

**Objectif**: Visibilité complète sur les performances et coûts

**Fichiers à créer**:
- `apps/backend/src/modules/agents/services/agent-metrics.service.ts` (NOUVEAU)

**Étapes**:
1. ✅ Créer métriques Prometheus
2. ✅ Instrumenter tous les appels LLM
3. ✅ Ajouter traces distribuées
4. ✅ Créer dashboards Grafana

**Métriques**:
- `agent_request_duration_seconds` (Histogram)
- `agent_tokens_total` (Counter)
- `agent_cost_total` (Counter)
- `agent_errors_total` (Counter)
- `agent_retries_total` (Counter)

---

### ✅ Tâche 2.2: Amélioration Intent Detection

**Objectif**: Détection d'intention plus précise avec ML

**Fichiers à modifier**:
- `apps/backend/src/modules/agents/luna/luna.service.ts`
- `apps/backend/src/modules/agents/aria/aria.service.ts`
- `apps/backend/src/modules/agents/nova/nova.service.ts`

**Étapes**:
1. ✅ Remplacer détection par mots-clés par LLM classification
2. ✅ Utiliser Claude Haiku (rapide + pas cher)
3. ✅ Calculer confidence score réel
4. ✅ Cache les résultats de classification

---

### ✅ Tâche 2.3: Gestion Contexte Long

**Objectif**: Optimiser les tokens envoyés au LLM

**Fichiers à créer/modifier**:
- `apps/backend/src/modules/agents/services/context-manager.service.ts` (NOUVEAU)
- `apps/backend/src/modules/agents/services/conversation.service.ts`

**Étapes**:
1. ✅ Créer service de summarization
2. ✅ Compresser historique ancien
3. ✅ Garder seulement contexte récent
4. ✅ Optimiser prompts système

---

## 🎯 PHASE 3: AMÉLIORATIONS UX (Semaine 2)

### ✅ Tâche 3.1: Streaming SSE

**Objectif**: Réponses en temps réel pour meilleure UX

**Fichiers à modifier**:
- `apps/backend/src/modules/agents/*/controllers.ts`
- `apps/frontend/src/hooks/agents/*.ts`

**Étapes**:
1. ✅ Implémenter streaming dans LLMRouterService
2. ✅ Endpoints SSE dans controllers
3. ✅ Frontend avec EventSource
4. ✅ UI avec affichage progressif

---

### ✅ Tâche 3.2: RAG (Retrieval Augmented Generation)

**Objectif**: Réponses basées sur la base de connaissances

**Fichiers à créer**:
- `apps/backend/src/modules/agents/services/rag.service.ts` (NOUVEAU)
- `apps/backend/src/modules/agents/services/vector-store.service.ts` (NOUVEAU)

**Étapes**:
1. ✅ Setup vector store (pgvector ou Pinecone)
2. ✅ Service d'embeddings
3. ✅ Recherche sémantique
4. ✅ Intégration dans prompts

---

## 📊 CHECKLIST D'IMPLÉMENTATION

### Phase 1 - Critique
- [ ] 1.1 Tracking coûts LLM
- [ ] 1.2 Rate limiting
- [ ] 1.3 Retry + Circuit breaker
- [ ] Tests unitaires Phase 1
- [ ] Tests d'intégration Phase 1

### Phase 2 - Haute Priorité
- [ ] 2.1 Monitoring & Observability
- [ ] 2.2 Intent detection améliorée
- [ ] 2.3 Gestion contexte long
- [ ] Tests Phase 2

### Phase 3 - Améliorations
- [ ] 3.1 Streaming SSE
- [ ] 3.2 RAG
- [ ] Tests Phase 3

---

## 🧪 TESTS À EFFECTUER

### Tests Unitaires
- [ ] Calcul coûts LLM correct
- [ ] Rate limiting fonctionne
- [ ] Retry avec exponential backoff
- [ ] Circuit breaker activation
- [ ] Fallback provider

### Tests d'Intégration
- [ ] End-to-end avec tracking coûts
- [ ] Rate limit enforcement
- [ ] Retry sur erreurs temporaires
- [ ] Circuit breaker sur erreurs répétées

### Tests de Charge
- [ ] Rate limiting sous charge
- [ ] Performance avec retry
- [ ] Coûts sous charge normale

---

## 📈 MÉTRIQUES DE SUCCÈS

### Phase 1
- ✅ 100% des appels LLM trackés
- ✅ Rate limiting actif sur tous endpoints
- ✅ Retry automatique fonctionnel
- ✅ Circuit breaker opérationnel

### Phase 2
- ✅ Métriques Prometheus disponibles
- ✅ Intent detection > 90% précision
- ✅ Réduction 30% tokens envoyés

### Phase 3
- ✅ Streaming fonctionnel
- ✅ RAG intégré
- ✅ UX améliorée

---

## 🚀 DÉMARRAGE IMMÉDIAT

**Commençons par la Phase 1 - Fonctionnalités Critiques**
