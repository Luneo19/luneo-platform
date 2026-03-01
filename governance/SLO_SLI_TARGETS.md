# SLO / SLI Targets

## Objectif

Définir des cibles mesurables pour piloter la fiabilité en continu.

## SLIs principaux

- Disponibilité API (`/health`, `/api/v1/health`)
- Latence API (p50, p95, p99)
- Taux d'erreur HTTP (`5xx`, `4xx` critiques)
- Succès webhooks Stripe
- Succès login/logout

## SLO cibles initiales

- Disponibilité API mensuelle: **99.9%**
- Latence API p95: **< 1000ms**
- Latence API p99: **< 2000ms**
- Taux d'erreur global: **< 1%**
- Webhooks Stripe succès: **>= 99.5%**
- Auth success rate (login/logout): **>= 99.5%**

## Error budget

- Error budget mensuel: 0.1%
- Dépassement > 50% du budget:
  - gel partiel des features non critiques,
  - sprint orienté fiabilité.
- Dépassement > 80%:
  - gel release hors correctifs critiques.

## Cadence de revue

- Hebdo: revue SLI/SLO (ops + tech lead + product).
- Mensuel: revue tendances + décisions d'investissement technique.
