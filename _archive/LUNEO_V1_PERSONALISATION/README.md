# Archive Luneo V1 — Personnalisation Produit

**Date d'archivage :** 2026-02-22
**Raison :** Migration vers Luneo V2 (Agents IA)

## NE PAS SUPPRIMER

Ce dossier contient tout le code de Luneo V1 (personnalisation produit).

Il est conserve pour :
- Reference historique
- Reutilisation eventuelle de morceaux de code
- Rollback si necessaire

**Peut etre supprime apres 6 mois+ de stabilite V2.**

## Contenu

- `apps/` : Applications completes (ai-engine, mobile, ar-viewer)
- `packages/` : Packages non reutilises (ar-engine, ar-export, virtual-try-on, optimization, bulk-generator, widget, sdk)
- `backend-modules/` : Modules NestJS metier personnalisation (30+)
- `backend-libs/` : Libs backend non reutilisees (3d, cad)
- `frontend-pages/` : Pages Next.js personnalisation (dashboard + public)
- `frontend-components/` : Composants React personnalisation
- `frontend-stores/` : Stores Zustand personnalisation
- `frontend-hooks/` : Hooks React personnalisation
- `frontend-libs/` : Libs frontend personnalisation (AR, customizer, 3D, tRPC)
- `frontend-trpc/` : Routers tRPC (remplaces par REST API)
- `sdk/` : SDK interne (packages/sdk)
