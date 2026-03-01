# ADR-001: Modular Monolith as default architecture

## Status
Accepted

## Context

The platform requires rapid delivery across tightly coupled domains:
- auth, billing, orchestration, channels, learning, analytics;
- strict multi-tenant isolation;
- high iteration velocity for AI-heavy workflows.

Splitting early into microservices adds operational and consistency overhead.

## Decision

Keep a **modular monolith** in `apps/backend` as the default architecture.

Boundaries are enforced by modules and shared interfaces, not by network boundaries.
Service extraction is allowed only when one of the following is true:
- sustained independent scaling pressure;
- strict runtime isolation requirement;
- separate release cadence with clear contracts.

## Consequences

Positive:
- faster cross-domain iteration;
- simpler observability, transactions, and debugging;
- lower infra complexity at this stage.

Negative:
- stronger need for strict module boundaries;
- potential growth in build and test runtime;
- risk of implicit coupling if ownership is unclear.

## Guardrails

- Every module defines explicit inbound/outbound contracts.
- No direct data-layer coupling across unrelated modules.
- ARC matrix tracks cross-module dependencies before merge.
