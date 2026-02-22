-- CreateEnum
CREATE TYPE "AIResponseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SENT', 'EXPIRED');
CREATE TYPE "TicketSentiment" AS ENUM ('VERY_NEGATIVE', 'NEGATIVE', 'NEUTRAL', 'POSITIVE', 'VERY_POSITIVE');
CREATE TYPE "TicketSource" AS ENUM ('PORTAL', 'EMAIL', 'API', 'CHAT', 'PHONE');
CREATE TYPE "EscalationLevel" AS ENUM ('L1_AI', 'L2_SUPPORT', 'L3_TECH_LEAD', 'L4_ENGINEERING');

-- AlterTable: Add Orion fields to Ticket
ALTER TABLE "Ticket" ADD COLUMN "source" "TicketSource" NOT NULL DEFAULT 'PORTAL';
ALTER TABLE "Ticket" ADD COLUMN "sentiment" "TicketSentiment";
ALTER TABLE "Ticket" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE "Ticket" ADD COLUMN "aiAnalysis" JSONB;
ALTER TABLE "Ticket" ADD COLUMN "confidenceScore" INTEGER;
ALTER TABLE "Ticket" ADD COLUMN "slaDeadline" TIMESTAMP(3);
ALTER TABLE "Ticket" ADD COLUMN "slaBreach" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Ticket" ADD COLUMN "brandId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "assignedAgent" TEXT;

-- AlterTable: Enrich CustomerHealthScore
ALTER TABLE "customer_health_scores" ADD COLUMN "churnRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "customer_health_scores" ADD COLUMN "satisfactionScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "customer_health_scores" ADD COLUMN "financialScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "customer_health_scores" ADD COLUMN "supportScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "customer_health_scores" ADD COLUMN "trend" TEXT NOT NULL DEFAULT 'stable';

-- CreateTable: AITicketResponse
CREATE TABLE "orion_ai_ticket_responses" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "agentId" TEXT,
    "modelUsed" TEXT NOT NULL,
    "generatedContent" TEXT NOT NULL,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "confidenceFactors" JSONB,
    "status" "AIResponseStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "sentAt" TIMESTAMP(3),
    "feedbackRating" INTEGER,
    "feedbackComment" TEXT,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orion_ai_ticket_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: KnowledgeBaseCategory
CREATE TABLE "orion_kb_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orion_kb_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SecurityThreat
CREATE TABLE "orion_security_threats" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orion_security_threats_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BlockedIP
CREATE TABLE "orion_blocked_ips" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blockedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orion_blocked_ips_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SupportSLAPolicy
CREATE TABLE "orion_sla_policies" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "plan" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "firstResponseMin" INTEGER NOT NULL,
    "resolutionMin" INTEGER NOT NULL,
    "businessHoursOnly" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Zurich',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orion_sla_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EscalationRule
CREATE TABLE "orion_escalation_rules" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "fromLevel" "EscalationLevel" NOT NULL,
    "toLevel" "EscalationLevel" NOT NULL,
    "conditions" JSONB NOT NULL,
    "timeoutMin" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orion_escalation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EscalationHistory
CREATE TABLE "orion_escalation_history" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fromLevel" "EscalationLevel" NOT NULL,
    "toLevel" "EscalationLevel" NOT NULL,
    "reason" TEXT NOT NULL,
    "escalatedById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orion_escalation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AITrainingExample
CREATE TABLE "orion_ai_training_examples" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "actualOutput" TEXT,
    "rating" INTEGER,
    "category" TEXT,
    "tags" TEXT[],
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orion_ai_training_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SupportMacro
CREATE TABLE "orion_support_macros" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "variables" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orion_support_macros_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OrionAgentAction
CREATE TABLE "orion_agent_actions" (
    "id" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "data" JSONB,
    "result" JSONB,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orion_agent_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OrionInsight
CREATE TABLE "orion_insights" (
    "id" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orion_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OrionAutomationV2
CREATE TABLE "orion_automations_v2" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" JSONB NOT NULL,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orion_automations_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OrionAutomationRunV2
CREATE TABLE "orion_automation_runs_v2" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "triggerData" JSONB,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "orion_automation_runs_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SatisfactionSurvey
CREATE TABLE "orion_satisfaction_surveys" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "npsScore" INTEGER,
    "csatScore" INTEGER,
    "cesScore" INTEGER,
    "comment" TEXT,
    "categories" TEXT[],
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orion_satisfaction_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orion_ai_ticket_responses_ticketId_idx" ON "orion_ai_ticket_responses"("ticketId");
CREATE INDEX "orion_ai_ticket_responses_status_idx" ON "orion_ai_ticket_responses"("status");
CREATE INDEX "orion_ai_ticket_responses_reviewedById_idx" ON "orion_ai_ticket_responses"("reviewedById");
CREATE INDEX "orion_ai_ticket_responses_createdAt_idx" ON "orion_ai_ticket_responses"("createdAt");
CREATE INDEX "orion_ai_ticket_responses_status_createdAt_idx" ON "orion_ai_ticket_responses"("status", "createdAt");

CREATE UNIQUE INDEX "orion_kb_categories_slug_key" ON "orion_kb_categories"("slug");
CREATE INDEX "orion_kb_categories_parentId_idx" ON "orion_kb_categories"("parentId");
CREATE INDEX "orion_kb_categories_slug_idx" ON "orion_kb_categories"("slug");

CREATE INDEX "orion_security_threats_brandId_idx" ON "orion_security_threats"("brandId");
CREATE INDEX "orion_security_threats_type_idx" ON "orion_security_threats"("type");
CREATE INDEX "orion_security_threats_severity_idx" ON "orion_security_threats"("severity");
CREATE INDEX "orion_security_threats_status_idx" ON "orion_security_threats"("status");
CREATE INDEX "orion_security_threats_ipAddress_idx" ON "orion_security_threats"("ipAddress");
CREATE INDEX "orion_security_threats_createdAt_idx" ON "orion_security_threats"("createdAt");

CREATE UNIQUE INDEX "orion_blocked_ips_brandId_ipAddress_key" ON "orion_blocked_ips"("brandId", "ipAddress");
CREATE INDEX "orion_blocked_ips_ipAddress_idx" ON "orion_blocked_ips"("ipAddress");
CREATE INDEX "orion_blocked_ips_isActive_idx" ON "orion_blocked_ips"("isActive");
CREATE INDEX "orion_blocked_ips_expiresAt_idx" ON "orion_blocked_ips"("expiresAt");

CREATE UNIQUE INDEX "orion_sla_policies_brandId_plan_priority_key" ON "orion_sla_policies"("brandId", "plan", "priority");
CREATE INDEX "orion_sla_policies_plan_idx" ON "orion_sla_policies"("plan");
CREATE INDEX "orion_sla_policies_isActive_idx" ON "orion_sla_policies"("isActive");

CREATE INDEX "orion_escalation_rules_brandId_idx" ON "orion_escalation_rules"("brandId");
CREATE INDEX "orion_escalation_rules_fromLevel_idx" ON "orion_escalation_rules"("fromLevel");
CREATE INDEX "orion_escalation_rules_isActive_idx" ON "orion_escalation_rules"("isActive");

CREATE INDEX "orion_escalation_history_ticketId_idx" ON "orion_escalation_history"("ticketId");
CREATE INDEX "orion_escalation_history_createdAt_idx" ON "orion_escalation_history"("createdAt");

CREATE INDEX "orion_ai_training_examples_category_idx" ON "orion_ai_training_examples"("category");
CREATE INDEX "orion_ai_training_examples_isApproved_idx" ON "orion_ai_training_examples"("isApproved");
CREATE INDEX "orion_ai_training_examples_createdAt_idx" ON "orion_ai_training_examples"("createdAt");

CREATE INDEX "orion_support_macros_brandId_idx" ON "orion_support_macros"("brandId");
CREATE INDEX "orion_support_macros_category_idx" ON "orion_support_macros"("category");
CREATE INDEX "orion_support_macros_isActive_idx" ON "orion_support_macros"("isActive");

CREATE INDEX "orion_agent_actions_agentType_idx" ON "orion_agent_actions"("agentType");
CREATE INDEX "orion_agent_actions_actionType_idx" ON "orion_agent_actions"("actionType");
CREATE INDEX "orion_agent_actions_status_idx" ON "orion_agent_actions"("status");
CREATE INDEX "orion_agent_actions_priority_idx" ON "orion_agent_actions"("priority");
CREATE INDEX "orion_agent_actions_createdAt_idx" ON "orion_agent_actions"("createdAt");

CREATE INDEX "orion_insights_agentType_idx" ON "orion_insights"("agentType");
CREATE INDEX "orion_insights_type_idx" ON "orion_insights"("type");
CREATE INDEX "orion_insights_severity_idx" ON "orion_insights"("severity");
CREATE INDEX "orion_insights_isRead_idx" ON "orion_insights"("isRead");
CREATE INDEX "orion_insights_createdAt_idx" ON "orion_insights"("createdAt");

CREATE INDEX "orion_automations_v2_brandId_idx" ON "orion_automations_v2"("brandId");
CREATE INDEX "orion_automations_v2_isActive_idx" ON "orion_automations_v2"("isActive");
CREATE INDEX "orion_automations_v2_lastRunAt_idx" ON "orion_automations_v2"("lastRunAt");

CREATE INDEX "orion_automation_runs_v2_automationId_idx" ON "orion_automation_runs_v2"("automationId");
CREATE INDEX "orion_automation_runs_v2_status_idx" ON "orion_automation_runs_v2"("status");
CREATE INDEX "orion_automation_runs_v2_startedAt_idx" ON "orion_automation_runs_v2"("startedAt");

CREATE UNIQUE INDEX "orion_satisfaction_surveys_ticketId_key" ON "orion_satisfaction_surveys"("ticketId");
CREATE INDEX "orion_satisfaction_surveys_npsScore_idx" ON "orion_satisfaction_surveys"("npsScore");
CREATE INDEX "orion_satisfaction_surveys_submittedAt_idx" ON "orion_satisfaction_surveys"("submittedAt");

-- Ticket new indexes
CREATE INDEX "Ticket_brandId_idx" ON "Ticket"("brandId");
CREATE INDEX "Ticket_slaDeadline_idx" ON "Ticket"("slaDeadline");
CREATE INDEX "Ticket_sentiment_idx" ON "Ticket"("sentiment");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orion_ai_ticket_responses" ADD CONSTRAINT "orion_ai_ticket_responses_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orion_ai_ticket_responses" ADD CONSTRAINT "orion_ai_ticket_responses_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orion_kb_categories" ADD CONSTRAINT "orion_kb_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "orion_kb_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orion_security_threats" ADD CONSTRAINT "orion_security_threats_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orion_blocked_ips" ADD CONSTRAINT "orion_blocked_ips_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orion_sla_policies" ADD CONSTRAINT "orion_sla_policies_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orion_escalation_rules" ADD CONSTRAINT "orion_escalation_rules_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orion_escalation_history" ADD CONSTRAINT "orion_escalation_history_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orion_escalation_history" ADD CONSTRAINT "orion_escalation_history_escalatedById_fkey" FOREIGN KEY ("escalatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orion_ai_training_examples" ADD CONSTRAINT "orion_ai_training_examples_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orion_support_macros" ADD CONSTRAINT "orion_support_macros_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orion_automations_v2" ADD CONSTRAINT "orion_automations_v2_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orion_automation_runs_v2" ADD CONSTRAINT "orion_automation_runs_v2_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "orion_automations_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orion_satisfaction_surveys" ADD CONSTRAINT "orion_satisfaction_surveys_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
