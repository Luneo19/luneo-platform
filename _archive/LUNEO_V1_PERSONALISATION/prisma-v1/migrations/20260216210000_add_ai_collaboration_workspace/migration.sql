-- CreateTable
CREATE TABLE "ai_collaboration_workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "collaboratorIds" TEXT[],
    "generationIds" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_collaboration_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_collaboration_workspaces_ownerId_isActive_idx" ON "ai_collaboration_workspaces"("ownerId", "isActive");

-- CreateIndex
CREATE INDEX "ai_collaboration_workspaces_brandId_idx" ON "ai_collaboration_workspaces"("brandId");
