# Audit As-Is du coeur Agents

## Portee

Ce document decrit l'etat actuel du produit Agents apres connexion (frontend + backend), la valeur deja livrable et les ecarts qui bloquent une exploitation enterprise a grande echelle.

## Ce qui fonctionne deja

- Creation et gestion d'agents IA (CRUD, publication, pause, test sandbox).
- Widget conversationnel deployable avec API publique.
- Pipeline de reponse IA avec orchestration, RAG et persistance des conversations.
- Analytics de base (overview, comparaisons, tendances).
- Quotas, billing et suivi d'usage.
- Base de templates/playbooks pour accelerer l'activation.

## Parcours actuel client (apres login)

1. Creation agent depuis dashboard.
2. Configuration agent (ton, instructions, options).
3. Test manuel.
4. Publication.
5. Connexion d'un canal (widget et certaines integrations).
6. Suivi conversations + KPIs.

## Forces produit

- Time-to-value correct sur les cas simples (FAQ, qualification initiale, support niveau 1).
- Structure technique deja orientee composants metier (agents, orchestrator, channels, analytics).
- Existence d'une base de connecteurs/actions.

## Faiblesses critiques

- Coherence API inegale entre frontend et backend (routes legacy encore consommees).
- Integrations heterogenes selon modules (UX et observabilite non uniformes).
- Deux moteurs de flow/workflow coexistants, ce qui ajoute de la complexite.
- ROI partiellement estime, attribution pas encore totalement robuste.

## Modules cles identifies

- Backend:
  - `apps/backend/src/modules/agents`
  - `apps/backend/src/modules/orchestrator`
  - `apps/backend/src/modules/widget-api`
  - `apps/backend/src/modules/channels`
  - `apps/backend/src/modules/agent-analytics`
- Frontend:
  - `apps/frontend/src/app/(dashboard)/agents`
  - `apps/frontend/src/app/(dashboard)/conversations`
  - `apps/frontend/src/app/(dashboard)/integrations`
  - `apps/frontend/src/app/(dashboard)/overview`

## Conclusion

La base est reelle et exploitable, mais la promesse "plateforme Agents enterprise orientee resultats" exige de prioriser:

1. Stabilisation post-login et coherence API.
2. Simplification radicale de l'experience client.
3. Industrialisation des integrations et de l'attribution ROI.
