-- CreateEnum
CREATE TYPE "ModulePriority" AS ENUM ('PRIMARY', 'SECONDARY', 'AVAILABLE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('SOLO', 'SMALL_2_10', 'MEDIUM_11_50', 'LARGE_51_200', 'ENTERPRISE_200_PLUS');

-- CreateEnum
CREATE TYPE "PrimaryUseCase" AS ENUM ('CUSTOMIZER', 'DESIGN_AI', 'VISUALIZATION_3D', 'AR_TRYON', 'PRINT_PRODUCTION', 'ALL');

-- CreateEnum
CREATE TYPE "OnboardingActionType" AS ENUM ('TUTORIAL', 'SETUP_GUIDE', 'TEMPLATE_IMPORT', 'INTEGRATION_CONNECT', 'SKIP');

-- CreateTable Industry (no FK to Organization)
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "labelFr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable Organization
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industryId" TEXT,
    "onboardingCompletedAt" TIMESTAMP(3),
    "onboardingCurrentStep" INTEGER NOT NULL DEFAULT 0,
    "companySize" "CompanySize",
    "primaryUseCase" "PrimaryUseCase",
    "businessGoals" JSONB,
    "dashboardLayout" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable IndustryModuleConfig
CREATE TABLE "IndustryModuleConfig" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "moduleSlug" TEXT NOT NULL,
    "priority" "ModulePriority" NOT NULL DEFAULT 'AVAILABLE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefaultEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultSettings" JSONB,

    CONSTRAINT "IndustryModuleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable IndustryWidgetConfig
CREATE TABLE "IndustryWidgetConfig" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "widgetSlug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "gridColumn" INTEGER NOT NULL DEFAULT 1,
    "gridRow" INTEGER NOT NULL DEFAULT 1,
    "gridWidth" INTEGER NOT NULL DEFAULT 1,
    "gridHeight" INTEGER NOT NULL DEFAULT 1,
    "isDefaultVisible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "IndustryWidgetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable IndustryKpiConfig
CREATE TABLE "IndustryKpiConfig" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "kpiSlug" TEXT NOT NULL,
    "labelFr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefaultVisible" BOOLEAN NOT NULL DEFAULT true,
    "calculationMethod" TEXT,

    CONSTRAINT "IndustryKpiConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable IndustryTemplate
CREATE TABLE "IndustryTemplate" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "templateData" JSONB,
    "productType" TEXT,
    "is3D" BOOLEAN NOT NULL DEFAULT false,
    "modelUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IndustryTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable IndustryTerminology
CREATE TABLE "IndustryTerminology" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "genericTerm" TEXT NOT NULL,
    "customTermFr" TEXT NOT NULL,
    "customTermEn" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT 'all',

    CONSTRAINT "IndustryTerminology_pkey" PRIMARY KEY ("id")
);

-- CreateTable IndustryOnboarding
CREATE TABLE "IndustryOnboarding" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionFr" TEXT,
    "descriptionEn" TEXT,
    "videoUrl" TEXT,
    "actionType" "OnboardingActionType" NOT NULL DEFAULT 'TUTORIAL',
    "actionPayload" JSONB,

    CONSTRAINT "IndustryOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable OnboardingProgress
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "step1Profile" JSONB,
    "step1CompletedAt" TIMESTAMP(3),
    "step2Industry" TEXT,
    "step2CompletedAt" TIMESTAMP(3),
    "step3UseCases" JSONB,
    "step3CompletedAt" TIMESTAMP(3),
    "step4Goals" JSONB,
    "step4CompletedAt" TIMESTAMP(3),
    "step5Integrations" JSONB,
    "step5CompletedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable UserDashboardPreference
CREATE TABLE "UserDashboardPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "widgetOverrides" JSONB,
    "sidebarOrder" JSONB,
    "pinnedModules" JSONB,
    "lastVisitedModule" TEXT,
    "dashboardTheme" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDashboardPreference_pkey" PRIMARY KEY ("id")
);

-- AlterTable Brand: add organizationId
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- CreateIndex Industry
CREATE UNIQUE INDEX "Industry_slug_key" ON "Industry"("slug");
CREATE INDEX "Industry_slug_idx" ON "Industry"("slug");
CREATE INDEX "Industry_isActive_sortOrder_idx" ON "Industry"("isActive", "sortOrder");

-- CreateIndex Organization
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");
CREATE INDEX "Organization_industryId_idx" ON "Organization"("industryId");

-- CreateIndex IndustryModuleConfig
CREATE UNIQUE INDEX "IndustryModuleConfig_industryId_moduleSlug_key" ON "IndustryModuleConfig"("industryId", "moduleSlug");
CREATE INDEX "IndustryModuleConfig_industryId_idx" ON "IndustryModuleConfig"("industryId");

-- CreateIndex IndustryWidgetConfig
CREATE UNIQUE INDEX "IndustryWidgetConfig_industryId_widgetSlug_key" ON "IndustryWidgetConfig"("industryId", "widgetSlug");
CREATE INDEX "IndustryWidgetConfig_industryId_idx" ON "IndustryWidgetConfig"("industryId");

-- CreateIndex IndustryKpiConfig
CREATE UNIQUE INDEX "IndustryKpiConfig_industryId_kpiSlug_key" ON "IndustryKpiConfig"("industryId", "kpiSlug");
CREATE INDEX "IndustryKpiConfig_industryId_idx" ON "IndustryKpiConfig"("industryId");

-- CreateIndex IndustryTemplate
CREATE INDEX "IndustryTemplate_industryId_idx" ON "IndustryTemplate"("industryId");

-- CreateIndex IndustryTerminology
CREATE UNIQUE INDEX "IndustryTerminology_industryId_genericTerm_context_key" ON "IndustryTerminology"("industryId", "genericTerm", "context");
CREATE INDEX "IndustryTerminology_industryId_idx" ON "IndustryTerminology"("industryId");

-- CreateIndex IndustryOnboarding
CREATE UNIQUE INDEX "IndustryOnboarding_industryId_stepOrder_key" ON "IndustryOnboarding"("industryId", "stepOrder");
CREATE INDEX "IndustryOnboarding_industryId_idx" ON "IndustryOnboarding"("industryId");

-- CreateIndex OnboardingProgress
CREATE UNIQUE INDEX "OnboardingProgress_organizationId_userId_key" ON "OnboardingProgress"("organizationId", "userId");
CREATE INDEX "OnboardingProgress_organizationId_idx" ON "OnboardingProgress"("organizationId");
CREATE INDEX "OnboardingProgress_userId_idx" ON "OnboardingProgress"("userId");

-- CreateIndex UserDashboardPreference
CREATE UNIQUE INDEX "UserDashboardPreference_userId_organizationId_key" ON "UserDashboardPreference"("userId", "organizationId");
CREATE INDEX "UserDashboardPreference_userId_idx" ON "UserDashboardPreference"("userId");
CREATE INDEX "UserDashboardPreference_organizationId_idx" ON "UserDashboardPreference"("organizationId");

-- CreateIndex Brand organizationId
CREATE INDEX IF NOT EXISTS "Brand_organizationId_idx" ON "Brand"("organizationId");

-- AddForeignKey Organization -> Industry
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey IndustryModuleConfig -> Industry
ALTER TABLE "IndustryModuleConfig" ADD CONSTRAINT "IndustryModuleConfig_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey IndustryWidgetConfig -> Industry
ALTER TABLE "IndustryWidgetConfig" ADD CONSTRAINT "IndustryWidgetConfig_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey IndustryKpiConfig -> Industry
ALTER TABLE "IndustryKpiConfig" ADD CONSTRAINT "IndustryKpiConfig_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey IndustryTemplate -> Industry
ALTER TABLE "IndustryTemplate" ADD CONSTRAINT "IndustryTemplate_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey IndustryTerminology -> Industry
ALTER TABLE "IndustryTerminology" ADD CONSTRAINT "IndustryTerminology_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey IndustryOnboarding -> Industry
ALTER TABLE "IndustryOnboarding" ADD CONSTRAINT "IndustryOnboarding_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey OnboardingProgress -> Organization
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey UserDashboardPreference -> Organization
ALTER TABLE "UserDashboardPreference" ADD CONSTRAINT "UserDashboardPreference_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Brand -> Organization
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
