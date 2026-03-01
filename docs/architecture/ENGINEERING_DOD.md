# Engineering Definition of Done (Architecture Program)

This DoD applies to every ARC item.

## Mandatory completion criteria

1. **Contract**
- DTO/request/response contracts are explicit and typed.
- Shared cross-app types are updated in `packages/types` when needed.

2. **Data**
- Prisma schema changes are migration-backed.
- Indexes and constraints are reviewed for runtime impact.
- Backfill and rollback strategy are documented when data is modified.

3. **Backend**
- Business logic isolated in services.
- Security guards/policies applied to mutating routes.
- Structured logs include correlation context (`requestId`, `organizationId`, `conversationId` when relevant).

4. **Frontend**
- UI paths are protected according to role and org scope.
- Loading/error/empty states are implemented.
- Telemetry events are emitted for core user actions.

5. **Quality**
- Unit/integration/e2e tests added for critical paths.
- Existing tests remain green.
- Type-check and lint pass.

6. **Observability**
- Metrics and traces added for latency, error rate, and throughput.
- Alert conditions documented for critical flows.

7. **Documentation**
- Architecture note updated for behavior changes.
- Runbook updated when operational behavior changes.

8. **Security**
- Tenant isolation validated.
- Rate limiting and abuse controls reviewed.
- Sensitive payload handling reviewed (PII/credentials/webhooks).

9. **Release readiness**
- Feature flag strategy defined for risky or incremental rollout.
- Backward compatibility reviewed for API consumers.

10. **Closure**
- ARC status can be set to `done` only after all criteria above are satisfied.
