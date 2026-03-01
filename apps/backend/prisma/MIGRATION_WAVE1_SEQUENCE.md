# Wave 1 Migration Sequence (Expand -> Backfill -> Validate -> Contract)

This sequence is the execution order for the architecture foundation migration.

## 1) Expand (additive, no breaking constraints)

Add new models and enums:
- `KnowledgeVersion`
- `ConversationAssignment`, `InternalNote`, `CannedResponse`, `AssignmentRule`
- `SLAConfig`, `SLABreach`
- `ABTest`, `LLMUsage`
- `AgentChannel`
- `ConsentRecord`, `DataDeletionRequest`
- `NotificationPreference`, `Notification`
- `ScheduledMessage`
- `CustomFieldDefinition`
- `FailedJob`
- `WhiteLabelConfig`
- `Partner`, `PartnerReferral`

Add additive fields:
- `Agent.scope`, `Agent.mode`
- `Contact.customFields`, `Contact.timezone`
- `Conversation.aiSummary`, `Conversation.keyFacts`, `Conversation.primaryIntent`, `Conversation.aiConfidence`,
  `Conversation.resolutionTimeSeconds`, `Conversation.humanTakeoverAt`, `Conversation.humanAgentId`,
  `Conversation.tokensUsed`, `Conversation.estimatedCost`, `Conversation.abTestId`, `Conversation.abTestVariant`
- `Message.modelUsed`, `Message.tokensInput`, `Message.tokensOutput`, `Message.responseTimeMs`,
  `Message.intent`, `Message.sentiment`, `Message.ragSourcesUsed`, `Message.actionTaken`, `Message.actionResult`

## 2) Backfill

- Populate `Conversation.primaryIntent` from legacy `Conversation.intent` where available.
- Populate `Conversation.tokensUsed` from `totalTokensIn + totalTokensOut`.
- Populate `Conversation.estimatedCost` from `totalCostUsd`.
- Populate `Message.modelUsed` from legacy `Message.model`.
- Populate `Message.tokensInput/tokensOutput` from `tokensIn/tokensOut`.
- Initialize `Agent.mode=LIVE` and `Agent.scope={}` when null.

## 3) Validate

- Validate new FK integrity and nullability assumptions.
- Verify no cross-tenant leakage on new relationship joins.
- Run aggregates over `LLMUsage`, `ABTest`, `SLABreach` for cardinality checks.

## 4) Contract

- Optionally deprecate duplicate legacy fields after consumer migration:
  - `Message.model` vs `modelUsed`
  - `Message.tokensIn/tokensOut` vs `tokensInput/tokensOutput`
  - `Conversation.intent` vs `primaryIntent`

## Rollout controls

- Use feature flags for consumers of new fields.
- Gate rollout with: schema validate, backend type-check, critical e2e flows.
