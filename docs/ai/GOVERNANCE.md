# Gouvernance IA – Luneo Platform

## 1. Objectifs

- Garantir la sécurité des prompts (pas de PII, pas de contenu interdit).  
- Maîtriser les coûts d’inférence via quota, caching et batching.  
- Assurer la traçabilité pour la supervision humaine (drift, feedback).  
- Préparer l’industrialisation (multi-modèles, réglementation IA).

## 2. Chaîne de modération

1. **PromptGuardService** (backend)  
   - Nettoyage PII (emails, téléphones, CB).  
   - Blocage mots-clés sensibles (violence extrême, explosifs, auto‑mutilation).  
   - Limitation longueur (≤ 800 caractères) + hash SHA-256 pour déduplication.  
   - Journalisation des prompts flaggés (logs Nest).  
2. **Sanitization optionnel côté client** (à implémenter) : avertissements UX + validations synchrones.  
3. **Audit** : centraliser les prompts rejetés dans un futur tableau `ai_prompt_audit` (TODO).

## 3. Quotas & coûts

- `AiService.estimateCost` + `checkUserQuota` assurent la cohérence plan/quota.  
- Lors de chaque génération, `recordAICost` renseigne l’historique Prisma.  
- TODO Q2 : *caching* des prompts identiques (hash) → si résultat < N minutes, renvoyer direct via Redis.  
- TODO Q3 : *batching* (regrouper demandes similaires toutes les 30s pour modèles coûteux).

## 4. Monitoring & Drift

- **QueueHealthService** + Prometheus : surveiller backlog AI (`queue_alert_wait_threshold`).  
- **Sentry** : capture des erreurs IA / latences > SLO.  
- TODO : stocker dans ClickHouse un échantillon anonymisé (prompt hash + classification) pour suivre dérives thématiques.  
- TODO : intégrer un service de classification (OpenAI Moderation / HuggingFace) pour second niveau et supervision humaine.

## 5. Feedback utilisateurs

- Ajouter dans l’UI un module “Résultat acceptable ?” → stocker votes (`ai_feedback`).  
- Pipeline : feedback négatif → déclenche `review` (humain) + ajustement prompts (few-shot, guardrails).  
- Reporting mensuel (IA vs prompts rejetés, NPS).

## 6. Sécurité & conformité

- Policy RGPD : pas de prompts stockés bruts > 30 jours (Hash only).  
- Secrets (OPENAI_API_KEY, etc.) via AWS Secrets Manager / Vault.  
- Tests : `PromptGuardService` couvre déjà principaux scénarios ; ajouter tests e2e (API designs) pour vérifier erreurs 400.  
- TODO : Document DPIA/AI Act (analyse risque, mesure compensatoire).

## 7. Roadmap

| Priorité | Feature | Détails |
|----------|---------|---------|
| 🟢 | PromptGuard ✅ | Implémenté (backend). Étendre à `apps/frontend` (sanitisation). |
| 🟡 | Prompt caching | Redis hash → éviter relance si hash déjà en cours (<5 min). |
| 🟡 | Batching workers | `generateHighRes` : regrouper job quand même modèle/options. |
| 🟠 | Monitoring drift | pipeline classification + dashboards (Grafana). |
| 🟠 | Feedback UX | Formulaire rating, workflow review. |
| 🟠 | Ethique IA | Rédiger charte, conformité AI Act (transparence). |

---

Maintenir ce document à jour à chaque évolution IA (nouveaux modèles, politiques). Toute PR IA doit référencer la section impactée (sécurité, coût, monitoring).***

