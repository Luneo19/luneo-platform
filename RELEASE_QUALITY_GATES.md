# Release Quality Gates

This repository now uses two complementary quality gates.

## 1) Release gate (blocking for production)

Run:

`pnpm run quality:release`

This gate is intentionally strict and stable for production-critical changes:
- frontend lint (`lint:check`),
- backend critical lint (`common`, `auth`, `email`),
- frontend targeted hardening tests,
- frontend + backend type-check,
- frontend + backend build,
- critical production smoke (`pnpm run smoke:critical`),
- post-login conversion tunnel smoke (`pnpm run smoke:post-login-tunnel`).

Use this gate for deploy decisions.

## 2) Platform gate (continuous hardening)

Run:

`pnpm run quality:platform`

This runs full monorepo lint/type-check/test/build.  
It remains mandatory for platform maturity and technical debt reduction, but can include historical suites not yet stabilized.

## Operating model

- Production deployment must pass `quality:release`.
- `quality:platform` is tracked continuously and reduced to zero failures by dedicated hardening sprints.
- No new critical feature should be merged without at least one test in the release gate scope.
- Any smoke regression on public URLs blocks the release candidate until fixed.
