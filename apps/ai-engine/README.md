# AI Engine

This service is the canonical Python AI runtime for Luneo.

## Scope

- Prompt orchestration helpers
- Runtime safety checks
- Model adapters (future)

## Commands

- `pnpm --filter @luneo/ai-engine lint`
- `pnpm --filter @luneo/ai-engine type-check`
- `pnpm --filter @luneo/ai-engine test`
- `pnpm --filter @luneo/ai-engine build`

## Notes

The service is intentionally minimal in this baseline to ensure it is included in the workspace and release gates.
