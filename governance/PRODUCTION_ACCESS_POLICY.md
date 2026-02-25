# Production Access Policy

## Principes

- Accès minimal nécessaire (least privilege).
- Accès nominatif, jamais partagé.
- Journalisation obligatoire des actions sensibles.

## Règles d'accès

- Production read-only par défaut.
- Write access production limité au noyau on-call.
- Secrets accessibles uniquement via vault/secret manager.

## Contrôles

- Revue des accès mensuelle.
- Rotation des credentials tous les 90 jours.
- Révocation immédiate en cas de départ/changement de rôle.

## Actions interdites

- Exécution manuelle non tracée en prod.
- Contournement des quality gates.
- Utilisation d'identifiants partagés.
