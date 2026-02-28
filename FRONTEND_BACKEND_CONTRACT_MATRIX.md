# Frontend/Backend Contract Matrix

## Scope

Matrice des contrats critiques corriges pour eviter les erreurs 404/400 et les regressions runtime.

## Corrections appliquees

- `settings.changePassword`
  - Frontend avant: `POST /api/v1/users/change-password` (inexistant)
  - Frontend apres: `PUT /api/v1/users/me/password`
  - Fichier: `apps/frontend/src/app/(dashboard)/settings/page.tsx`

- `organizations.settings`
  - Frontend avant: `/api/v1/organizations/settings` (mismatch)
  - Frontend apres: `/api/v1/brands/settings`
  - Fichier: `apps/frontend/src/lib/api/client.ts`

- `admin.clients.updatePlan`
  - Frontend avant: `PATCH /api/v1/admin/organizations/:id`
  - Frontend apres: `PATCH /api/v1/admin/brands/:id`
  - Fichier: `apps/frontend/src/lib/api/client.ts`

- `admin.clients.suspend/unsuspend`
  - Frontend avant: `/api/v1/admin/organizations/:id/suspend|unsuspend`
  - Frontend apres: `/api/v1/admin/brands/:id/suspend|unsuspend`
  - Fichier: `apps/frontend/src/lib/api/client.ts`

- `admin.clients.offerSubscription`
  - Frontend avant: payload `organizationId`
  - Frontend apres: payload normalise vers `brandId` (retro-compatible `organizationId`)
  - Fichier: `apps/frontend/src/lib/api/client.ts`

- `notifications.markAsRead/readAll/delete`
  - Frontend appelait des routes non exposees
  - Backend apres: ajout des routes:
    - `POST /api/v1/notifications/:id/read`
    - `POST /api/v1/notifications/read-all`
    - `DELETE /api/v1/notifications/:id`
  - Fichier: `apps/backend/src/modules/notifications/notifications.controller.ts`

## Risques restants a traiter (phase suivante)

- Contrats `public-api` (`/api-keys`, `/public-api/webhooks`) a confirmer selon module expose en production.
- Contrats `team/support` gardes derriere feature flags frontend, a finaliser quand backend sera operationnel.
- Contrats `security/gdpr` a aligner avec endpoints effectivement exposes dans `security.controller.ts`.
