# Backlog Exécutable - Tickets Prêts

## T1 - Activation Gate E2E Source de Vérité
- **Description**: rendre `e2e-quality-gates` obligatoire sur PR.
- **Acceptance Criteria**:
  - Check bloquant sur PR.
  - Documentation du check dans runbook.
- **Owner**: DevOps
- **Estimation**: 0.5 j

## T2 - Secret & Environnement E2E
- **Description**: fiabiliser secrets (`E2E_BASE_URL`, comptes E2E, OAuth).
- **Acceptance Criteria**:
  - Exécution manuelle gates sans erreurs d'environnement.
  - Secrets documentés.
- **Owner**: DevOps
- **Estimation**: 0.5 j

## T3 - Baseline KPI officielle
- **Description**: publier un snapshot KPI hebdo de référence.
- **Acceptance Criteria**:
  - Artifact `weekly-kpi-*.json/.md` généré.
  - Trend N vs N-1 généré.
- **Owner**: QA Lead
- **Estimation**: 0.5 j

## T4 - Orchestration Release complète
- **Description**: exécuter `release-orchestration` avant chaque release.
- **Acceptance Criteria**:
  - Quality + E2E + rollback drill chainés.
  - Statut final Go/No-Go unique.
- **Owner**: Tech Lead / DevOps
- **Estimation**: 1 j

## T5 - Slow Tests Remediation
- **Description**: réduire les 10 tests les plus lents.
- **Acceptance Criteria**:
  - -20% de durée moyenne sur top 10.
  - 0 baisse de couverture.
- **Owner**: QA Automation
- **Estimation**: 2 j

## T6 - Gouvernance Flaky
- **Description**: appliquer SLA flaky et triage hebdo.
- **Acceptance Criteria**:
  - Process incident actif.
  - 2 runs verts consécutifs avant clôture.
- **Owner**: QA Lead
- **Estimation**: 0.5 j + rituel hebdo
