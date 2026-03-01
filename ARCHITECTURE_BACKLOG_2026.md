# LUNEO - Architecture Backlog 2026

## 1. Format de backlog

Niveaux:
- Epic (objectif business-tech),
- Feature (bloc fonctionnel),
- Tickets (implementation executable).

Chaque ticket est tagge:
- domaine: `backend` / `frontend` / `data` / `infra` / `test`,
- priorite: `P0` / `P1` / `P2`,
- estimation relative: `S` / `M` / `L`.

---

## 2. EPIC P0 - Vertical foundation

### Feature: Vertical templates

- `BE-VERT-001` (backend, P0, M): creer module `verticals` avec `VerticalsModule`, `VerticalsService`, `VerticalsController`.
- `DATA-VERT-002` (data, P0, M): ajouter modele `VerticalTemplate` + migration Prisma.
- `BE-VERT-003` (backend, P0, S): endpoint `GET /api/v1/verticals/templates`.
- `BE-VERT-004` (backend, P0, S): endpoint `POST /api/v1/verticals/select`.
- `BE-VERT-005` (backend, P0, M): seeds templates ecommerce/immobilier.
- `FE-VERT-006` (frontend, P0, M): ecran onboarding selection verticale branche API.
- `TEST-VERT-007` (test, P0, M): tests contractuels selection verticale -> config org.

### Feature: Onboarding vertical-aware

- `BE-ONB-001` (backend, P0, M): appliquer template vertical aux defaults agent/knowledge.
- `FE-ONB-002` (frontend, P0, M): wizard onboarding: questions specifiques verticale.
- `TEST-ONB-003` (test, P0, M): e2e onboarding ecommerce complet.

---

## 3. EPIC P0 - Contact intelligence and memory

### Feature: Contact unifie

- `DATA-CON-001` (data, P0, M): modele `Contact` + index `(organizationId, createdAt)`.
- `BE-CON-002` (backend, P0, M): module `contacts` CRUD minimal.
- `BE-CON-003` (backend, P0, M): lier conversations existantes a `contactId`.
- `BE-CON-004` (backend, P0, M): enrichment profil (langue/preferences) a partir messages.
- `FE-CON-005` (frontend, P0, M): liste contacts + fiche contact.
- `TEST-CON-006` (test, P0, M): tests migration/backfill et integrite relationnelle.

### Feature: Memory layer V1

- `BE-MEM-001` (backend, P0, M): module `memory` facade (working + episodic).
- `BE-MEM-002` (backend, P0, M): job summarisation conversation resolue.
- `BE-MEM-003` (backend, P0, S): endpoint `GET /api/v1/memory/contacts/:id`.
- `BE-MEM-004` (backend, P0, M): injecter memoire dans context builder orchestrator.
- `TEST-MEM-005` (test, P0, M): tests non regression latence orchestrator avec memoire active.

---

## 4. EPIC P0 - Learning flywheel

### Feature: Learning signals et gaps

- `DATA-LRN-001` (data, P0, M): modeles `LearningSignal` et `KnowledgeGap`.
- `BE-LRN-002` (backend, P0, M): module `learning` + signal collector.
- `BE-LRN-003` (backend, P0, M): endpoint `GET /api/v1/learning/gaps`.
- `BE-LRN-004` (backend, P0, S): endpoint `POST /api/v1/learning/gaps/:id/approve`.
- `BE-LRN-005` (backend, P0, M): job hebdo dedup + scoring des gaps.
- `FE-LRN-006` (frontend, P0, M): page dashboard "lacunes detectees".
- `TEST-LRN-007` (test, P0, M): tests d'emission signaux sur flux orchestrator.

### Feature: Vertical aggregation

- `DATA-LRN-008` (data, P0, M): modele `VerticalInsight`.
- `BE-LRN-009` (backend, P0, M): job aggregation anonymisee par verticale.
- `BE-LRN-010` (backend, P0, S): endpoint admin insights par verticale.
- `TEST-LRN-011` (test, P0, S): tests anonymisation et isolation tenant.

---

## 5. EPIC P0 - ROI and value proof

### Feature: ROI pipeline

- `BE-ROI-001` (backend, P0, M): normaliser events ROI dans analytics.
- `BE-ROI-002` (backend, P0, M): service `roi-calculator` versionne.
- `BE-ROI-003` (backend, P0, S): endpoint `GET /api/v1/analytics/roi`.
- `FE-ROI-004` (frontend, P0, M): widget ROI overview + page detail.
- `TEST-ROI-005` (test, P0, M): tests formule ROI avec cas limites.

---

## 6. EPIC P1 - Agent actions and automation

### Feature: Actions registry

- `BE-ACT-001` (backend, P1, M): module `actions` + registry central.
- `BE-ACT-002` (backend, P1, M): executors V1 (`send_email`, `create_ticket`, `transfer_human`, `update_contact`, `webhook_call`).
- `BE-ACT-003` (backend, P1, S): endpoint `GET /api/v1/actions/catalog`.
- `BE-ACT-004` (backend, P1, S): endpoint `POST /api/v1/actions/execute`.
- `TEST-ACT-005` (test, P1, M): tests idempotence/permission sur executors.

### Feature: Workflow automation

- `DATA-AUT-001` (data, P1, M): modeles `Workflow`, `WorkflowExecution`.
- `BE-AUT-002` (backend, P1, M): module `automation` + trigger engine.
- `BE-AUT-003` (backend, P1, M): sequence engine minimal (wait, branch, action).
- `FE-AUT-004` (frontend, P1, M): ecran workflow list + toggle.
- `TEST-AUT-005` (test, P1, M): e2e trigger -> execution -> completion.

---

## 7. EPIC P1 - Channel and integration hardening

### Feature: Unified channel adapters

- `BE-CHN-001` (backend, P1, M): interface unique `IncomingMessage`/`OutgoingMessage`.
- `BE-CHN-002` (backend, P1, M): harmoniser adapters webchat/whatsapp/email.
- `BE-CHN-003` (backend, P1, S): instrumentation erreurs/latence par canal.
- `TEST-CHN-004` (test, P1, M): tests integration multi-canal.

### Feature: Vertical connectors focus

- `BE-INT-001` (backend, P1, M): hardening Shopify connector.
- `BE-INT-002` (backend, P1, M): hardening Calendly connector.
- `FE-INT-003` (frontend, P1, M): pages setup + status connecteurs.
- `TEST-INT-004` (test, P1, M): tests webhooks entrants/sortants.

---

## 8. EPIC P1 - Governance, reliability, security

### Feature: Quality gates and SLO

- `INF-QA-001` (infra, P1, M): quality gates CI strict (lint/type/test/build/smoke).
- `INF-QA-002` (infra, P1, M): dashboards SLO (p95, 5xx, queue lag).
- `INF-QA-003` (infra, P1, S): alerting seuils incident.
- `TEST-QA-004` (test, P1, M): smoke tests parcours critiques prod-like.

### Feature: Security hardening

- `BE-SEC-001` (backend, P1, M): matrix permissions par ressource.
- `BE-SEC-002` (backend, P1, S): audit enrichi sur actions sensibles.
- `INF-SEC-003` (infra, P1, M): rotation secrets et policy standard.
- `TEST-SEC-004` (test, P1, M): battery tests auth/csrf/rate-limit.

---

## 9. EPIC P2 - Expansion and moat reinforcement

### Feature: Fine-tuning vertical

- `DATA-FT-001` (data, P2, M): pipeline dataset curation par verticale.
- `BE-FT-002` (backend, P2, M): strategy router pour modeles fine-tunes.
- `TEST-FT-003` (test, P2, M): benchmark qualite/cout avant bascule.

### Feature: Ecosystem growth

- `BE-API-001` (backend, P2, M): API publique verticale-ready.
- `FE-MKT-002` (frontend, P2, M): marketplace integrations.
- `INF-ECO-003` (infra, P2, M): observabilite usage partenaires.

---

## 10. Tableau de priorisation d'execution

Ordre recommande:
1. EPIC P0 Vertical foundation
2. EPIC P0 Contact intelligence and memory
3. EPIC P0 Learning flywheel
4. EPIC P0 ROI and value proof
5. EPIC P1 Actions and automation
6. EPIC P1 Channel/integration hardening
7. EPIC P1 Governance/security
8. EPIC P2 Expansion

---

## 11. Regles de pilotage backlog

- Un ticket P0 non conforme DoD bloque la release de sa feature.
- Toute dette technique cree un ticket de remediation date.
- Toute evolution schema doit inclure plan migration + rollback.
- Toute feature sensible doit avoir un test e2e nominal + erreur.
