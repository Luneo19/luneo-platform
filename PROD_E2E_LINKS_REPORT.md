# Production E2E Links Report

## Scope

Verification smoke de pages frontend et endpoints backend en production.

## Resultats HTTP

- `200` `https://luneo.app`
- `200` `https://luneo.app/login`
- `200` `https://luneo.app/register`
- `200` `https://luneo.app/forgot-password`
- `200` `https://luneo.app/reset-password`
- `200` `https://api.luneo.app/health`
- `200` `https://api.luneo.app/api/v1/health`
- `302` `https://api.luneo.app/api/v1/auth/google` (redirect OAuth attendu)
- `302` `https://api.luneo.app/api/v1/auth/github` (redirect OAuth attendu)
- `200` `https://api.luneo.app/api/v1/plans/all`

## Endpoints proteges (sans session)

- `401` `https://api.luneo.app/api/v1/auth/me` (attendu)
- `401` `https://api.luneo.app/api/v1/billing/subscription` (attendu)
- `401` `https://api.luneo.app/api/v1/notifications` (attendu)

## Observations

- Aucun 404/5xx detecte sur ce smoke run.
- Les redirects OAuth sont fonctionnels et exposes.
- Les routes proteges renvoient bien `401` sans session.

## Limites de ce lot

- Ce rapport couvre verification HTTP externe (sans credentials multi-role).
- Les parcours applicatifs complets multi-role (admin/client/super-admin) doivent etre couverts via tests E2E instrumentes CI (todo suivant).
