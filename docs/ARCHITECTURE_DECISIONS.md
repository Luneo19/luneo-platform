# Architecture Decision Records

This document records notable architecture and dependency decisions for the Luneo platform.

## Known Circular Dependencies

The following NestJS modules have documented circular dependencies using `forwardRef()`:

- `AnalyticsModule` <-> `AgentsModule`
- `AgentsModule` <-> `LunaModule`
- `AgentsModule` <-> `AriaModule`
- `AgentsModule` <-> `NovaModule`

These are by design: the AI agents need analytics data, and analytics tracks agent usage.
The `forwardRef()` pattern is the recommended NestJS solution for bidirectional module dependencies.

## Frontend postinstall script

The frontend `postinstall` script runs `(husky install || true) && (pnpm prisma generate || true)`.
The `|| true` is intentional: `husky install` may be skipped in CI or when Git hooks are not desired;
`pnpm prisma generate` is optional when the frontend is used without the backend schema (e.g. frontend-only deploys).
Both steps are non-fatal so installs succeed in all environments.

## Disabled Modules (RenderModule, JobsModule, WebSocketModule)

The following modules are commented out in `apps/backend/src/app.module.ts` for production readiness:

### RenderModule
- **Reason**: Requires native `canvas` and `sharp` dependencies. The `canvas` npm package needs OS-level libraries (Cairo, Pango, etc.); on Alpine (e.g. Railway Docker), these are not installed by default.
- **Impact**: Server-side rendering (SSR previews, PDF generation, print-ready exports) is disabled. Client-side rendering and other design features still work.
- **Re-enable**: Add Alpine packages in Dockerfile (`apk add cairo-dev pango-dev jpeg-dev giflib-dev`), ensure `canvas` and `sharp` are in `package.json`, then uncomment `RenderModule` in `app.module.ts` and run `pnpm install && pnpm build`.

### JobsModule
- **Reason**: Depends on `RenderModule` and triggers workers that use canvas/sharp. When native deps are missing, the app can fail at build or runtime.
- **Impact**: Background jobs (design generation, render, production, AI studio, outbox publisher) are not run.
- **Re-enable**: Re-enable `RenderModule` first, then uncomment `JobsModule` (with the existing `VERCEL` guard if applicable). Ensure Redis/BullMQ is configured for the deployment.

### WebSocketModule
- **Reason**: Serverless runtimes (e.g. Vercel) do not support long-lived WebSocket connections.
- **Impact**: Real-time collaboration and live notifications via WebSockets are unavailable on this server.
- **Re-enable**: When the backend is deployed to a long-lived process (e.g. Railway), uncomment `WebSocketModule` and set `NEXT_PUBLIC_WS_URL` on the frontend to the backend WebSocket URL.
