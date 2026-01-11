# 🎯 PLAN D'ACTION - PHASE 2: MONITORING & QUALITÉ

## 📋 OBJECTIFS

**Durée estimée**: 5-7 jours  
**Priorité**: 🟡 HAUTE

---

## ✅ TÂCHE 2.1: Monitoring & Observability

### Objectif
Visibilité complète sur les performances, coûts et erreurs des agents IA

### Fichiers à créer
- `apps/backend/src/modules/agents/services/agent-metrics.service.ts`
- `apps/backend/src/modules/agents/services/agent-tracing.service.ts`

### Étapes
1. ✅ Créer métriques Prometheus
2. ✅ Instrumenter tous les appels LLM
3. ✅ Ajouter traces distribuées
4. ✅ Logging structuré avec contexte

### Métriques à implémenter
- `agent_request_duration_seconds` (Histogram)
- `agent_tokens_total` (Counter)
- `agent_cost_total` (Counter)
- `agent_errors_total` (Counter)
- `agent_retries_total` (Counter)
- `agent_circuit_breaker_state` (Gauge)

---

## ✅ TÂCHE 2.2: Amélioration Intent Detection

### Objectif
Détection d'intention plus précise avec ML au lieu de mots-clés

### Fichiers à modifier
- `apps/backend/src/modules/agents/luna/luna.service.ts`
- `apps/backend/src/modules/agents/aria/aria.service.ts`
- `apps/backend/src/modules/agents/nova/nova.service.ts`

### Étapes
1. ✅ Remplacer détection par mots-clés par LLM classification
2. ✅ Utiliser Claude Haiku (rapide + pas cher)
3. ✅ Calculer confidence score réel
4. ✅ Cache les résultats de classification

---

## ✅ TÂCHE 2.3: Gestion Contexte Long

### Objectif
Optimiser les tokens envoyés au LLM en compressant l'historique

### Fichiers à créer/modifier
- `apps/backend/src/modules/agents/services/context-manager.service.ts` (NOUVEAU)
- `apps/backend/src/modules/agents/services/conversation.service.ts`

### Étapes
1. ✅ Créer service de summarization
2. ✅ Compresser historique ancien
3. ✅ Garder seulement contexte récent
4. ✅ Optimiser prompts système

---

## 📊 CHECKLIST

### Phase 2.1 - Monitoring
- [ ] Métriques Prometheus créées
- [ ] Instrumentation complète
- [ ] Traces distribuées
- [ ] Logging structuré

### Phase 2.2 - Intent Detection
- [ ] Classification LLM implémentée
- [ ] Confidence score calculé
- [ ] Cache activé
- [ ] Tests de précision

### Phase 2.3 - Contexte Long
- [ ] Service summarization créé
- [ ] Compression historique
- [ ] Optimisation prompts
- [ ] Tests de réduction tokens

---

## 🧪 TESTS À EFFECTUER

### Tests Unitaires
- Métriques enregistrées correctement
- Intent detection précision > 90%
- Summarization réduit tokens de 30%+

### Tests d'Intégration
- Métriques visibles dans Prometheus
- Intent detection fonctionne en production
- Contexte long optimisé

---

## 📈 MÉTRIQUES DE SUCCÈS

- ✅ Métriques Prometheus disponibles
- ✅ Intent detection > 90% précision
- ✅ Réduction 30% tokens envoyés
- ✅ Logging structuré complet

---

**Démarrage immédiat de l'implémentation**
