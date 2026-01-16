-- Migration: Marketplace & Communauté (PHASE 7)
-- Ajoute les modèles pour templates marketplace, profils créateurs, revenue sharing, et engagement

-- ========================================
-- MARKETPLACE TEMPLATE
-- ========================================
CREATE TABLE IF NOT EXISTS "MarketplaceTemplate" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "tags" TEXT[],
  
  -- Template content
  "promptTemplate" TEXT NOT NULL,
  "negativePrompt" TEXT,
  "variables" JSONB,
  "exampleOutputs" TEXT[],
  
  -- AI settings
  "aiProvider" TEXT DEFAULT 'openai',
  "model" TEXT DEFAULT 'dall-e-3',
  "quality" TEXT DEFAULT 'standard',
  "style" TEXT DEFAULT 'natural',
  
  -- Pricing
  "priceCents" INTEGER DEFAULT 0, -- 0 = gratuit, sinon prix en centimes
  "isFree" BOOLEAN DEFAULT false,
  "revenueSharePercent" INTEGER DEFAULT 70, -- 70% pour le créateur, 30% pour la plateforme
  
  -- Stats
  "downloads" INTEGER DEFAULT 0,
  "likes" INTEGER DEFAULT 0,
  "reviews" INTEGER DEFAULT 0,
  "averageRating" FLOAT DEFAULT 0,
  "totalRevenueCents" INTEGER DEFAULT 0,
  
  -- Status
  "status" TEXT DEFAULT 'draft', -- draft, pending_review, published, archived, rejected
  "publishedAt" TIMESTAMP(3),
  "featured" BOOLEAN DEFAULT false,
  
  -- Metadata
  "thumbnailUrl" TEXT,
  "previewImages" TEXT[],
  "metadata" JSONB,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "MarketplaceTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarketplaceTemplate_slug_key" ON "MarketplaceTemplate"("slug");
CREATE INDEX IF NOT EXISTS "MarketplaceTemplate_creatorId_idx" ON "MarketplaceTemplate"("creatorId");
CREATE INDEX IF NOT EXISTS "MarketplaceTemplate_status_idx" ON "MarketplaceTemplate"("status");
CREATE INDEX IF NOT EXISTS "MarketplaceTemplate_category_idx" ON "MarketplaceTemplate"("category");
CREATE INDEX IF NOT EXISTS "MarketplaceTemplate_featured_idx" ON "MarketplaceTemplate"("featured");
CREATE INDEX IF NOT EXISTS "MarketplaceTemplate_publishedAt_idx" ON "MarketplaceTemplate"("publishedAt");

-- ========================================
-- CREATOR PROFILE
-- ========================================
CREATE TABLE IF NOT EXISTS "CreatorProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL UNIQUE,
  
  -- Profile info
  "username" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "bio" TEXT,
  "avatar" TEXT,
  "coverImage" TEXT,
  "website" TEXT,
  
  -- Social links
  "socialLinks" JSONB, -- { twitter, instagram, dribbble, etc. }
  
  -- Stats
  "templatesCount" INTEGER DEFAULT 0,
  "totalSales" INTEGER DEFAULT 0,
  "totalEarningsCents" INTEGER DEFAULT 0,
  "followersCount" INTEGER DEFAULT 0,
  "followingCount" INTEGER DEFAULT 0,
  "averageRating" FLOAT DEFAULT 0,
  
  -- Stripe Connect
  "stripeConnectId" TEXT,
  "payoutEnabled" BOOLEAN DEFAULT false,
  
  -- Verification
  "verified" BOOLEAN DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  
  -- Status
  "status" TEXT DEFAULT 'active', -- active, suspended, banned
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CreatorProfile_username_key" ON "CreatorProfile"("username");
CREATE INDEX IF NOT EXISTS "CreatorProfile_userId_idx" ON "CreatorProfile"("userId");
CREATE INDEX IF NOT EXISTS "CreatorProfile_verified_idx" ON "CreatorProfile"("verified");
CREATE INDEX IF NOT EXISTS "CreatorProfile_status_idx" ON "CreatorProfile"("status");

-- ========================================
-- TEMPLATE PURCHASE
-- ========================================
CREATE TABLE IF NOT EXISTS "TemplatePurchase" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  
  -- Pricing
  "priceCents" INTEGER NOT NULL,
  "platformFeeCents" INTEGER NOT NULL,
  "creatorRevenueCents" INTEGER NOT NULL,
  
  -- Payment
  "stripePaymentIntentId" TEXT,
  "paymentStatus" TEXT DEFAULT 'pending', -- pending, succeeded, failed, refunded
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "TemplatePurchase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TemplatePurchase_templateId_idx" ON "TemplatePurchase"("templateId");
CREATE INDEX IF NOT EXISTS "TemplatePurchase_buyerId_idx" ON "TemplatePurchase"("buyerId");
CREATE INDEX IF NOT EXISTS "TemplatePurchase_creatorId_idx" ON "TemplatePurchase"("creatorId");
CREATE INDEX IF NOT EXISTS "TemplatePurchase_paymentStatus_idx" ON "TemplatePurchase"("paymentStatus");

-- ========================================
-- CREATOR PAYOUT
-- ========================================
CREATE TABLE IF NOT EXISTS "CreatorPayout" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  
  -- Amounts
  "totalRevenueCents" INTEGER NOT NULL,
  "platformFeeCents" INTEGER NOT NULL,
  "netAmountCents" INTEGER NOT NULL,
  
  -- Stripe
  "stripeTransferId" TEXT,
  "stripePayoutId" TEXT,
  
  -- Status
  "status" TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  "failureReason" TEXT,
  
  -- Period
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),
  
  CONSTRAINT "CreatorPayout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CreatorPayout_creatorId_idx" ON "CreatorPayout"("creatorId");
CREATE INDEX IF NOT EXISTS "CreatorPayout_status_idx" ON "CreatorPayout"("status");
CREATE INDEX IF NOT EXISTS "CreatorPayout_periodStart_idx" ON "CreatorPayout"("periodStart");
CREATE INDEX IF NOT EXISTS "CreatorPayout_periodEnd_idx" ON "CreatorPayout"("periodEnd");

-- ========================================
-- ENGAGEMENT (Likes, Follows, Reviews)
-- ========================================
CREATE TABLE IF NOT EXISTS "TemplateLike" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "TemplateLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TemplateLike_templateId_userId_key" ON "TemplateLike"("templateId", "userId");
CREATE INDEX IF NOT EXISTS "TemplateLike_templateId_idx" ON "TemplateLike"("templateId");
CREATE INDEX IF NOT EXISTS "TemplateLike_userId_idx" ON "TemplateLike"("userId");

CREATE TABLE IF NOT EXISTS "CreatorFollow" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "CreatorFollow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CreatorFollow_followerId_followingId_key" ON "CreatorFollow"("followerId", "followingId");
CREATE INDEX IF NOT EXISTS "CreatorFollow_followerId_idx" ON "CreatorFollow"("followerId");
CREATE INDEX IF NOT EXISTS "CreatorFollow_followingId_idx" ON "CreatorFollow"("followingId");

CREATE TABLE IF NOT EXISTS "TemplateReview" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purchaseId" TEXT, -- Optionnel: seulement si acheté
  
  "rating" INTEGER NOT NULL, -- 1-5
  "comment" TEXT,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "TemplateReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TemplateReview_templateId_userId_key" ON "TemplateReview"("templateId", "userId");
CREATE INDEX IF NOT EXISTS "TemplateReview_templateId_idx" ON "TemplateReview"("templateId");
CREATE INDEX IF NOT EXISTS "TemplateReview_userId_idx" ON "TemplateReview"("userId");
CREATE INDEX IF NOT EXISTS "TemplateReview_rating_idx" ON "TemplateReview"("rating");

CREATE TABLE IF NOT EXISTS "TemplateFavorite" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "TemplateFavorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TemplateFavorite_templateId_userId_key" ON "TemplateFavorite"("templateId", "userId");
CREATE INDEX IF NOT EXISTS "TemplateFavorite_templateId_idx" ON "TemplateFavorite"("templateId");
CREATE INDEX IF NOT EXISTS "TemplateFavorite_userId_idx" ON "TemplateFavorite"("userId");

-- ========================================
-- COLLECTIONS (Groupes de templates)
-- ========================================
CREATE TABLE IF NOT EXISTS "TemplateCollection" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "thumbnailUrl" TEXT,
  "isPublic" BOOLEAN DEFAULT true,
  
  "templatesCount" INTEGER DEFAULT 0,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "TemplateCollection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TemplateCollection_slug_key" ON "TemplateCollection"("slug");
CREATE INDEX IF NOT EXISTS "TemplateCollection_creatorId_idx" ON "TemplateCollection"("creatorId");

CREATE TABLE IF NOT EXISTS "TemplateCollectionItem" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "TemplateCollectionItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TemplateCollectionItem_collectionId_templateId_key" ON "TemplateCollectionItem"("collectionId", "templateId");
CREATE INDEX IF NOT EXISTS "TemplateCollectionItem_collectionId_idx" ON "TemplateCollectionItem"("collectionId");
CREATE INDEX IF NOT EXISTS "TemplateCollectionItem_templateId_idx" ON "TemplateCollectionItem"("templateId");
