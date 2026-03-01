# Auth Security Matrix (Production)

## Objectif

Documenter la posture de securite des routes auth et des mecanismes associes (JWT, CSRF, throttle, RBAC) pour fiabiliser la production.

## Matrice endpoints auth

- `POST /api/v1/auth/login`
  - Public: oui
  - JWT requis: non
  - CSRF: ignore (route publique)
  - Protections: brute-force/rate-limit
- `POST /api/v1/auth/signup`
  - Public: oui
  - JWT requis: non
  - CSRF: ignore (route publique)
  - Protections: validation DTO + role force USER
- `POST /api/v1/auth/refresh`
  - Public: oui
  - JWT requis: refresh token cookie
  - CSRF: ignore (route publique)
  - Protections: rotation + reuse detection
- `POST /api/v1/auth/logout`
  - Public: non
  - JWT requis: oui
  - CSRF: oui
  - Protections: blacklist + revoke refresh tokens
- `GET /api/v1/auth/me`
  - Public: non
  - JWT requis: oui
  - CSRF: non (GET)
- `POST /api/v1/auth/forgot-password`
  - Public: oui
  - JWT requis: non
  - CSRF: ignore (route publique)
- `POST /api/v1/auth/reset-password`
  - Public: oui
  - JWT requis: token reset
  - CSRF: ignore (route publique)
- `GET /api/v1/auth/google`, `GET /api/v1/auth/github`
  - Public: oui
  - OAuth state: obligatoire en production
  - CSRF: n/a (redirect OAuth)
- `GET /api/v1/auth/google/callback`, `GET /api/v1/auth/github/callback`
  - Public: oui
  - OAuth state: obligatoire en production
  - CSRF: n/a

## Correctifs P0 implementes

1. OAuth `state` force en production:
   - `apps/backend/src/modules/auth/strategies/google.strategy.ts`
   - `apps/backend/src/modules/auth/strategies/github.strategy.ts`
2. Proxy auth catch-all robuste:
   - support redirects 3xx (OAuth callbacks)
   - forwarding cookies complets + header CSRF
   - parsing conditionnel JSON/text + PATCH support
   - `apps/frontend/src/app/api/v1/auth/[...path]/route.ts`
3. Logout frontend avec header CSRF:
   - `apps/frontend/src/hooks/useAuth.tsx`

## Actions restantes (P1/P2)

- Clarifier modele RBAC plateforme (role super-admin distinct si requis).
- Ajouter tests E2E auth obligatoires en gate release:
  - login/password
  - oauth redirect
  - 2FA flow
  - reset password
  - logout/revocation
