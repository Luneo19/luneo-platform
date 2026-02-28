# Triage dossiers caducs / lourds

## Objectif
Réduire le bruit opérationnel sans casser le runtime ni la capacité d'audit.

## Mesure rapide (poids)
- `_archive`: ~246M
- `artifacts`: ~16M
- `_archived_test_pages`: ~20K
- `reports`: ~20K
- `monitoring`: ~56K
- `postman`: ~12K

## Décision de tri
- **Conserver hors index Cursor**: `_archive`, `artifacts`, `_archived_test_pages`, `reports`, `monitoring`, `postman`.
- **Conserver indexés**: `docs`, `tests`, `integrations`, lockfiles, `apps/ai-engine` (visibilité architecture et qualité).

## Règle de gouvernance
- Aucun dossier potentiellement caduc n'est supprimé sans:
  - owner nommé,
  - validation fonctionnelle,
  - fenêtre de rollback.

## Backlog recommandé
- Mettre un job mensuel de purge contrôlée de `artifacts/` (TTL).
- Créer une convention de rétention pour `_archive` (dates + scope + responsable).
