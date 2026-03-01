# Agents Runtime Unification & Verticals

## Unification appliquee

- Runtime unique a l'entree:
  - `OrchestratorService.executeAgent()` devient point d'execution unique.
  - Si `agent.flowData.nodes` existe, execution via `WorkflowEngineService`.
  - Sinon fallback LLM/RAG classique.
- Fichiers modifies:
  - `apps/backend/src/modules/orchestrator/orchestrator.service.ts`
  - `apps/backend/src/modules/orchestrator/orchestrator.module.ts`

## Benefices immediats

- Aucun changement requis cote canaux (`widget-api`, `email-inbound`, `agents.service`) qui appellent deja `executeAgent`.
- Compatibilite ascendante preservee.
- Possibilite de livrer des agents "simples en facade" avec orchestration avancée en backend.

## Verticales prioritaires (valeur client)

1. **Support client**
   - tri auto des tickets, reponses guidees, escalade humaine.
   - KPI: taux de resolution, temps de premiere reponse.
2. **SaaS onboarding/conversion**
   - sequences d'activation, qualification, relance intelligente.
   - KPI: activation J+7, conversion trial->paid.
3. **E-commerce operations**
   - statut commande, retours, FAQ logistique, upsell post-achat.
   - KPI: reduction tickets repetitifs, panier moyen.
4. **Services/booking**
   - qualification lead + prise de rendez-vous + CRM sync.
   - KPI: taux de no-show, taux de booking.

## Roadmap execution runtime (tech)

- Standardiser les contrats d'actions (input/output/errors) pour chaque executor.
- Ajouter traces d'execution unifiees (`workflow` vs `llm`) dans analytics.
- Ajouter mode "simulation avant publication" obligatoire pour les agents critiques.
