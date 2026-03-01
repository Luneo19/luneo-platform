# ARC Tracking Matrix 001-057

This matrix is the single execution ledger for the architecture blueprint.

Status values:
- `missing`: capability not implemented in production code
- `partial`: some elements exist but capability is not end-to-end
- `done`: API + data + UI + tests + observability validated

## Governance

| ID | Capability | Initial status | Owner | Dependencies | Done criteria |
|---|---|---|---|---|---|
| ARC-001 | Vertical templates module | partial | BE | ARC-010, ARC-022 | Vertical templates in code, org binding, tests |
| ARC-002 | Automated onboarding (crawl + voice + setup) | partial | BE/FE | ARC-019, ARC-024 | Async crawl, progress events, onboarding UI complete |
| ARC-003 | Memory 3 layers (working/episodic/semantic) | partial | BE/Data | ARC-012, ARC-013 | Redis + DB summaries + vector memory integrated |
| ARC-004 | Learning flywheel | partial | BE/Data | ARC-006, ARC-008 | Signals/gaps/aggregation/distribution scheduled |
| ARC-005 | Channels adapter pattern | partial | BE | ARC-024 | Unified interface + per-channel adapters and tests |
| ARC-006 | Orchestrator sub-services | partial | BE | ARC-011, ARC-012 | intent/context/prompt/workflow/escalation wired |
| ARC-007 | Contact profile enrichment | partial | BE/Data | ARC-022 | AI profile, lead score/status, churn model |
| ARC-008 | ROI analytics engine | partial | BE/FE | ARC-014, ARC-054 | ROI formulas and dashboard exposed |
| ARC-009 | Dedicated widget app productized | partial | FE | ARC-028, ARC-041 | Single source widget build, embed workflow |
| ARC-010 | Actions registry + executors | partial | BE | ARC-029 | Registry metadata + execution policy |
| ARC-011 | LLM intelligent routing + cost tracker | partial | BE | ARC-046 | model selection strategy + cost telemetry |
| ARC-012 | RAG expansion + reranking + vector interface | partial | BE | ARC-013 | retrieval quality pipeline measured |
| ARC-013 | Knowledge sync + chunking strategy | partial | BE/Data | ARC-034 | source sync, semantic chunking, embeddings lifecycle |
| ARC-014 | Conversation enriched resolution fields | partial | BE/Data | ARC-022 | schema + API + reporting mapped |
| ARC-015 | Automation trigger + sequence engines | partial | BE | ARC-050 | trigger engine and sequence execution |
| ARC-016 | Integrations connector architecture | partial | BE | ARC-043 | connector abstractions + sync + actions |
| ARC-017 | AI safety advanced controls | partial | BE | ARC-038 | injection/hallucination/filter/pii guards live |
| ARC-018 | Outgoing webhooks platform | partial | BE | ARC-049 | webhook delivery with retries/logs |
| ARC-019 | BullMQ workers complete matrix | partial | BE | ARC-048 | required processors and schedules active |
| ARC-020 | Missing frontend domain pages | partial | FE | ARC-026, ARC-054 | all required pages shipped with auth guards |
| ARC-021 | Missing frontend components | partial | FE | ARC-020 | reusable components with tests |
| ARC-022 | Shared types completion | partial | FE/BE | ARC-001..ARC-057 | shared contracts consolidated in packages |
| ARC-023 | Post-conversation feedback loop | partial | FE/BE | ARC-004 | quick replies + signal emission |
| ARC-024 | WebSocket realtime architecture | partial | BE/FE | ARC-026, ARC-028 | gateway rooms, typing, stream events |
| ARC-025 | Multi-agent per organization routing | partial | BE | ARC-006 | agent scope + handoff + routing policy |
| ARC-026 | Human takeover collaborative inbox | partial | FE/BE | ARC-027, ARC-051 | assignment, notes, macros, resolve flow |
| ARC-027 | SLA management | missing | BE/FE | ARC-026 | SLA config, warning, breach tracking |
| ARC-028 | LLM token streaming | partial | BE/FE | ARC-024 | token stream rendered in widget/dashboard |
| ARC-029 | Native function calling / tool use | partial | BE | ARC-010 | schema-driven tools and loop execution |
| ARC-030 | Media and files (OCR/vision/audio) | partial | BE/FE | ARC-011 | upload+analysis pipeline and context usage |
| ARC-031 | Language handling + translation + RTL | partial | FE/BE | ARC-022 | language detect/respond + dashboard i18n/RTL |
| ARC-032 | Public API + developer portal + SDK | partial | BE/FE | ARC-022, ARC-036 | public endpoints, docs, sdk packages |
| ARC-033 | Sandbox mode per agent | partial | BE/FE | ARC-032 | no-billing dry-run and visible sandbox |
| ARC-034 | Knowledge versioning + rollback | missing | BE/FE | ARC-013 | versions history, diff, rollback |
| ARC-035 | A/B testing for agent responses | missing | BE/FE | ARC-014 | variants, metrics, winner selection |
| ARC-036 | Granular rate limiting | partial | BE | ARC-032 | ip/key/org/endpoint/channel/provider limits |
| ARC-037 | LLM fallback and resilience chain | partial | BE | ARC-011 | fallback chain + circuit breaker metrics |
| ARC-038 | GDPR complete module | missing | BE | ARC-052 | consent/export/delete/retention operational |
| ARC-039 | Advanced notifications (email/slack/sms) | partial | BE/FE | ARC-026 | preferences + multi-channel dispatch |
| ARC-040 | Global search | missing | BE/FE | ARC-020 | full-text search + cmd-k integration |
| ARC-041 | Mobile SDK strategy (MVP webview-ready) | partial | FE | ARC-009 | responsive/perf widget baseline met |
| ARC-042 | White-label enterprise | missing | BE/FE | ARC-032 | custom domain/branding/sender setup |
| ARC-043 | Partner/reseller program | missing | BE/FE | ARC-042 | partner entities, commissions, dashboards |
| ARC-044 | Import/migration from competitors | missing | BE/FE | ARC-019 | importers + background jobs + wizard |
| ARC-045 | Public status page + health depth | partial | BE/FE | ARC-057 | component status and incident history |
| ARC-046 | LLM cost control by organization | partial | BE/FE | ARC-011, ARC-054 | budget thresholds and behavior policies |
| ARC-047 | Explicit caching strategy | partial | BE | ARC-013 | centralized cache policy + invalidation |
| ARC-048 | Queue monitoring + DLQ | partial | BE/FE | ARC-019 | failed job persistence and ops UI |
| ARC-049 | Enriched audit logging | partial | BE/FE | ARC-038 | full critical action coverage and filters |
| ARC-050 | Scheduled messages | missing | BE/FE | ARC-015, ARC-053 | delayed sends and cancellation lifecycle |
| ARC-051 | Tags and custom fields | partial | FE/BE | ARC-026 | custom field definitions and UI controls |
| ARC-052 | Data export module | partial | BE/FE | ARC-038 | export jobs + secure download flow |
| ARC-053 | Multi-timezone correctness | partial | BE/FE | ARC-050 | org/contact/user timezone-safe execution |
| ARC-054 | Visual usage and quotas | partial | FE/BE | ARC-046 | usage bars + threshold alerts + policies |
| ARC-055 | Internal docs and developer onboarding | partial | Docs | ARC-001..ARC-057 | architecture+runbooks+standards complete |
| ARC-056 | Critical e2e/load/security tests | partial | QA/BE/FE | ARC-001..ARC-057 | target scenarios automated in CI |
| ARC-057 | Custom Prometheus metrics | missing | BE/Infra | ARC-045 | business metrics exported and alerted |

## Update protocol

1. Any PR touching ARC scope must reference at least one ARC ID.
2. Status can move to `done` only when API + data + UI + tests + observability are all validated.
3. Keep proof links (paths, test names, dashboards) in PR description, not in this matrix.
