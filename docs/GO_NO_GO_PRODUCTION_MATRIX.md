# Matrice Go/No-Go Production

Dernière mise à jour: 2026-03-01

Objectif: fournir une décision de release exécutable avec critères bloquants et preuves attendues.

## Règle de décision

- **GO**: tous les critères `BLOQUANT` sont validés.
- **NO-GO**: au moins un critère `BLOQUANT` est en échec.
- **GO conditionnel**: aucun bloquant en échec, mais des non-bloquants ouverts avec plan daté.

## Critères BLOQUANTS

| Domaine | Critère | Validation requise | Statut |
|---|---|---|---|
| Qualité | CI `ci.yml` verte sur le SHA ciblé | run GitHub Actions réussi | ☐ |
| Qualité | `pnpm run quality:release` vert | logs + exit code 0 | ☐ |
| Frontend | `https://luneo.app` accessible | HTTP 200 | ☐ |
| Backend | `https://api.luneo.app/health` OK | `status: ok` | ☐ |
| Sécurité | Routes webhook signées protégées | tests webhook/middleware verts | ☐ |
| Fiabilité | Scheduled messages anti-doublon active | tests + revue code lock distribué | ☐ |
| Sécurité API | API keys least-privilege par défaut | test service public API vert | ☐ |
| Déploiement | Déploiement via workflow officiel | `deploy-production.yml` | ☐ |

## Critères NON-BLOQUANTS (fortement recommandés)

| Domaine | Critère | Validation requise | Statut |
|---|---|---|---|
| Observabilité | Dashboard incidents/5xx surveillé 24h | capture monitoring | ☐ |
| Résilience | Drill rollback vérifié < 15 min | preuve exécution drill | ☐ |
| Sécurité | Rotation secrets planifiée | ticket + owner + date | ☐ |
| Qualité tests | E2E critiques durcies | rapport Playwright | ☐ |

## Gates opérationnels avant release

1. Vérifier SHA cible et branch protégée.
2. Vérifier CI verte + artefacts qualité.
3. Lancer déploiement contrôlé (`deploy-production.yml`).
4. Exécuter smoke post-deploy.
5. Vérifier endpoints santé et logs erreur.
6. Décider GO/NO-GO avec cette matrice signée.

## Sign-off

- Release Owner: __________________
- Date/heure: __________________
- Décision: `GO` / `NO-GO` / `GO conditionnel`
- Commentaires: __________________
