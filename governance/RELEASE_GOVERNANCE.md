# Release Governance

## Objectif

Garantir une livraison production sûre, répétable et auditable.

## Règles non négociables

- Aucun déploiement sans `quality:release` vert.
- Aucun merge sans template PR complété.
- Aucun rollback improvisé: plan documenté avant merge.

## Gates qualité

- Gate release (bloquante): `pnpm run quality:release`
- Gate plateforme (durcissement): `pnpm run quality:platform`

## Cadence recommandée

- Lundi: priorisation + risques + périmètre release.
- Mardi/mercredi: implémentation + tests ciblés.
- Jeudi: hardening + observabilité + rollback drill.
- Vendredi: gate release + déploiement contrôlé + revue incidents.

## RACI minimal

- Tech Lead: validation architecture/risques.
- Feature Owner: validation fonctionnelle.
- Ops/Sec: validation observabilité/sécurité.
- Reviewer secondaire: validation non-régression.

## GO / NO-GO

GO si:
- Gate release verte,
- monitoring post-deploy prêt,
- rollback validé.

NO-GO si:
- test critique instable,
- alerte P1 ouverte,
- dépendance externe non maîtrisée.
