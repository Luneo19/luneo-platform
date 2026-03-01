# ADR-003: LLM routing and resilience strategy

## Status
Accepted

## Context

The platform needs:
- high-quality responses for complex tasks;
- low latency for chat channels;
- strict control of variable LLM costs;
- resilience against provider outages/rate limits.

## Decision

Use policy-driven routing with mandatory telemetry and fallback.

Routing dimensions:
- intent complexity;
- context size;
- channel latency tolerance;
- customer tier and monthly budget state;
- modality requirements (vision/audio/text).

Resilience policy:
- primary model -> secondary model -> tertiary model fallback chain;
- per-provider circuit breaker;
- graceful degraded response + human escalation when all providers fail.

Cost policy:
- track tokens, latency, and cost per request;
- enforce organization-level thresholds and behavior at 80%/100%.

## Consequences

Positive:
- better quality/cost balance;
- explicit degraded modes;
- measurable optimization loop.

Negative:
- increased policy complexity;
- stronger testing requirements for routing correctness.

## Non-negotiable controls

- every LLM call writes usage telemetry;
- fallback execution is observable and alertable;
- routing policies are versioned and reviewed.
