# ADR-002: Vector store strategy (managed first, portable abstraction)

## Status
Accepted

## Context

RAG quality depends on reliable vector operations (upsert/query/delete), namespace isolation, and predictable latency.
The platform must remain portable across providers.

## Decision

Adopt a two-layer strategy:

1. **Provider abstraction** in backend (`vector-store` interface).
2. **Managed provider first** for speed of execution and operational simplicity.

Implementation policy:
- provider-specific logic must be isolated behind adapter interfaces;
- namespace isolation must use `organizationId` partitioning;
- metadata schema must remain provider-agnostic.

## Consequences

Positive:
- fast initial rollout;
- easier operations and support;
- no lock-in at domain layer.

Negative:
- provider cost may rise with scale;
- provider migration complexity requires disciplined adapter contracts.

## Exit criteria for provider migration

Consider migration when at least two conditions hold:
- sustained cost pressure above target thresholds;
- need for provider-specific features not supported by current setup;
- data residency/compliance constraints requiring self-hosting.
