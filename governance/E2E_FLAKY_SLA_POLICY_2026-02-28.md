# Politique SLA Flaky E2E

## Objectif
Éliminer la dette flaky avant qu'elle ne devienne une dette produit/release.

## Seuils
- Gate critique: 0% flaky (tolérance zéro).
- Gate domaine: <1% flaky.

## SLA remédiation
- Flaky critique: correction sous 24h.
- Flaky domaine (P1): correction sous 72h.
- Flaky domaine (P2): correction sous 5 jours ouvrés.

## Classification
- P0: impact release immédiat.
- P1: récurrence >=2 runs sur 7 jours.
- P2: sporadique mais confirmé.

## Processus
1. Détection via scripts de stabilité.
2. Assignation owner unique.
3. Ticket avec cause probable + plan fix.
4. Validation par rerun ciblé + rerun gate.
5. Clôture uniquement après 2 runs verts consécutifs.
