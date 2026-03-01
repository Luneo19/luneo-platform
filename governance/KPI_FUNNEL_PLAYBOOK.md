# KPI Funnel Playbook

## Objectif

Piloter la croissance avec un funnel unifié acquisition -> activation -> conversion -> rétention.

## KPIs prioritaires

- Acquisition: visiteurs qualifiés, taux inscription.
- Activation: taux onboarding complété, temps jusqu'au premier succès.
- Conversion: taux checkout, taux purchase.
- Rétention: WAU/MAU, churn logo, churn revenu.

## Instrumentation minimale

- Event taxonomy maintenue dans:
  - `apps/frontend/src/lib/analytics/types.ts`
  - `apps/frontend/src/lib/analytics/kpi-funnel.ts`
- Tous les events critiques doivent inclure:
  - timestamp,
  - userId/anonymousId,
  - plan,
  - source d'acquisition.

## Rituels

- Revue KPI hebdomadaire (product + tech + ops).
- Revue cohorte mensuelle (retention/churn).
- Décision roadmap guidée par impact KPI estimé.

## Seuils d'alerte

- Baisse conversion > 10% semaine/semaine.
- Hausse churn > 15% mois/mois.
- Activation onboarding < 60%.
