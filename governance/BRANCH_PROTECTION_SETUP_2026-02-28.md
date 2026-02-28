# Branch Protection Setup (Main)

## Objectif
Rendre les contrôles qualité réellement bloquants dans GitHub.

## Checks requis recommandés
- `E2E Quality Gates / E2E Critical Business Gate`
- `E2E Quality Gates / E2E Domain Coverage Gate`
- `CI / Quality Release Gate`

## Paramètres recommandés
- Require pull request before merging.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Include administrators.

## Gouvernance
- Toute désactivation temporaire d'un check doit être:
  - approuvée par lead technique,
  - datée,
  - assortie d'un ticket de réactivation.
