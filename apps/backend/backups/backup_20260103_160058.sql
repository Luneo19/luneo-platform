--
-- PostgreSQL database dump
--

\restrict DsfxRJEQgPU4OcV9xaZBPmxpYKqCgBGggEAVproQnn4quP4QIhk4EMHpqmnHWpB

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AIGenerationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AIGenerationStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."AIGenerationStatus" OWNER TO postgres;

--
-- Name: AIGenerationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AIGenerationType" AS ENUM (
    'IMAGE_2D',
    'MODEL_3D',
    'ANIMATION',
    'TEMPLATE'
);


ALTER TYPE public."AIGenerationType" OWNER TO postgres;

--
-- Name: AlertSeverity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AlertSeverity" AS ENUM (
    'INFO',
    'WARNING',
    'ERROR',
    'CRITICAL'
);


ALTER TYPE public."AlertSeverity" OWNER TO postgres;

--
-- Name: AlertStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AlertStatus" AS ENUM (
    'ACTIVE',
    'ACKNOWLEDGED',
    'RESOLVED',
    'SUPPRESSED'
);


ALTER TYPE public."AlertStatus" OWNER TO postgres;

--
-- Name: BrandStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BrandStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'PENDING_VERIFICATION',
    'VERIFIED'
);


ALTER TYPE public."BrandStatus" OWNER TO postgres;

--
-- Name: CustomizationEffect; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CustomizationEffect" AS ENUM (
    'NORMAL',
    'EMBOSSED',
    'ENGRAVED',
    'THREE_D'
);


ALTER TYPE public."CustomizationEffect" OWNER TO postgres;

--
-- Name: CustomizationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CustomizationStatus" AS ENUM (
    'PENDING',
    'GENERATING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."CustomizationStatus" OWNER TO postgres;

--
-- Name: DesignStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DesignStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."DesignStatus" OWNER TO postgres;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MessageType" AS ENUM (
    'USER',
    'AGENT',
    'SYSTEM',
    'INTERNAL'
);


ALTER TYPE public."MessageType" OWNER TO postgres;

--
-- Name: MetricType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MetricType" AS ENUM (
    'COUNTER',
    'GAUGE',
    'HISTOGRAM',
    'SUMMARY'
);


ALTER TYPE public."MetricType" OWNER TO postgres;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'CREATED',
    'PENDING_PAYMENT',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'SUCCEEDED',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: ResourceType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ResourceType" AS ENUM (
    'ANALYTICS_REPORT',
    'AI_GENERATION',
    'DESIGN',
    'PRODUCT',
    'ORDER',
    'CUSTOMIZATION'
);


ALTER TYPE public."ResourceType" OWNER TO postgres;

--
-- Name: ServiceHealthStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ServiceHealthStatus" AS ENUM (
    'HEALTHY',
    'DEGRADED',
    'UNHEALTHY',
    'UNKNOWN'
);


ALTER TYPE public."ServiceHealthStatus" OWNER TO postgres;

--
-- Name: TicketCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketCategory" AS ENUM (
    'BILLING',
    'TECHNICAL',
    'ACCOUNT',
    'FEATURE_REQUEST',
    'BUG',
    'INTEGRATION',
    'OTHER'
);


ALTER TYPE public."TicketCategory" OWNER TO postgres;

--
-- Name: TicketPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."TicketPriority" OWNER TO postgres;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'WAITING_CUSTOMER',
    'RESOLVED',
    'CLOSED',
    'CANCELLED'
);


ALTER TYPE public."TicketStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'CONSUMER',
    'BRAND_USER',
    'BRAND_ADMIN',
    'PLATFORM_ADMIN',
    'FABRICATOR'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: WebhookEventType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WebhookEventType" AS ENUM (
    'ORDER_CREATED',
    'ORDER_UPDATED',
    'ORDER_PAID',
    'DESIGN_CREATED',
    'DESIGN_COMPLETED',
    'PRODUCT_UPDATED'
);


ALTER TYPE public."WebhookEventType" OWNER TO postgres;

--
-- Name: ZoneType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ZoneType" AS ENUM (
    'TEXT',
    'IMAGE',
    'PATTERN',
    'COLOR'
);


ALTER TYPE public."ZoneType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AICollection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AICollection" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isShared" boolean DEFAULT false NOT NULL,
    "userId" text NOT NULL,
    "brandId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AICollection" OWNER TO postgres;

--
-- Name: AICollectionGeneration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AICollectionGeneration" (
    id text NOT NULL,
    "collectionId" text NOT NULL,
    "generationId" text NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AICollectionGeneration" OWNER TO postgres;

--
-- Name: AICost; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AICost" (
    id text NOT NULL,
    provider text NOT NULL,
    model text NOT NULL,
    "costCents" integer NOT NULL,
    tokens integer,
    duration integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "brandId" text NOT NULL
);


ALTER TABLE public."AICost" OWNER TO postgres;

--
-- Name: AIGeneration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AIGeneration" (
    id text NOT NULL,
    type public."AIGenerationType" NOT NULL,
    prompt text NOT NULL,
    "negativePrompt" text,
    model text NOT NULL,
    provider text NOT NULL,
    parameters jsonb NOT NULL,
    status public."AIGenerationStatus" DEFAULT 'PENDING'::public."AIGenerationStatus" NOT NULL,
    "resultUrl" text,
    "thumbnailUrl" text,
    credits integer DEFAULT 0 NOT NULL,
    "costCents" integer DEFAULT 0 NOT NULL,
    duration integer,
    quality double precision,
    error text,
    "userId" text NOT NULL,
    "brandId" text NOT NULL,
    "parentGenerationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AIGeneration" OWNER TO postgres;

--
-- Name: AIVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AIVersion" (
    id text NOT NULL,
    "generationId" text NOT NULL,
    version integer NOT NULL,
    prompt text NOT NULL,
    parameters jsonb NOT NULL,
    "resultUrl" text NOT NULL,
    quality double precision,
    credits integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AIVersion" OWNER TO postgres;

--
-- Name: Alert; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Alert" (
    id text NOT NULL,
    severity public."AlertSeverity" DEFAULT 'WARNING'::public."AlertSeverity" NOT NULL,
    status public."AlertStatus" DEFAULT 'ACTIVE'::public."AlertStatus" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    service text,
    metric text,
    threshold double precision,
    "currentValue" double precision,
    "acknowledgedBy" text,
    "acknowledgedAt" timestamp(3) without time zone,
    "resolvedBy" text,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedReason" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Alert" OWNER TO postgres;

--
-- Name: AlertRule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AlertRule" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    service text NOT NULL,
    metric text NOT NULL,
    condition text NOT NULL,
    threshold double precision NOT NULL,
    severity public."AlertSeverity" DEFAULT 'WARNING'::public."AlertSeverity" NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    cooldown integer DEFAULT 300 NOT NULL,
    "lastTriggered" timestamp(3) without time zone,
    "triggerCount" integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AlertRule" OWNER TO postgres;

--
-- Name: AnalyticsCohort; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AnalyticsCohort" (
    id text NOT NULL,
    "cohortDate" timestamp(3) without time zone NOT NULL,
    period integer NOT NULL,
    retention double precision NOT NULL,
    revenue double precision NOT NULL,
    "userCount" integer NOT NULL,
    "brandId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AnalyticsCohort" OWNER TO postgres;

--
-- Name: AnalyticsEvent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AnalyticsEvent" (
    id text NOT NULL,
    "eventType" text NOT NULL,
    "userId" text,
    "sessionId" text,
    properties jsonb NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "brandId" text NOT NULL
);


ALTER TABLE public."AnalyticsEvent" OWNER TO postgres;

--
-- Name: AnalyticsFunnel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AnalyticsFunnel" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    steps jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "brandId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AnalyticsFunnel" OWNER TO postgres;

--
-- Name: AnalyticsPrediction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AnalyticsPrediction" (
    id text NOT NULL,
    type text NOT NULL,
    value double precision NOT NULL,
    confidence double precision NOT NULL,
    period text NOT NULL,
    metadata jsonb,
    "brandId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AnalyticsPrediction" OWNER TO postgres;

--
-- Name: AnalyticsSegment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AnalyticsSegment" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    criteria jsonb NOT NULL,
    "userCount" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "brandId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AnalyticsSegment" OWNER TO postgres;

--
-- Name: ApiKey; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ApiKey" (
    id text NOT NULL,
    name text NOT NULL,
    key text NOT NULL,
    scopes text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "lastUsedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "brandId" text NOT NULL,
    permissions text[],
    "rateLimit" jsonb,
    secret text
);


ALTER TABLE public."ApiKey" OWNER TO postgres;

--
-- Name: Artisan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Artisan" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "businessName" text NOT NULL,
    "legalName" text,
    "taxId" text,
    address jsonb,
    phone text,
    email text,
    website text,
    "kycStatus" text DEFAULT 'pending'::text NOT NULL,
    "kycVerifiedAt" timestamp(3) without time zone,
    "kycDocuments" jsonb,
    "stripeAccountId" text,
    "stripeAccountStatus" text,
    "onboardingCompleted" boolean DEFAULT false NOT NULL,
    "maxVolume" integer DEFAULT 10 NOT NULL,
    "currentLoad" integer DEFAULT 0 NOT NULL,
    "averageLeadTime" integer DEFAULT 7 NOT NULL,
    "minOrderValue" integer DEFAULT 0 NOT NULL,
    "supportedMaterials" text[],
    "supportedTechniques" text[],
    "supportedZones" text[],
    "qualityScore" double precision DEFAULT 5.0 NOT NULL,
    "totalOrders" integer DEFAULT 0 NOT NULL,
    "completedOrders" integer DEFAULT 0 NOT NULL,
    "onTimeDeliveryRate" double precision DEFAULT 1.0 NOT NULL,
    "defectRate" double precision DEFAULT 0.0 NOT NULL,
    "returnRate" double precision DEFAULT 0.0 NOT NULL,
    "slaLevel" text DEFAULT 'standard'::text NOT NULL,
    "slaPenalties" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "slaBonuses" jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "quarantineReason" text,
    "quarantineUntil" timestamp(3) without time zone,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    "payoutSchedule" text DEFAULT 'weekly'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Artisan" OWNER TO postgres;

--
-- Name: ArtisanCapability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ArtisanCapability" (
    id text NOT NULL,
    "artisanId" text NOT NULL,
    material text NOT NULL,
    technique text NOT NULL,
    "maxSize" double precision,
    "minSize" double precision,
    "leadTime" integer,
    "costMultiplier" double precision DEFAULT 1.0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ArtisanCapability" OWNER TO postgres;

--
-- Name: Asset; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    "designId" text NOT NULL,
    url text NOT NULL,
    type text NOT NULL,
    format text NOT NULL,
    size integer NOT NULL,
    width integer,
    height integer,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Asset" OWNER TO postgres;

--
-- Name: Attribution; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Attribution" (
    id text NOT NULL,
    "userId" text,
    "sessionId" text NOT NULL,
    source text NOT NULL,
    medium text,
    campaign text,
    term text,
    content text,
    referrer text,
    "landingPage" text NOT NULL,
    device jsonb NOT NULL,
    location jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Attribution" OWNER TO postgres;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "eventType" text NOT NULL,
    "userId" text NOT NULL,
    "resourceType" text NOT NULL,
    "resourceId" text NOT NULL,
    action text NOT NULL,
    success boolean DEFAULT true NOT NULL,
    metadata jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress" text,
    "userAgent" text
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: BatchRenderProgress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BatchRenderProgress" (
    id text NOT NULL,
    "batchId" text NOT NULL,
    completed integer NOT NULL,
    total integer NOT NULL,
    percentage integer NOT NULL,
    results jsonb,
    "lastUpdated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BatchRenderProgress" OWNER TO postgres;

--
-- Name: Brand; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Brand" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    logo text,
    website text,
    status public."BrandStatus" DEFAULT 'PENDING_VERIFICATION'::public."BrandStatus" NOT NULL,
    "companyName" text,
    "vatNumber" text,
    address text,
    city text,
    country text,
    "postalCode" text,
    phone text,
    "stripeCustomerId" text,
    plan text DEFAULT 'starter'::text NOT NULL,
    "planExpiresAt" timestamp(3) without time zone,
    settings jsonb,
    "webhookUrl" text,
    "webhookSecret" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    limits jsonb,
    "stripeSubscriptionId" text,
    "aiCostLimitCents" integer DEFAULT 500000,
    "aiCostResetAt" timestamp(3) without time zone,
    "aiCostUsedCents" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Brand" OWNER TO postgres;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    "resourceType" public."ResourceType" NOT NULL,
    "resourceId" text NOT NULL,
    content text NOT NULL,
    "parentId" text,
    "authorId" text NOT NULL,
    "sharedResourceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Comment" OWNER TO postgres;

--
-- Name: Conversion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Conversion" (
    id text NOT NULL,
    "userId" text,
    "sessionId" text NOT NULL,
    "experimentId" text,
    "variantId" text,
    "eventType" text NOT NULL,
    value integer,
    attribution jsonb NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Conversion" OWNER TO postgres;

--
-- Name: CreditPack; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CreditPack" (
    id text NOT NULL,
    name text NOT NULL,
    credits integer NOT NULL,
    price_cents integer NOT NULL,
    stripe_price_id text,
    is_active boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    savings integer,
    badge text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CreditPack" OWNER TO postgres;

--
-- Name: CreditTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CreditTransaction" (
    id text NOT NULL,
    user_id text NOT NULL,
    pack_id text,
    amount integer NOT NULL,
    balance_before integer NOT NULL,
    balance_after integer NOT NULL,
    type text NOT NULL,
    source text,
    metadata jsonb,
    stripe_session_id text,
    stripe_payment_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CreditTransaction" OWNER TO postgres;

--
-- Name: CustomizableArea; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CustomizableArea" (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    description text,
    x double precision DEFAULT 0 NOT NULL,
    y double precision DEFAULT 0 NOT NULL,
    width double precision NOT NULL,
    height double precision NOT NULL,
    "minWidth" double precision,
    "maxWidth" double precision,
    "minHeight" double precision,
    "maxHeight" double precision,
    "aspectRatio" double precision,
    "allowedLayerTypes" text[] DEFAULT ARRAY['text'::text, 'image'::text, 'shape'::text],
    "maxTextLength" integer,
    "allowedFonts" text[],
    "defaultFont" text,
    "defaultFontSize" integer,
    "allowedFontSizes" integer[],
    "maxImageSize" integer,
    "allowedFormats" text[] DEFAULT ARRAY['png'::text, 'jpg'::text, 'jpeg'::text, 'svg'::text, 'webp'::text],
    "minImageWidth" integer,
    "minImageHeight" integer,
    "maxImageWidth" integer,
    "maxImageHeight" integer,
    "allowedShapes" text[] DEFAULT ARRAY['rectangle'::text, 'circle'::text, 'triangle'::text, 'polygon'::text, 'star'::text],
    "allowedColors" text[],
    "defaultColor" text DEFAULT '#000000'::text,
    "isRequired" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CustomizableArea" OWNER TO postgres;

--
-- Name: Customization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Customization" (
    id text NOT NULL,
    name text,
    description text,
    prompt text NOT NULL,
    "promptHash" text,
    "zoneId" text NOT NULL,
    "productId" text NOT NULL,
    font text,
    color text,
    size integer,
    effect public."CustomizationEffect" DEFAULT 'ENGRAVED'::public."CustomizationEffect" NOT NULL,
    orientation text,
    options jsonb,
    status public."CustomizationStatus" DEFAULT 'PENDING'::public."CustomizationStatus" NOT NULL,
    "jobId" text,
    "textureUrl" text,
    "modelUrl" text,
    "previewUrl" text,
    "highResUrl" text,
    "arModelUrl" text,
    metadata jsonb,
    "errorMessage" text,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "costCents" integer DEFAULT 0 NOT NULL,
    "processingTimeMs" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "userId" text,
    "brandId" text,
    "designId" text,
    "orderId" text,
    "snapshotId" text
);


ALTER TABLE public."Customization" OWNER TO postgres;

--
-- Name: Design; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Design" (
    id text NOT NULL,
    name text,
    description text,
    prompt text NOT NULL,
    "promptHash" text,
    options jsonb NOT NULL,
    status public."DesignStatus" DEFAULT 'PENDING'::public."DesignStatus" NOT NULL,
    "previewUrl" text,
    "highResUrl" text,
    metadata jsonb,
    "costCents" integer DEFAULT 0 NOT NULL,
    provider text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "userId" text,
    "brandId" text NOT NULL,
    "productId" text NOT NULL,
    "imageUrl" text,
    "optionsJson" jsonb,
    "renderUrl" text,
    "specId" text,
    "canvasBackgroundColor" text DEFAULT '#ffffff'::text,
    "canvasHeight" integer,
    "canvasWidth" integer,
    "designData" jsonb
);


ALTER TABLE public."Design" OWNER TO postgres;

--
-- Name: DesignDNA; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DesignDNA" (
    id text NOT NULL,
    "designId" text NOT NULL,
    story text,
    tags text[],
    embedding jsonb,
    parameters jsonb,
    "conversionData" jsonb,
    "productionData" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DesignDNA" OWNER TO postgres;

--
-- Name: DesignLayer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DesignLayer" (
    id text NOT NULL,
    "designId" text NOT NULL,
    type text NOT NULL,
    x double precision DEFAULT 0 NOT NULL,
    y double precision DEFAULT 0 NOT NULL,
    rotation double precision DEFAULT 0 NOT NULL,
    "scaleX" double precision DEFAULT 1 NOT NULL,
    "scaleY" double precision DEFAULT 1 NOT NULL,
    opacity double precision DEFAULT 1 NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    locked boolean DEFAULT false NOT NULL,
    data jsonb NOT NULL,
    "zIndex" integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DesignLayer" OWNER TO postgres;

--
-- Name: DesignSpec; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DesignSpec" (
    id text NOT NULL,
    "specVersion" text DEFAULT '1.0.0'::text NOT NULL,
    "specHash" text NOT NULL,
    spec jsonb NOT NULL,
    "productId" text NOT NULL,
    "zoneInputs" jsonb NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DesignSpec" OWNER TO postgres;

--
-- Name: EcommerceIntegration; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EcommerceIntegration" (
    id text NOT NULL,
    "brandId" text NOT NULL,
    platform text NOT NULL,
    "shopDomain" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    config jsonb NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "lastSyncAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EcommerceIntegration" OWNER TO postgres;

--
-- Name: Experiment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Experiment" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    type text NOT NULL,
    variants jsonb NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "targetAudience" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Experiment" OWNER TO postgres;

--
-- Name: ExperimentAssignment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ExperimentAssignment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "experimentId" text NOT NULL,
    "variantId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ExperimentAssignment" OWNER TO postgres;

--
-- Name: ExportResult; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ExportResult" (
    id text NOT NULL,
    "renderId" text NOT NULL,
    format text NOT NULL,
    url text NOT NULL,
    size integer NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ExportResult" OWNER TO postgres;

--
-- Name: FraudCheck; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FraudCheck" (
    id text NOT NULL,
    "userId" text,
    email text,
    "ipAddress" text,
    "deviceFingerprint" text,
    "orderValue" integer,
    "actionType" text NOT NULL,
    "riskScore" integer NOT NULL,
    "riskLevel" text NOT NULL,
    reasons text[],
    action text NOT NULL,
    checks jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FraudCheck" OWNER TO postgres;

--
-- Name: IPClaim; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."IPClaim" (
    id text NOT NULL,
    "claimantName" text NOT NULL,
    "claimantEmail" text NOT NULL,
    "claimantType" text NOT NULL,
    "designId" text NOT NULL,
    description text NOT NULL,
    evidence text[],
    status text DEFAULT 'pending'::text NOT NULL,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    resolution text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."IPClaim" OWNER TO postgres;

--
-- Name: KnowledgeBaseArticle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."KnowledgeBaseArticle" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    excerpt text,
    category text NOT NULL,
    tags text[],
    "isPublished" boolean DEFAULT false NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    helpful integer DEFAULT 0 NOT NULL,
    "notHelpful" integer DEFAULT 0 NOT NULL,
    "authorId" text NOT NULL,
    "lastUpdatedBy" text,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."KnowledgeBaseArticle" OWNER TO postgres;

--
-- Name: ModerationRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ModerationRecord" (
    id text NOT NULL,
    type text NOT NULL,
    content text NOT NULL,
    context jsonb,
    approved boolean NOT NULL,
    confidence double precision NOT NULL,
    categories text[],
    reason text,
    action text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ModerationRecord" OWNER TO postgres;

--
-- Name: MonitoringMetric; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MonitoringMetric" (
    id text NOT NULL,
    service text NOT NULL,
    metric text NOT NULL,
    value double precision NOT NULL,
    unit text,
    labels jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MonitoringMetric" OWNER TO postgres;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    read boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "actionUrl" text,
    "actionLabel" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: OAuthAccount; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OAuthAccount" (
    id text NOT NULL,
    provider text NOT NULL,
    "providerId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."OAuthAccount" OWNER TO postgres;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    status public."OrderStatus" DEFAULT 'CREATED'::public."OrderStatus" NOT NULL,
    "customerEmail" text NOT NULL,
    "customerName" text,
    "customerPhone" text,
    "shippingAddress" jsonb,
    "subtotalCents" integer NOT NULL,
    "taxCents" integer DEFAULT 0 NOT NULL,
    "shippingCents" integer DEFAULT 0 NOT NULL,
    "totalCents" integer NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "stripeSessionId" text,
    "stripePaymentId" text,
    "trackingNumber" text,
    "trackingUrl" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "shippedAt" timestamp(3) without time zone,
    "userId" text,
    "brandId" text NOT NULL,
    "designId" text,
    "productId" text,
    metadata jsonb,
    "productionBundleUrl" text,
    "userEmail" text
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "designId" text,
    "snapshotId" text,
    quantity integer DEFAULT 1 NOT NULL,
    "priceCents" integer NOT NULL,
    "totalCents" integer NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO postgres;

--
-- Name: OutboxEvent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OutboxEvent" (
    id text NOT NULL,
    "eventType" text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OutboxEvent" OWNER TO postgres;

--
-- Name: Payout; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payout" (
    id text NOT NULL,
    "artisanId" text NOT NULL,
    "stripeTransferId" text,
    "amountCents" integer NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    "feesCents" integer DEFAULT 0 NOT NULL,
    "netAmountCents" integer NOT NULL,
    "periodStart" timestamp(3) without time zone NOT NULL,
    "periodEnd" timestamp(3) without time zone NOT NULL,
    "workOrderIds" text[],
    status text DEFAULT 'pending'::text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "failureReason" text,
    "reserveCents" integer DEFAULT 0 NOT NULL,
    "reserveReleaseAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payout" OWNER TO postgres;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    sku text,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    images text[],
    "model3dUrl" text,
    "modelConfig" jsonb,
    "customizationOptions" jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "brandId" text NOT NULL,
    "baseCostCents" integer,
    "finishOptions" jsonb,
    "laborCostCents" integer,
    "materialOptions" jsonb,
    "overheadCostCents" integer,
    "productionTime" integer,
    "rulesJson" jsonb,
    "baseAssetUrl" text
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: ProductMapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductMapping" (
    id text NOT NULL,
    "integrationId" text NOT NULL,
    "luneoProductId" text NOT NULL,
    "externalProductId" text NOT NULL,
    "externalSku" text NOT NULL,
    "syncStatus" text DEFAULT 'synced'::text NOT NULL,
    "lastSyncedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb
);


ALTER TABLE public."ProductMapping" OWNER TO postgres;

--
-- Name: ProductionStatus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductionStatus" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "currentStage" text NOT NULL,
    message text NOT NULL,
    percentage integer NOT NULL,
    "lastUpdated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProductionStatus" OWNER TO postgres;

--
-- Name: PromptTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PromptTemplate" (
    id text NOT NULL,
    name text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    occasion text,
    style text,
    prompt text NOT NULL,
    variables jsonb,
    constraints jsonb,
    "brandKit" jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PromptTemplate" OWNER TO postgres;

--
-- Name: QualityReport; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."QualityReport" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "overallScore" double precision NOT NULL,
    issues text[],
    recommendations text[],
    passed boolean NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."QualityReport" OWNER TO postgres;

--
-- Name: Quote; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Quote" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "artisanId" text NOT NULL,
    "priceCents" integer NOT NULL,
    "leadTime" integer NOT NULL,
    breakdown jsonb NOT NULL,
    "qualityScore" double precision,
    "costScore" double precision,
    "leadTimeScore" double precision,
    "distanceScore" double precision,
    "overallScore" double precision,
    status text DEFAULT 'pending'::text NOT NULL,
    "selectedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Quote" OWNER TO postgres;

--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."RefreshToken" OWNER TO postgres;

--
-- Name: RenderError; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RenderError" (
    id text NOT NULL,
    "renderId" text NOT NULL,
    error text NOT NULL,
    "occurredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RenderError" OWNER TO postgres;

--
-- Name: RenderProgress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RenderProgress" (
    id text NOT NULL,
    "renderId" text NOT NULL,
    stage text NOT NULL,
    percentage integer NOT NULL,
    message text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RenderProgress" OWNER TO postgres;

--
-- Name: RenderResult; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RenderResult" (
    id text NOT NULL,
    "renderId" text NOT NULL,
    type text NOT NULL,
    status text NOT NULL,
    url text,
    "thumbnailUrl" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "snapshotId" text,
    "designId" text,
    "customizationId" text
);


ALTER TABLE public."RenderResult" OWNER TO postgres;

--
-- Name: SLARecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SLARecord" (
    id text NOT NULL,
    "workOrderId" text NOT NULL,
    "artisanId" text NOT NULL,
    deadline timestamp(3) without time zone NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "onTime" boolean,
    "delayHours" integer,
    "penaltyCents" integer DEFAULT 0 NOT NULL,
    "bonusCents" integer DEFAULT 0 NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SLARecord" OWNER TO postgres;

--
-- Name: ServiceHealth; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ServiceHealth" (
    id text NOT NULL,
    service text NOT NULL,
    status public."ServiceHealthStatus" DEFAULT 'UNKNOWN'::public."ServiceHealthStatus" NOT NULL,
    latency integer,
    "lastCheck" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastSuccess" timestamp(3) without time zone,
    "failureCount" integer DEFAULT 0 NOT NULL,
    message text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ServiceHealth" OWNER TO postgres;

--
-- Name: SharedResource; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SharedResource" (
    id text NOT NULL,
    "resourceType" public."ResourceType" NOT NULL,
    "resourceId" text NOT NULL,
    "sharedWith" text[],
    permissions jsonb NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "publicToken" text,
    "createdBy" text NOT NULL,
    "brandId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SharedResource" OWNER TO postgres;

--
-- Name: Snapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Snapshot" (
    id text NOT NULL,
    "specId" text NOT NULL,
    "specHash" text NOT NULL,
    "specData" jsonb NOT NULL,
    "previewUrl" text,
    "preview3dUrl" text,
    "thumbnailUrl" text,
    "productionBundleUrl" text,
    "arModelUrl" text,
    "gltfModelUrl" text,
    "assetVersions" jsonb,
    "isValidated" boolean DEFAULT false NOT NULL,
    "validatedBy" text,
    "validatedAt" timestamp(3) without time zone,
    "isLocked" boolean DEFAULT false NOT NULL,
    "lockedAt" timestamp(3) without time zone,
    "createdBy" text,
    provenance jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Snapshot" OWNER TO postgres;

--
-- Name: SyncLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SyncLog" (
    id text NOT NULL,
    "integrationId" text NOT NULL,
    type text NOT NULL,
    direction text NOT NULL,
    status text NOT NULL,
    "itemsProcessed" integer DEFAULT 0 NOT NULL,
    "itemsFailed" integer DEFAULT 0 NOT NULL,
    errors jsonb,
    duration integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SyncLog" OWNER TO postgres;

--
-- Name: SystemConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemConfig" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemConfig" OWNER TO postgres;

--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Ticket" (
    id text NOT NULL,
    "ticketNumber" text NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    status public."TicketStatus" DEFAULT 'OPEN'::public."TicketStatus" NOT NULL,
    priority public."TicketPriority" DEFAULT 'MEDIUM'::public."TicketPriority" NOT NULL,
    category public."TicketCategory" DEFAULT 'TECHNICAL'::public."TicketCategory" NOT NULL,
    "userId" text NOT NULL,
    "assignedTo" text,
    "assignedAt" timestamp(3) without time zone,
    tags text[],
    metadata jsonb,
    "firstResponseAt" timestamp(3) without time zone,
    "resolvedAt" timestamp(3) without time zone,
    "closedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Ticket" OWNER TO postgres;

--
-- Name: TicketActivity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TicketActivity" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    action text NOT NULL,
    "userId" text,
    "oldValue" text,
    "newValue" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TicketActivity" OWNER TO postgres;

--
-- Name: TicketAttachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TicketAttachment" (
    id text NOT NULL,
    "ticketId" text,
    "messageId" text,
    "fileName" text NOT NULL,
    "fileUrl" text NOT NULL,
    "fileSize" integer NOT NULL,
    "mimeType" text NOT NULL,
    "uploadedBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TicketAttachment" OWNER TO postgres;

--
-- Name: TicketMessage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TicketMessage" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    type public."MessageType" DEFAULT 'USER'::public."MessageType" NOT NULL,
    content text NOT NULL,
    "userId" text,
    "isInternal" boolean DEFAULT false NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TicketMessage" OWNER TO postgres;

--
-- Name: UsageMetric; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UsageMetric" (
    id text NOT NULL,
    "brandId" text NOT NULL,
    metric text NOT NULL,
    value integer NOT NULL,
    unit text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb
);


ALTER TABLE public."UsageMetric" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text,
    "firstName" text,
    "lastName" text,
    avatar text,
    role public."UserRole" DEFAULT 'CONSUMER'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "brandId" text,
    name text,
    ai_credits integer DEFAULT 0 NOT NULL,
    ai_credits_purchased integer DEFAULT 0 NOT NULL,
    ai_credits_used integer DEFAULT 0 NOT NULL,
    last_credit_purchase timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserConsent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserConsent" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "consentType" text NOT NULL,
    granted boolean DEFAULT false NOT NULL,
    "recordedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress" text,
    "userAgent" text
);


ALTER TABLE public."UserConsent" OWNER TO postgres;

--
-- Name: UserQuota; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserQuota" (
    id text NOT NULL,
    "monthlyLimit" integer DEFAULT 100 NOT NULL,
    "monthlyUsed" integer DEFAULT 0 NOT NULL,
    "costLimitCents" integer DEFAULT 5000 NOT NULL,
    "costUsedCents" integer DEFAULT 0 NOT NULL,
    "resetAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."UserQuota" OWNER TO postgres;

--
-- Name: WebVital; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WebVital" (
    id text NOT NULL,
    "userId" text,
    "sessionId" text,
    page text NOT NULL,
    metric text NOT NULL,
    value double precision NOT NULL,
    rating text,
    device jsonb,
    connection jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WebVital" OWNER TO postgres;

--
-- Name: Webhook; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Webhook" (
    id text NOT NULL,
    url text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "brandId" text NOT NULL,
    error text,
    event text NOT NULL,
    payload jsonb NOT NULL,
    "statusCode" integer,
    success boolean DEFAULT false NOT NULL,
    "idempotencyKey" text,
    "timestamp" timestamp(3) without time zone
);


ALTER TABLE public."Webhook" OWNER TO postgres;

--
-- Name: WebhookLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WebhookLog" (
    id text NOT NULL,
    "webhookId" text NOT NULL,
    topic text NOT NULL,
    "shopDomain" text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'received'::text NOT NULL,
    "processedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WebhookLog" OWNER TO postgres;

--
-- Name: WorkOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WorkOrder" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "artisanId" text NOT NULL,
    "quoteId" text,
    "routingScore" double precision,
    "routingReason" text,
    "selectedAt" timestamp(3) without time zone,
    status text DEFAULT 'assigned'::text NOT NULL,
    "acceptedAt" timestamp(3) without time zone,
    "startedAt" timestamp(3) without time zone,
    "estimatedCompletion" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "slaDeadline" timestamp(3) without time zone,
    "slaMet" boolean,
    "slaPenaltyCents" integer DEFAULT 0 NOT NULL,
    "slaBonusCents" integer DEFAULT 0 NOT NULL,
    "payoutAmountCents" integer,
    "commissionCents" integer,
    "payoutStatus" text DEFAULT 'pending'::text NOT NULL,
    "payoutId" text,
    "qcScore" double precision,
    "qcPassed" boolean,
    "qcIssues" text[],
    "qcReportId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "snapshotId" text
);


ALTER TABLE public."WorkOrder" OWNER TO postgres;

--
-- Name: Zone; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Zone" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    type public."ZoneType" DEFAULT 'TEXT'::public."ZoneType" NOT NULL,
    "positionX" double precision NOT NULL,
    "positionY" double precision NOT NULL,
    "positionZ" double precision NOT NULL,
    "rotationX" double precision DEFAULT 0 NOT NULL,
    "rotationY" double precision DEFAULT 0 NOT NULL,
    "rotationZ" double precision DEFAULT 0 NOT NULL,
    "scaleX" double precision DEFAULT 1 NOT NULL,
    "scaleY" double precision DEFAULT 1 NOT NULL,
    "scaleZ" double precision DEFAULT 1 NOT NULL,
    "uvMinU" double precision NOT NULL,
    "uvMaxU" double precision NOT NULL,
    "uvMinV" double precision NOT NULL,
    "uvMaxV" double precision NOT NULL,
    "maxChars" integer,
    "allowedFonts" text[],
    "defaultFont" text,
    "defaultColor" text,
    "defaultSize" integer,
    "allowedColors" text[],
    "allowedPatterns" text[],
    "isRequired" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "productId" text NOT NULL
);


ALTER TABLE public."Zone" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: AICollection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AICollection" (id, name, description, "isShared", "userId", "brandId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AICollectionGeneration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AICollectionGeneration" (id, "collectionId", "generationId", "addedAt") FROM stdin;
\.


--
-- Data for Name: AICost; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AICost" (id, provider, model, "costCents", tokens, duration, "createdAt", "brandId") FROM stdin;
\.


--
-- Data for Name: AIGeneration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AIGeneration" (id, type, prompt, "negativePrompt", model, provider, parameters, status, "resultUrl", "thumbnailUrl", credits, "costCents", duration, quality, error, "userId", "brandId", "parentGenerationId", "createdAt", "completedAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIVersion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AIVersion" (id, "generationId", version, prompt, parameters, "resultUrl", quality, credits, "createdAt") FROM stdin;
\.


--
-- Data for Name: Alert; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Alert" (id, severity, status, title, message, service, metric, threshold, "currentValue", "acknowledgedBy", "acknowledgedAt", "resolvedBy", "resolvedAt", "resolvedReason", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AlertRule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AlertRule" (id, name, description, service, metric, condition, threshold, severity, enabled, cooldown, "lastTriggered", "triggerCount", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AnalyticsCohort; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AnalyticsCohort" (id, "cohortDate", period, retention, revenue, "userCount", "brandId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AnalyticsEvent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AnalyticsEvent" (id, "eventType", "userId", "sessionId", properties, "timestamp", "brandId") FROM stdin;
\.


--
-- Data for Name: AnalyticsFunnel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AnalyticsFunnel" (id, name, description, steps, "isActive", "brandId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AnalyticsPrediction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AnalyticsPrediction" (id, type, value, confidence, period, metadata, "brandId", "createdAt") FROM stdin;
\.


--
-- Data for Name: AnalyticsSegment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AnalyticsSegment" (id, name, description, criteria, "userCount", "isActive", "brandId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ApiKey; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ApiKey" (id, name, key, scopes, "isActive", "lastUsedAt", "expiresAt", "createdAt", "updatedAt", "brandId", permissions, "rateLimit", secret) FROM stdin;
\.


--
-- Data for Name: Artisan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Artisan" (id, "userId", "businessName", "legalName", "taxId", address, phone, email, website, "kycStatus", "kycVerifiedAt", "kycDocuments", "stripeAccountId", "stripeAccountStatus", "onboardingCompleted", "maxVolume", "currentLoad", "averageLeadTime", "minOrderValue", "supportedMaterials", "supportedTechniques", "supportedZones", "qualityScore", "totalOrders", "completedOrders", "onTimeDeliveryRate", "defectRate", "returnRate", "slaLevel", "slaPenalties", "slaBonuses", status, "quarantineReason", "quarantineUntil", settings, "payoutSchedule", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ArtisanCapability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ArtisanCapability" (id, "artisanId", material, technique, "maxSize", "minSize", "leadTime", "costMultiplier", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Asset" (id, "designId", url, type, format, size, width, height, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: Attribution; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Attribution" (id, "userId", "sessionId", source, medium, campaign, term, content, referrer, "landingPage", device, location, "timestamp") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "eventType", "userId", "resourceType", "resourceId", action, success, metadata, "timestamp", "ipAddress", "userAgent") FROM stdin;
\.


--
-- Data for Name: BatchRenderProgress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BatchRenderProgress" (id, "batchId", completed, total, percentage, results, "lastUpdated") FROM stdin;
\.


--
-- Data for Name: Brand; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Brand" (id, name, slug, description, logo, website, status, "companyName", "vatNumber", address, city, country, "postalCode", phone, "stripeCustomerId", plan, "planExpiresAt", settings, "webhookUrl", "webhookSecret", "createdAt", "updatedAt", limits, "stripeSubscriptionId", "aiCostLimitCents", "aiCostResetAt", "aiCostUsedCents") FROM stdin;
cmf1eq29e0002t8dqv47wrqoa	Sample Brand	sample-brand	A sample brand for testing	\N	\N	VERIFIED	Sample Brand Ltd	\N	123 Sample Street	Paris	France	75001	+33123456789	\N	premium	\N	\N	\N	\N	2025-09-01 17:42:21.938	2025-09-01 17:42:21.938	\N	\N	500000	\N	0
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Comment" (id, "resourceType", "resourceId", content, "parentId", "authorId", "sharedResourceId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Conversion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Conversion" (id, "userId", "sessionId", "experimentId", "variantId", "eventType", value, attribution, "timestamp") FROM stdin;
\.


--
-- Data for Name: CreditPack; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CreditPack" (id, name, credits, price_cents, stripe_price_id, is_active, is_featured, savings, badge, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: CreditTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CreditTransaction" (id, user_id, pack_id, amount, balance_before, balance_after, type, source, metadata, stripe_session_id, stripe_payment_id, created_at) FROM stdin;
\.


--
-- Data for Name: CustomizableArea; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CustomizableArea" (id, "productId", name, description, x, y, width, height, "minWidth", "maxWidth", "minHeight", "maxHeight", "aspectRatio", "allowedLayerTypes", "maxTextLength", "allowedFonts", "defaultFont", "defaultFontSize", "allowedFontSizes", "maxImageSize", "allowedFormats", "minImageWidth", "minImageHeight", "maxImageWidth", "maxImageHeight", "allowedShapes", "allowedColors", "defaultColor", "isRequired", "isActive", "displayOrder", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Customization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Customization" (id, name, description, prompt, "promptHash", "zoneId", "productId", font, color, size, effect, orientation, options, status, "jobId", "textureUrl", "modelUrl", "previewUrl", "highResUrl", "arModelUrl", metadata, "errorMessage", "retryCount", "costCents", "processingTimeMs", "createdAt", "updatedAt", "completedAt", "userId", "brandId", "designId", "orderId", "snapshotId") FROM stdin;
\.


--
-- Data for Name: Design; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Design" (id, name, description, prompt, "promptHash", options, status, "previewUrl", "highResUrl", metadata, "costCents", provider, "createdAt", "updatedAt", "completedAt", "userId", "brandId", "productId", "imageUrl", "optionsJson", "renderUrl", "specId", "canvasBackgroundColor", "canvasHeight", "canvasWidth", "designData") FROM stdin;
sample-design-1	Design Floral	Design floral élégant	A beautiful floral pattern with roses and leaves	\N	{"style": "realistic", "colors": ["pink", "green"], "resolution": "1024x1024"}	COMPLETED	https://example.com/design-preview.jpg	https://example.com/design-highres.jpg	{"model": "dall-e-3", "tokens": 100, "duration": 5000}	50	openai	2025-09-01 17:42:22.314	2025-09-01 17:42:22.314	2025-09-01 17:42:22.311	cmf1eq2jc0004t8dqayegollw	cmf1eq29e0002t8dqv47wrqoa	sample-product-1	\N	\N	\N	\N	#ffffff	\N	\N	\N
\.


--
-- Data for Name: DesignDNA; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DesignDNA" (id, "designId", story, tags, embedding, parameters, "conversionData", "productionData", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DesignLayer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DesignLayer" (id, "designId", type, x, y, rotation, "scaleX", "scaleY", opacity, visible, locked, data, "zIndex", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DesignSpec; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DesignSpec" (id, "specVersion", "specHash", spec, "productId", "zoneInputs", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EcommerceIntegration; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EcommerceIntegration" (id, "brandId", platform, "shopDomain", "accessToken", "refreshToken", config, status, "lastSyncAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Experiment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Experiment" (id, name, description, type, variants, status, "startDate", "endDate", "targetAudience", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExperimentAssignment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ExperimentAssignment" (id, "userId", "experimentId", "variantId", "assignedAt") FROM stdin;
\.


--
-- Data for Name: ExportResult; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ExportResult" (id, "renderId", format, url, size, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: FraudCheck; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FraudCheck" (id, "userId", email, "ipAddress", "deviceFingerprint", "orderValue", "actionType", "riskScore", "riskLevel", reasons, action, checks, "createdAt") FROM stdin;
\.


--
-- Data for Name: IPClaim; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."IPClaim" (id, "claimantName", "claimantEmail", "claimantType", "designId", description, evidence, status, "reviewedBy", "reviewedAt", resolution, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: KnowledgeBaseArticle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."KnowledgeBaseArticle" (id, title, slug, content, excerpt, category, tags, "isPublished", "isFeatured", views, helpful, "notHelpful", "authorId", "lastUpdatedBy", "publishedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ModerationRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ModerationRecord" (id, type, content, context, approved, confidence, categories, reason, action, "createdAt") FROM stdin;
\.


--
-- Data for Name: MonitoringMetric; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MonitoringMetric" (id, service, metric, value, unit, labels, "timestamp", "createdAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", type, title, message, data, read, "readAt", "actionUrl", "actionLabel", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OAuthAccount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OAuthAccount" (id, provider, "providerId", "accessToken", "refreshToken", "expiresAt", "createdAt", "updatedAt", "userId") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "orderNumber", status, "customerEmail", "customerName", "customerPhone", "shippingAddress", "subtotalCents", "taxCents", "shippingCents", "totalCents", currency, "paymentStatus", "stripeSessionId", "stripePaymentId", "trackingNumber", "trackingUrl", notes, "createdAt", "updatedAt", "paidAt", "shippedAt", "userId", "brandId", "designId", "productId", metadata, "productionBundleUrl", "userEmail") FROM stdin;
sample-order-1	ORD-20241219-001	PAID	customer@example.com	John Doe	+33123456789	{"city": "Lyon", "street": "456 Customer Street", "country": "France", "postalCode": "69001"}	2999	600	0	3599	EUR	SUCCEEDED	\N	pi_sample_123	\N	\N	\N	2025-09-01 17:42:22.324	2025-09-01 17:42:22.324	2025-09-01 17:42:22.323	\N	cmf1eq2jc0004t8dqayegollw	cmf1eq29e0002t8dqv47wrqoa	sample-design-1	sample-product-1	\N	\N	\N
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItem" (id, "orderId", "productId", "designId", "snapshotId", quantity, "priceCents", "totalCents", metadata, "createdAt", "updatedAt") FROM stdin;
b2428845-62b5-4c7c-adc7-da678a020751	sample-order-1	sample-product-1	sample-design-1	\N	1	2999	2999	\N	2025-09-01 17:42:22.324	2025-09-01 17:42:22.324
\.


--
-- Data for Name: OutboxEvent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OutboxEvent" (id, "eventType", payload, status, attempts, "publishedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payout; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payout" (id, "artisanId", "stripeTransferId", "amountCents", currency, "feesCents", "netAmountCents", "periodStart", "periodEnd", "workOrderIds", status, "paidAt", "failureReason", "reserveCents", "reserveReleaseAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, description, sku, price, currency, images, "model3dUrl", "modelConfig", "customizationOptions", "isActive", "isPublic", "createdAt", "updatedAt", "brandId", "baseCostCents", "finishOptions", "laborCostCents", "materialOptions", "overheadCostCents", "productionTime", "rulesJson", "baseAssetUrl") FROM stdin;
sample-product-1	T-Shirt Personnalisé	T-shirt en coton bio personnalisable	TSH-001	29.99	EUR	{https://example.com/tshirt-white.jpg,https://example.com/tshirt-black.jpg}	https://example.com/tshirt-3d.glb	{"scale": 1, "position": [0, 0, 0], "rotation": [0, 0, 0]}	{"sizes": ["S", "M", "L", "XL"], "colors": ["white", "black", "blue", "red"], "materials": ["cotton", "polyester"]}	t	t	2025-09-01 17:42:22.303	2025-09-01 17:42:22.303	cmf1eq29e0002t8dqv47wrqoa	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: ProductMapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductMapping" (id, "integrationId", "luneoProductId", "externalProductId", "externalSku", "syncStatus", "lastSyncedAt", metadata) FROM stdin;
\.


--
-- Data for Name: ProductionStatus; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductionStatus" (id, "orderId", "currentStage", message, percentage, "lastUpdated") FROM stdin;
\.


--
-- Data for Name: PromptTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PromptTemplate" (id, name, version, occasion, style, prompt, variables, constraints, "brandKit", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: QualityReport; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."QualityReport" (id, "orderId", "overallScore", issues, recommendations, passed, "createdAt") FROM stdin;
\.


--
-- Data for Name: Quote; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Quote" (id, "orderId", "artisanId", "priceCents", "leadTime", breakdown, "qualityScore", "costScore", "leadTimeScore", "distanceScore", "overallScore", status, "selectedAt", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RefreshToken" (id, token, "expiresAt", "createdAt", "userId") FROM stdin;
\.


--
-- Data for Name: RenderError; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RenderError" (id, "renderId", error, "occurredAt") FROM stdin;
\.


--
-- Data for Name: RenderProgress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RenderProgress" (id, "renderId", stage, percentage, message, "timestamp") FROM stdin;
\.


--
-- Data for Name: RenderResult; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RenderResult" (id, "renderId", type, status, url, "thumbnailUrl", metadata, "createdAt", "snapshotId", "designId", "customizationId") FROM stdin;
\.


--
-- Data for Name: SLARecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SLARecord" (id, "workOrderId", "artisanId", deadline, "completedAt", "onTime", "delayHours", "penaltyCents", "bonusCents", reason, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ServiceHealth; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ServiceHealth" (id, service, status, latency, "lastCheck", "lastSuccess", "failureCount", message, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SharedResource; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SharedResource" (id, "resourceType", "resourceId", "sharedWith", permissions, "isPublic", "publicToken", "createdBy", "brandId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Snapshot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Snapshot" (id, "specId", "specHash", "specData", "previewUrl", "preview3dUrl", "thumbnailUrl", "productionBundleUrl", "arModelUrl", "gltfModelUrl", "assetVersions", "isValidated", "validatedBy", "validatedAt", "isLocked", "lockedAt", "createdBy", provenance, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SyncLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SyncLog" (id, "integrationId", type, direction, status, "itemsProcessed", "itemsFailed", errors, duration, "createdAt") FROM stdin;
\.


--
-- Data for Name: SystemConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemConfig" (id, key, value, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Ticket" (id, "ticketNumber", subject, description, status, priority, category, "userId", "assignedTo", "assignedAt", tags, metadata, "firstResponseAt", "resolvedAt", "closedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TicketActivity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TicketActivity" (id, "ticketId", action, "userId", "oldValue", "newValue", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: TicketAttachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TicketAttachment" (id, "ticketId", "messageId", "fileName", "fileUrl", "fileSize", "mimeType", "uploadedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: TicketMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TicketMessage" (id, "ticketId", type, content, "userId", "isInternal", "isRead", "readAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UsageMetric; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UsageMetric" (id, "brandId", metric, value, unit, "timestamp", metadata) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, "firstName", "lastName", avatar, role, "isActive", "emailVerified", "lastLoginAt", "createdAt", "updatedAt", "brandId", name, ai_credits, ai_credits_purchased, ai_credits_used, last_credit_purchase) FROM stdin;
cmf1eq2900000t8dqcsy8zzvh	admin@luneo.com	$2a$12$ArjVWm2BImf1U687aUc1EuGrt..SHhdg/yIOTbam4n9H4bmUG85lu	Admin	Luneo	\N	PLATFORM_ADMIN	t	t	\N	2025-09-01 17:42:21.924	2025-09-01 17:42:21.924	\N	\N	0	0	0	\N
cmf1eq2jc0004t8dqayegollw	brand@luneo.com	$2a$12$q/tT6KUBtABObzkqV/yqMeD/z1xQWugA.NttecYNaRJQ89UWTNMSm	Brand	Admin	\N	BRAND_ADMIN	t	t	\N	2025-09-01 17:42:22.296	2025-09-01 17:42:22.296	cmf1eq29e0002t8dqv47wrqoa	\N	0	0	0	\N
\.


--
-- Data for Name: UserConsent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserConsent" (id, "userId", "consentType", granted, "recordedAt", "ipAddress", "userAgent") FROM stdin;
\.


--
-- Data for Name: UserQuota; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserQuota" (id, "monthlyLimit", "monthlyUsed", "costLimitCents", "costUsedCents", "resetAt", "createdAt", "updatedAt", "userId") FROM stdin;
cmf1eq2900001t8dqr9pf001g	1000	0	50000	0	2025-09-01 17:42:21.924	2025-09-01 17:42:21.924	2025-09-01 17:42:21.924	cmf1eq2900000t8dqcsy8zzvh
cmf1eq2jc0005t8dqrsn68cvh	500	0	25000	0	2025-09-01 17:42:22.296	2025-09-01 17:42:22.296	2025-09-01 17:42:22.296	cmf1eq2jc0004t8dqayegollw
\.


--
-- Data for Name: WebVital; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WebVital" (id, "userId", "sessionId", page, metric, value, rating, device, connection, "timestamp") FROM stdin;
\.


--
-- Data for Name: Webhook; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Webhook" (id, url, "createdAt", "brandId", error, event, payload, "statusCode", success, "idempotencyKey", "timestamp") FROM stdin;
\.


--
-- Data for Name: WebhookLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WebhookLog" (id, "webhookId", topic, "shopDomain", payload, status, "processedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: WorkOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WorkOrder" (id, "orderId", "artisanId", "quoteId", "routingScore", "routingReason", "selectedAt", status, "acceptedAt", "startedAt", "estimatedCompletion", "completedAt", "slaDeadline", "slaMet", "slaPenaltyCents", "slaBonusCents", "payoutAmountCents", "commissionCents", "payoutStatus", "payoutId", "qcScore", "qcPassed", "qcIssues", "qcReportId", "createdAt", "updatedAt", "snapshotId") FROM stdin;
\.


--
-- Data for Name: Zone; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Zone" (id, name, description, type, "positionX", "positionY", "positionZ", "rotationX", "rotationY", "rotationZ", "scaleX", "scaleY", "scaleZ", "uvMinU", "uvMaxU", "uvMinV", "uvMaxV", "maxChars", "allowedFonts", "defaultFont", "defaultColor", "defaultSize", "allowedColors", "allowedPatterns", "isRequired", "isActive", "order", metadata, "createdAt", "updatedAt", "productId") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b43b9bcf-2fa4-4fa1-b824-eae2653f44e4	5b909795d96441dc8f07fa05d5566e7ccf69e6dd1a27fa4dd93ca14edc17a892	2025-09-01 19:42:14.288831+02	20250901174214_init	\N	\N	2025-09-01 19:42:14.165855+02	1
3712a4da-a7cf-49b5-acd1-e19ddea2d522	9f5ac38a13384a1c0b4f7031bd1a9619272a29f29b4f1bfc9525f6d01fa5e217	2025-11-07 14:18:47.752107+01	20251015172503_init	\N	\N	2025-11-07 14:18:47.616487+01	1
37726429-2d96-4502-bfce-14436da82751	73e863fb12bf27a75a40bc951c7d0b83dc3bd948afedc7d8aafd3050e00eb427	2025-11-16 21:28:34.24646+01	20251116000000_add_shopify_install	\N	\N	2025-11-16 21:28:34.199827+01	1
1d17473e-9229-4081-9dee-8551d8f75db3	ef5665df739413834bbb6dffc2d94c4c9ce39d659e6989c6690da204bfc82c35	2025-12-19 15:07:39.161722+01	add_lot4_lot6_models	\N	\N	2025-12-19 15:07:37.253903+01	1
ba673989-b5d1-45d7-b178-be60506cf4fc	447bb2e8707857ea43df81831f4ab532fb5618b8619e5410f451aa85ae811f04	\N	add_marketplace_models	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: add_marketplace_models\n\nDatabase error code: 42710\n\nDatabase error:\nERROR: constraint "Artisan_userId_fkey" for relation "Artisan" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42710), message: "constraint \\"Artisan_userId_fkey\\" for relation \\"Artisan\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(8804), routine: Some("ATExecAddConstraint") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="add_marketplace_models"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name="add_marketplace_models"\n             at schema-engine/core/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:226	2025-12-19 15:08:03.879013+01	2025-12-19 15:07:39.163369+01	0
04d7bc59-59bf-48d3-8844-0108f7f223a3	447bb2e8707857ea43df81831f4ab532fb5618b8619e5410f451aa85ae811f04	2025-12-19 15:08:03.881051+01	add_marketplace_models		\N	2025-12-19 15:08:03.881051+01	0
3fcc6871-0850-43af-9431-b3cef5548ca0	5f59e55c862b0b8db46fb24fd56bf63fa2f544329f89e923f08c7cc7af5022fb	2025-12-19 15:08:06.788821+01	add_rls_and_outbox		\N	2025-12-19 15:08:06.788821+01	0
5aae819f-0ab6-40ef-b544-43cb442596a5	2ad25833271e8cf72f6ff86c96a80e14b11d5d6a131f17011e0064a97b303f7b	2025-12-30 12:20:18.190274+01	20241201000000_add_design_spec_snapshot_order_items	\N	\N	2025-12-30 12:20:18.009441+01	1
4139fdb9-790e-4305-813b-f638e05ce11d	a55d963f2f10d80af34d6a76ec39d580df4e31b6ecf3ee41726bf23f07721ac7	2025-12-30 12:23:34.634399+01	20251229100537_add_analytics_ai_collaboration		\N	2025-12-30 12:23:34.634399+01	0
\.


--
-- Name: AICollectionGeneration AICollectionGeneration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AICollectionGeneration"
    ADD CONSTRAINT "AICollectionGeneration_pkey" PRIMARY KEY (id);


--
-- Name: AICollection AICollection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AICollection"
    ADD CONSTRAINT "AICollection_pkey" PRIMARY KEY (id);


--
-- Name: AICost AICost_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AICost"
    ADD CONSTRAINT "AICost_pkey" PRIMARY KEY (id);


--
-- Name: AIGeneration AIGeneration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AIGeneration"
    ADD CONSTRAINT "AIGeneration_pkey" PRIMARY KEY (id);


--
-- Name: AIVersion AIVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AIVersion"
    ADD CONSTRAINT "AIVersion_pkey" PRIMARY KEY (id);


--
-- Name: AlertRule AlertRule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AlertRule"
    ADD CONSTRAINT "AlertRule_pkey" PRIMARY KEY (id);


--
-- Name: Alert Alert_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Alert"
    ADD CONSTRAINT "Alert_pkey" PRIMARY KEY (id);


--
-- Name: AnalyticsCohort AnalyticsCohort_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnalyticsCohort"
    ADD CONSTRAINT "AnalyticsCohort_pkey" PRIMARY KEY (id);


--
-- Name: AnalyticsEvent AnalyticsEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnalyticsEvent"
    ADD CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY (id);


--
-- Name: AnalyticsFunnel AnalyticsFunnel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnalyticsFunnel"
    ADD CONSTRAINT "AnalyticsFunnel_pkey" PRIMARY KEY (id);


--
-- Name: AnalyticsPrediction AnalyticsPrediction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnalyticsPrediction"
    ADD CONSTRAINT "AnalyticsPrediction_pkey" PRIMARY KEY (id);


--
-- Name: AnalyticsSegment AnalyticsSegment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnalyticsSegment"
    ADD CONSTRAINT "AnalyticsSegment_pkey" PRIMARY KEY (id);


--
-- Name: ApiKey ApiKey_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApiKey"
    ADD CONSTRAINT "ApiKey_pkey" PRIMARY KEY (id);


--
-- Name: ArtisanCapability ArtisanCapability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ArtisanCapability"
    ADD CONSTRAINT "ArtisanCapability_pkey" PRIMARY KEY (id);


--
-- Name: Artisan Artisan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Artisan"
    ADD CONSTRAINT "Artisan_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: Attribution Attribution_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attribution"
    ADD CONSTRAINT "Attribution_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: BatchRenderProgress BatchRenderProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BatchRenderProgress"
    ADD CONSTRAINT "BatchRenderProgress_pkey" PRIMARY KEY (id);


--
-- Name: Brand Brand_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: Conversion Conversion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversion"
    ADD CONSTRAINT "Conversion_pkey" PRIMARY KEY (id);


--
-- Name: CreditPack CreditPack_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CreditPack"
    ADD CONSTRAINT "CreditPack_pkey" PRIMARY KEY (id);


--
-- Name: CreditTransaction CreditTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CreditTransaction"
    ADD CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY (id);


--
-- Name: CustomizableArea CustomizableArea_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomizableArea"
    ADD CONSTRAINT "CustomizableArea_pkey" PRIMARY KEY (id);


--
-- Name: Customization Customization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customization"
    ADD CONSTRAINT "Customization_pkey" PRIMARY KEY (id);


--
-- Name: DesignDNA DesignDNA_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DesignDNA"
    ADD CONSTRAINT "DesignDNA_pkey" PRIMARY KEY (id);


--
-- Name: DesignLayer DesignLayer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DesignLayer"
    ADD CONSTRAINT "DesignLayer_pkey" PRIMARY KEY (id);


--
-- Name: DesignSpec DesignSpec_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DesignSpec"
    ADD CONSTRAINT "DesignSpec_pkey" PRIMARY KEY (id);


--
-- Name: Design Design_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Design"
    ADD CONSTRAINT "Design_pkey" PRIMARY KEY (id);


--
-- Name: EcommerceIntegration EcommerceIntegration_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EcommerceIntegration"
    ADD CONSTRAINT "EcommerceIntegration_pkey" PRIMARY KEY (id);


--
-- Name: ExperimentAssignment ExperimentAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ExperimentAssignment"
    ADD CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY (id);


--
-- Name: Experiment Experiment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Experiment"
    ADD CONSTRAINT "Experiment_pkey" PRIMARY KEY (id);


--
-- Name: ExportResult ExportResult_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ExportResult"
    ADD CONSTRAINT "ExportResult_pkey" PRIMARY KEY (id);


--
-- Name: FraudCheck FraudCheck_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FraudCheck"
    ADD CONSTRAINT "FraudCheck_pkey" PRIMARY KEY (id);


--
-- Name: IPClaim IPClaim_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IPClaim"
    ADD CONSTRAINT "IPClaim_pkey" PRIMARY KEY (id);


--
-- Name: KnowledgeBaseArticle KnowledgeBaseArticle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."KnowledgeBaseArticle"
    ADD CONSTRAINT "KnowledgeBaseArticle_pkey" PRIMARY KEY (id);


--
-- Name: ModerationRecord ModerationRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ModerationRecord"
    ADD CONSTRAINT "ModerationRecord_pkey" PRIMARY KEY (id);


--
-- Name: MonitoringMetric MonitoringMetric_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MonitoringMetric"
    ADD CONSTRAINT "MonitoringMetric_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OAuthAccount OAuthAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OAuthAccount"
    ADD CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: OutboxEvent OutboxEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OutboxEvent"
    ADD CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY (id);


--
-- Name: Payout Payout_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payout"
    ADD CONSTRAINT "Payout_pkey" PRIMARY KEY (id);


--
-- Name: ProductMapping ProductMapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductMapping"
    ADD CONSTRAINT "ProductMapping_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: ProductionStatus ProductionStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductionStatus"
    ADD CONSTRAINT "ProductionStatus_pkey" PRIMARY KEY (id);


--
-- Name: PromptTemplate PromptTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PromptTemplate"
    ADD CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY (id);


--
-- Name: QualityReport QualityReport_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QualityReport"
    ADD CONSTRAINT "QualityReport_pkey" PRIMARY KEY (id);


--
-- Name: Quote Quote_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: RenderError RenderError_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RenderError"
    ADD CONSTRAINT "RenderError_pkey" PRIMARY KEY (id);


--
-- Name: RenderProgress RenderProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RenderProgress"
    ADD CONSTRAINT "RenderProgress_pkey" PRIMARY KEY (id);


--
-- Name: RenderResult RenderResult_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RenderResult"
    ADD CONSTRAINT "RenderResult_pkey" PRIMARY KEY (id);


--
-- Name: SLARecord SLARecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SLARecord"
    ADD CONSTRAINT "SLARecord_pkey" PRIMARY KEY (id);


--
-- Name: ServiceHealth ServiceHealth_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ServiceHealth"
    ADD CONSTRAINT "ServiceHealth_pkey" PRIMARY KEY (id);


--
-- Name: SharedResource SharedResource_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SharedResource"
    ADD CONSTRAINT "SharedResource_pkey" PRIMARY KEY (id);


--
-- Name: Snapshot Snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Snapshot"
    ADD CONSTRAINT "Snapshot_pkey" PRIMARY KEY (id);


--
-- Name: SyncLog SyncLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SyncLog"
    ADD CONSTRAINT "SyncLog_pkey" PRIMARY KEY (id);


--
-- Name: SystemConfig SystemConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemConfig"
    ADD CONSTRAINT "SystemConfig_pkey" PRIMARY KEY (id);


--
-- Name: TicketActivity TicketActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketActivity"
    ADD CONSTRAINT "TicketActivity_pkey" PRIMARY KEY (id);


--
-- Name: TicketAttachment TicketAttachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketAttachment"
    ADD CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY (id);


--
-- Name: TicketMessage TicketMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: UsageMetric UsageMetric_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsageMetric"
    ADD CONSTRAINT "UsageMetric_pkey" PRIMARY KEY (id);


--
-- Name: UserConsent UserConsent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserConsent"
    ADD CONSTRAINT "UserConsent_pkey" PRIMARY KEY (id);


--
-- Name: UserQuota UserQuota_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserQuota"
    ADD CONSTRAINT "UserQuota_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WebVital WebVital_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WebVital"
    ADD CONSTRAINT "WebVital_pkey" PRIMARY KEY (id);


--
-- Name: WebhookLog WebhookLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WebhookLog"
    ADD CONSTRAINT "WebhookLog_pkey" PRIMARY KEY (id);


--
-- Name: Webhook Webhook_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Webhook"
    ADD CONSTRAINT "Webhook_pkey" PRIMARY KEY (id);


--
-- Name: WorkOrder WorkOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_pkey" PRIMARY KEY (id);


--
-- Name: Zone Zone_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Zone"
    ADD CONSTRAINT "Zone_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AICollectionGeneration_collectionId_generationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AICollectionGeneration_collectionId_generationId_key" ON public."AICollectionGeneration" USING btree ("collectionId", "generationId");


--
-- Name: AICollectionGeneration_collectionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AICollectionGeneration_collectionId_idx" ON public."AICollectionGeneration" USING btree ("collectionId");


--
-- Name: AICollectionGeneration_generationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AICollectionGeneration_generationId_idx" ON public."AICollectionGeneration" USING btree ("generationId");


--
-- Name: AICollection_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AICollection_brandId_idx" ON public."AICollection" USING btree ("brandId");


--
-- Name: AICollection_isShared_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AICollection_isShared_idx" ON public."AICollection" USING btree ("isShared");


--
-- Name: AICollection_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AICollection_userId_idx" ON public."AICollection" USING btree ("userId");


--
-- Name: AICost_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AICost_brandId_idx" ON public."AICost" USING btree ("brandId");


--
-- Name: AICost_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AICost_createdAt_idx" ON public."AICost" USING btree ("createdAt");


--
-- Name: AICost_provider_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AICost_provider_idx" ON public."AICost" USING btree (provider);


--
-- Name: AIGeneration_brandId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AIGeneration_brandId_createdAt_idx" ON public."AIGeneration" USING btree ("brandId", "createdAt");


--
-- Name: AIGeneration_brandId_type_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AIGeneration_brandId_type_status_idx" ON public."AIGeneration" USING btree ("brandId", type, status);


--
-- Name: AIGeneration_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AIGeneration_createdAt_idx" ON public."AIGeneration" USING btree ("createdAt");


--
-- Name: AIGeneration_model_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AIGeneration_model_idx" ON public."AIGeneration" USING btree (model);


--
-- Name: AIGeneration_parentGenerationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AIGeneration_parentGenerationId_idx" ON public."AIGeneration" USING btree ("parentGenerationId");


--
-- Name: AIGeneration_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AIGeneration_status_idx" ON public."AIGeneration" USING btree (status);


--
-- Name: AIGeneration_type_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AIGeneration_type_status_idx" ON public."AIGeneration" USING btree (type, status);


--
-- Name: AIGeneration_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AIGeneration_userId_createdAt_idx" ON public."AIGeneration" USING btree ("userId", "createdAt");


--
-- Name: AIGeneration_userId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AIGeneration_userId_status_idx" ON public."AIGeneration" USING btree ("userId", status);


--
-- Name: AIVersion_generationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AIVersion_generationId_idx" ON public."AIVersion" USING btree ("generationId");


--
-- Name: AIVersion_generationId_version_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AIVersion_generationId_version_key" ON public."AIVersion" USING btree ("generationId", version);


--
-- Name: AlertRule_enabled_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AlertRule_enabled_idx" ON public."AlertRule" USING btree (enabled);


--
-- Name: AlertRule_service_metric_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AlertRule_service_metric_idx" ON public."AlertRule" USING btree (service, metric);


--
-- Name: Alert_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Alert_createdAt_idx" ON public."Alert" USING btree ("createdAt");


--
-- Name: Alert_service_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Alert_service_idx" ON public."Alert" USING btree (service);


--
-- Name: Alert_severity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Alert_severity_idx" ON public."Alert" USING btree (severity);


--
-- Name: Alert_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Alert_status_idx" ON public."Alert" USING btree (status);


--
-- Name: Alert_status_severity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Alert_status_severity_idx" ON public."Alert" USING btree (status, severity);


--
-- Name: AnalyticsCohort_brandId_cohortDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsCohort_brandId_cohortDate_idx" ON public."AnalyticsCohort" USING btree ("brandId", "cohortDate");


--
-- Name: AnalyticsCohort_brandId_cohortDate_period_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AnalyticsCohort_brandId_cohortDate_period_key" ON public."AnalyticsCohort" USING btree ("brandId", "cohortDate", period);


--
-- Name: AnalyticsCohort_brandId_period_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsCohort_brandId_period_idx" ON public."AnalyticsCohort" USING btree ("brandId", period);


--
-- Name: AnalyticsCohort_cohortDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsCohort_cohortDate_idx" ON public."AnalyticsCohort" USING btree ("cohortDate");


--
-- Name: AnalyticsCohort_period_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsCohort_period_idx" ON public."AnalyticsCohort" USING btree (period);


--
-- Name: AnalyticsEvent_brandId_eventType_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsEvent_brandId_eventType_timestamp_idx" ON public."AnalyticsEvent" USING btree ("brandId", "eventType", "timestamp");


--
-- Name: AnalyticsEvent_brandId_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsEvent_brandId_timestamp_idx" ON public."AnalyticsEvent" USING btree ("brandId", "timestamp");


--
-- Name: AnalyticsEvent_eventType_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsEvent_eventType_timestamp_idx" ON public."AnalyticsEvent" USING btree ("eventType", "timestamp");


--
-- Name: AnalyticsEvent_sessionId_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsEvent_sessionId_timestamp_idx" ON public."AnalyticsEvent" USING btree ("sessionId", "timestamp");


--
-- Name: AnalyticsEvent_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsEvent_timestamp_idx" ON public."AnalyticsEvent" USING btree ("timestamp");


--
-- Name: AnalyticsEvent_userId_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsEvent_userId_timestamp_idx" ON public."AnalyticsEvent" USING btree ("userId", "timestamp");


--
-- Name: AnalyticsFunnel_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsFunnel_brandId_idx" ON public."AnalyticsFunnel" USING btree ("brandId");


--
-- Name: AnalyticsFunnel_brandId_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsFunnel_brandId_isActive_idx" ON public."AnalyticsFunnel" USING btree ("brandId", "isActive");


--
-- Name: AnalyticsFunnel_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsFunnel_isActive_idx" ON public."AnalyticsFunnel" USING btree ("isActive");


--
-- Name: AnalyticsPrediction_brandId_type_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsPrediction_brandId_type_createdAt_idx" ON public."AnalyticsPrediction" USING btree ("brandId", type, "createdAt");


--
-- Name: AnalyticsPrediction_brandId_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsPrediction_brandId_type_idx" ON public."AnalyticsPrediction" USING btree ("brandId", type);


--
-- Name: AnalyticsPrediction_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsPrediction_createdAt_idx" ON public."AnalyticsPrediction" USING btree ("createdAt");


--
-- Name: AnalyticsPrediction_type_period_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsPrediction_type_period_idx" ON public."AnalyticsPrediction" USING btree (type, period);


--
-- Name: AnalyticsSegment_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsSegment_brandId_idx" ON public."AnalyticsSegment" USING btree ("brandId");


--
-- Name: AnalyticsSegment_brandId_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsSegment_brandId_isActive_idx" ON public."AnalyticsSegment" USING btree ("brandId", "isActive");


--
-- Name: AnalyticsSegment_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AnalyticsSegment_isActive_idx" ON public."AnalyticsSegment" USING btree ("isActive");


--
-- Name: ApiKey_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApiKey_brandId_idx" ON public."ApiKey" USING btree ("brandId");


--
-- Name: ApiKey_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApiKey_isActive_idx" ON public."ApiKey" USING btree ("isActive");


--
-- Name: ApiKey_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApiKey_key_idx" ON public."ApiKey" USING btree (key);


--
-- Name: ApiKey_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ApiKey_key_key" ON public."ApiKey" USING btree (key);


--
-- Name: ArtisanCapability_artisanId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ArtisanCapability_artisanId_idx" ON public."ArtisanCapability" USING btree ("artisanId");


--
-- Name: ArtisanCapability_material_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ArtisanCapability_material_idx" ON public."ArtisanCapability" USING btree (material);


--
-- Name: ArtisanCapability_technique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ArtisanCapability_technique_idx" ON public."ArtisanCapability" USING btree (technique);


--
-- Name: Artisan_kycStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Artisan_kycStatus_idx" ON public."Artisan" USING btree ("kycStatus");


--
-- Name: Artisan_qualityScore_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Artisan_qualityScore_idx" ON public."Artisan" USING btree ("qualityScore");


--
-- Name: Artisan_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Artisan_status_idx" ON public."Artisan" USING btree (status);


--
-- Name: Artisan_stripeAccountId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Artisan_stripeAccountId_idx" ON public."Artisan" USING btree ("stripeAccountId");


--
-- Name: Artisan_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Artisan_userId_key" ON public."Artisan" USING btree ("userId");


--
-- Name: Asset_designId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Asset_designId_idx" ON public."Asset" USING btree ("designId");


--
-- Name: Asset_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Asset_type_idx" ON public."Asset" USING btree (type);


--
-- Name: Attribution_campaign_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attribution_campaign_idx" ON public."Attribution" USING btree (campaign);


--
-- Name: Attribution_sessionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attribution_sessionId_idx" ON public."Attribution" USING btree ("sessionId");


--
-- Name: Attribution_source_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attribution_source_idx" ON public."Attribution" USING btree (source);


--
-- Name: Attribution_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attribution_timestamp_idx" ON public."Attribution" USING btree ("timestamp");


--
-- Name: Attribution_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attribution_userId_idx" ON public."Attribution" USING btree ("userId");


--
-- Name: AuditLog_eventType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_eventType_idx" ON public."AuditLog" USING btree ("eventType");


--
-- Name: AuditLog_resourceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_resourceId_idx" ON public."AuditLog" USING btree ("resourceId");


--
-- Name: AuditLog_resourceType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_resourceType_idx" ON public."AuditLog" USING btree ("resourceType");


--
-- Name: AuditLog_success_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_success_idx" ON public."AuditLog" USING btree (success);


--
-- Name: AuditLog_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_timestamp_idx" ON public."AuditLog" USING btree ("timestamp");


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: BatchRenderProgress_batchId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BatchRenderProgress_batchId_idx" ON public."BatchRenderProgress" USING btree ("batchId");


--
-- Name: BatchRenderProgress_batchId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "BatchRenderProgress_batchId_key" ON public."BatchRenderProgress" USING btree ("batchId");


--
-- Name: Brand_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Brand_slug_idx" ON public."Brand" USING btree (slug);


--
-- Name: Brand_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Brand_slug_key" ON public."Brand" USING btree (slug);


--
-- Name: Brand_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Brand_status_idx" ON public."Brand" USING btree (status);


--
-- Name: Brand_stripeCustomerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Brand_stripeCustomerId_idx" ON public."Brand" USING btree ("stripeCustomerId");


--
-- Name: Brand_stripeSubscriptionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Brand_stripeSubscriptionId_idx" ON public."Brand" USING btree ("stripeSubscriptionId");


--
-- Name: Comment_authorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Comment_authorId_idx" ON public."Comment" USING btree ("authorId");


--
-- Name: Comment_parentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Comment_parentId_idx" ON public."Comment" USING btree ("parentId");


--
-- Name: Comment_resourceType_resourceId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Comment_resourceType_resourceId_createdAt_idx" ON public."Comment" USING btree ("resourceType", "resourceId", "createdAt");


--
-- Name: Comment_resourceType_resourceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Comment_resourceType_resourceId_idx" ON public."Comment" USING btree ("resourceType", "resourceId");


--
-- Name: Comment_sharedResourceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Comment_sharedResourceId_idx" ON public."Comment" USING btree ("sharedResourceId");


--
-- Name: Conversion_eventType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversion_eventType_idx" ON public."Conversion" USING btree ("eventType");


--
-- Name: Conversion_experimentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversion_experimentId_idx" ON public."Conversion" USING btree ("experimentId");


--
-- Name: Conversion_sessionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversion_sessionId_idx" ON public."Conversion" USING btree ("sessionId");


--
-- Name: Conversion_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversion_timestamp_idx" ON public."Conversion" USING btree ("timestamp");


--
-- Name: Conversion_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversion_userId_idx" ON public."Conversion" USING btree ("userId");


--
-- Name: CreditPack_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CreditPack_is_active_idx" ON public."CreditPack" USING btree (is_active);


--
-- Name: CreditPack_is_featured_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CreditPack_is_featured_idx" ON public."CreditPack" USING btree (is_featured);


--
-- Name: CreditPack_stripe_price_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CreditPack_stripe_price_id_idx" ON public."CreditPack" USING btree (stripe_price_id);


--
-- Name: CreditTransaction_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CreditTransaction_created_at_idx" ON public."CreditTransaction" USING btree (created_at);


--
-- Name: CreditTransaction_pack_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CreditTransaction_pack_id_idx" ON public."CreditTransaction" USING btree (pack_id);


--
-- Name: CreditTransaction_stripe_session_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CreditTransaction_stripe_session_id_idx" ON public."CreditTransaction" USING btree (stripe_session_id);


--
-- Name: CreditTransaction_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CreditTransaction_type_idx" ON public."CreditTransaction" USING btree (type);


--
-- Name: CreditTransaction_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CreditTransaction_user_id_idx" ON public."CreditTransaction" USING btree (user_id);


--
-- Name: CustomizableArea_displayOrder_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomizableArea_displayOrder_idx" ON public."CustomizableArea" USING btree ("displayOrder");


--
-- Name: CustomizableArea_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomizableArea_isActive_idx" ON public."CustomizableArea" USING btree ("isActive");


--
-- Name: CustomizableArea_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomizableArea_productId_idx" ON public."CustomizableArea" USING btree ("productId");


--
-- Name: CustomizableArea_productId_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomizableArea_productId_isActive_idx" ON public."CustomizableArea" USING btree ("productId", "isActive");


--
-- Name: Customization_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customization_brandId_idx" ON public."Customization" USING btree ("brandId");


--
-- Name: Customization_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customization_createdAt_idx" ON public."Customization" USING btree ("createdAt");


--
-- Name: Customization_designId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customization_designId_idx" ON public."Customization" USING btree ("designId");


--
-- Name: Customization_jobId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customization_jobId_idx" ON public."Customization" USING btree ("jobId");


--
-- Name: Customization_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customization_orderId_idx" ON public."Customization" USING btree ("orderId");


--
-- Name: Customization_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customization_productId_idx" ON public."Customization" USING btree ("productId");


--
-- Name: Customization_promptHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customization_promptHash_idx" ON public."Customization" USING btree ("promptHash");


--
-- Name: Customization_snapshotId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customization_snapshotId_idx" ON public."Customization" USING btree ("snapshotId");


--
-- Name: Customization_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customization_status_idx" ON public."Customization" USING btree (status);


--
-- Name: Customization_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customization_userId_idx" ON public."Customization" USING btree ("userId");


--
-- Name: Customization_zoneId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customization_zoneId_idx" ON public."Customization" USING btree ("zoneId");


--
-- Name: DesignDNA_designId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DesignDNA_designId_idx" ON public."DesignDNA" USING btree ("designId");


--
-- Name: DesignDNA_designId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DesignDNA_designId_key" ON public."DesignDNA" USING btree ("designId");


--
-- Name: DesignLayer_designId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DesignLayer_designId_idx" ON public."DesignLayer" USING btree ("designId");


--
-- Name: DesignLayer_designId_zIndex_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DesignLayer_designId_zIndex_idx" ON public."DesignLayer" USING btree ("designId", "zIndex");


--
-- Name: DesignLayer_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DesignLayer_type_idx" ON public."DesignLayer" USING btree (type);


--
-- Name: DesignLayer_visible_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DesignLayer_visible_idx" ON public."DesignLayer" USING btree (visible);


--
-- Name: DesignLayer_zIndex_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DesignLayer_zIndex_idx" ON public."DesignLayer" USING btree ("zIndex");


--
-- Name: DesignSpec_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DesignSpec_createdAt_idx" ON public."DesignSpec" USING btree ("createdAt");


--
-- Name: DesignSpec_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DesignSpec_productId_idx" ON public."DesignSpec" USING btree ("productId");


--
-- Name: DesignSpec_productId_specHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DesignSpec_productId_specHash_idx" ON public."DesignSpec" USING btree ("productId", "specHash");


--
-- Name: DesignSpec_specHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DesignSpec_specHash_idx" ON public."DesignSpec" USING btree ("specHash");


--
-- Name: DesignSpec_specHash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DesignSpec_specHash_key" ON public."DesignSpec" USING btree ("specHash");


--
-- Name: DesignSpec_specVersion_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DesignSpec_specVersion_idx" ON public."DesignSpec" USING btree ("specVersion");


--
-- Name: Design_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Design_brandId_idx" ON public."Design" USING btree ("brandId");


--
-- Name: Design_brandId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Design_brandId_status_idx" ON public."Design" USING btree ("brandId", status);


--
-- Name: Design_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Design_createdAt_idx" ON public."Design" USING btree ("createdAt");


--
-- Name: Design_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Design_productId_idx" ON public."Design" USING btree ("productId");


--
-- Name: Design_promptHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Design_promptHash_idx" ON public."Design" USING btree ("promptHash");


--
-- Name: Design_specId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Design_specId_idx" ON public."Design" USING btree ("specId");


--
-- Name: Design_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Design_status_idx" ON public."Design" USING btree (status);


--
-- Name: Design_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Design_userId_idx" ON public."Design" USING btree ("userId");


--
-- Name: EcommerceIntegration_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EcommerceIntegration_brandId_idx" ON public."EcommerceIntegration" USING btree ("brandId");


--
-- Name: EcommerceIntegration_platform_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EcommerceIntegration_platform_idx" ON public."EcommerceIntegration" USING btree (platform);


--
-- Name: EcommerceIntegration_shopDomain_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EcommerceIntegration_shopDomain_idx" ON public."EcommerceIntegration" USING btree ("shopDomain");


--
-- Name: EcommerceIntegration_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EcommerceIntegration_status_idx" ON public."EcommerceIntegration" USING btree (status);


--
-- Name: ExperimentAssignment_experimentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ExperimentAssignment_experimentId_idx" ON public."ExperimentAssignment" USING btree ("experimentId");


--
-- Name: ExperimentAssignment_userId_experimentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ExperimentAssignment_userId_experimentId_key" ON public."ExperimentAssignment" USING btree ("userId", "experimentId");


--
-- Name: ExperimentAssignment_variantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ExperimentAssignment_variantId_idx" ON public."ExperimentAssignment" USING btree ("variantId");


--
-- Name: Experiment_startDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Experiment_startDate_idx" ON public."Experiment" USING btree ("startDate");


--
-- Name: Experiment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Experiment_status_idx" ON public."Experiment" USING btree (status);


--
-- Name: Experiment_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Experiment_type_idx" ON public."Experiment" USING btree (type);


--
-- Name: ExportResult_format_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ExportResult_format_idx" ON public."ExportResult" USING btree (format);


--
-- Name: ExportResult_renderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ExportResult_renderId_idx" ON public."ExportResult" USING btree ("renderId");


--
-- Name: ExportResult_renderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ExportResult_renderId_key" ON public."ExportResult" USING btree ("renderId");


--
-- Name: FraudCheck_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FraudCheck_createdAt_idx" ON public."FraudCheck" USING btree ("createdAt");


--
-- Name: FraudCheck_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FraudCheck_email_idx" ON public."FraudCheck" USING btree (email);


--
-- Name: FraudCheck_ipAddress_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FraudCheck_ipAddress_idx" ON public."FraudCheck" USING btree ("ipAddress");


--
-- Name: FraudCheck_riskLevel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FraudCheck_riskLevel_idx" ON public."FraudCheck" USING btree ("riskLevel");


--
-- Name: FraudCheck_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FraudCheck_userId_idx" ON public."FraudCheck" USING btree ("userId");


--
-- Name: IPClaim_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IPClaim_createdAt_idx" ON public."IPClaim" USING btree ("createdAt");


--
-- Name: IPClaim_designId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IPClaim_designId_idx" ON public."IPClaim" USING btree ("designId");


--
-- Name: IPClaim_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IPClaim_status_idx" ON public."IPClaim" USING btree (status);


--
-- Name: KnowledgeBaseArticle_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "KnowledgeBaseArticle_category_idx" ON public."KnowledgeBaseArticle" USING btree (category);


--
-- Name: KnowledgeBaseArticle_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "KnowledgeBaseArticle_createdAt_idx" ON public."KnowledgeBaseArticle" USING btree ("createdAt");


--
-- Name: KnowledgeBaseArticle_isFeatured_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "KnowledgeBaseArticle_isFeatured_idx" ON public."KnowledgeBaseArticle" USING btree ("isFeatured");


--
-- Name: KnowledgeBaseArticle_isPublished_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "KnowledgeBaseArticle_isPublished_idx" ON public."KnowledgeBaseArticle" USING btree ("isPublished");


--
-- Name: KnowledgeBaseArticle_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "KnowledgeBaseArticle_slug_idx" ON public."KnowledgeBaseArticle" USING btree (slug);


--
-- Name: KnowledgeBaseArticle_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "KnowledgeBaseArticle_slug_key" ON public."KnowledgeBaseArticle" USING btree (slug);


--
-- Name: ModerationRecord_approved_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ModerationRecord_approved_idx" ON public."ModerationRecord" USING btree (approved);


--
-- Name: ModerationRecord_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ModerationRecord_createdAt_idx" ON public."ModerationRecord" USING btree ("createdAt");


--
-- Name: ModerationRecord_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ModerationRecord_type_idx" ON public."ModerationRecord" USING btree (type);


--
-- Name: MonitoringMetric_metric_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MonitoringMetric_metric_idx" ON public."MonitoringMetric" USING btree (metric);


--
-- Name: MonitoringMetric_service_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MonitoringMetric_service_idx" ON public."MonitoringMetric" USING btree (service);


--
-- Name: MonitoringMetric_service_metric_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MonitoringMetric_service_metric_timestamp_idx" ON public."MonitoringMetric" USING btree (service, metric, "timestamp");


--
-- Name: MonitoringMetric_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MonitoringMetric_timestamp_idx" ON public."MonitoringMetric" USING btree ("timestamp");


--
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- Name: Notification_read_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_read_idx" ON public."Notification" USING btree (read);


--
-- Name: Notification_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_type_idx" ON public."Notification" USING btree (type);


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: OAuthAccount_provider_providerId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OAuthAccount_provider_providerId_key" ON public."OAuthAccount" USING btree (provider, "providerId");


--
-- Name: OAuthAccount_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OAuthAccount_userId_idx" ON public."OAuthAccount" USING btree ("userId");


--
-- Name: OrderItem_designId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_designId_idx" ON public."OrderItem" USING btree ("designId");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: OrderItem_orderId_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_orderId_productId_idx" ON public."OrderItem" USING btree ("orderId", "productId");


--
-- Name: OrderItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_productId_idx" ON public."OrderItem" USING btree ("productId");


--
-- Name: OrderItem_snapshotId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_snapshotId_idx" ON public."OrderItem" USING btree ("snapshotId");


--
-- Name: Order_brandId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_brandId_createdAt_idx" ON public."Order" USING btree ("brandId", "createdAt");


--
-- Name: Order_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_brandId_idx" ON public."Order" USING btree ("brandId");


--
-- Name: Order_brandId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_brandId_status_idx" ON public."Order" USING btree ("brandId", status);


--
-- Name: Order_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_createdAt_idx" ON public."Order" USING btree ("createdAt");


--
-- Name: Order_designId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_designId_idx" ON public."Order" USING btree ("designId");


--
-- Name: Order_orderNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_orderNumber_idx" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_productId_idx" ON public."Order" USING btree ("productId");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Order_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_userId_idx" ON public."Order" USING btree ("userId");


--
-- Name: OutboxEvent_eventType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OutboxEvent_eventType_idx" ON public."OutboxEvent" USING btree ("eventType");


--
-- Name: OutboxEvent_status_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OutboxEvent_status_createdAt_idx" ON public."OutboxEvent" USING btree (status, "createdAt");


--
-- Name: Payout_artisanId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payout_artisanId_idx" ON public."Payout" USING btree ("artisanId");


--
-- Name: Payout_periodStart_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payout_periodStart_idx" ON public."Payout" USING btree ("periodStart");


--
-- Name: Payout_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payout_status_idx" ON public."Payout" USING btree (status);


--
-- Name: Payout_stripeTransferId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payout_stripeTransferId_idx" ON public."Payout" USING btree ("stripeTransferId");


--
-- Name: ProductMapping_externalProductId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductMapping_externalProductId_idx" ON public."ProductMapping" USING btree ("externalProductId");


--
-- Name: ProductMapping_externalSku_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductMapping_externalSku_idx" ON public."ProductMapping" USING btree ("externalSku");


--
-- Name: ProductMapping_integrationId_externalProductId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductMapping_integrationId_externalProductId_key" ON public."ProductMapping" USING btree ("integrationId", "externalProductId");


--
-- Name: ProductMapping_integrationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductMapping_integrationId_idx" ON public."ProductMapping" USING btree ("integrationId");


--
-- Name: ProductMapping_luneoProductId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductMapping_luneoProductId_idx" ON public."ProductMapping" USING btree ("luneoProductId");


--
-- Name: Product_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_brandId_idx" ON public."Product" USING btree ("brandId");


--
-- Name: Product_brandId_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_brandId_isActive_idx" ON public."Product" USING btree ("brandId", "isActive");


--
-- Name: Product_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_isActive_idx" ON public."Product" USING btree ("isActive");


--
-- Name: Product_isPublic_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_isPublic_idx" ON public."Product" USING btree ("isPublic");


--
-- Name: ProductionStatus_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductionStatus_orderId_idx" ON public."ProductionStatus" USING btree ("orderId");


--
-- Name: ProductionStatus_orderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductionStatus_orderId_key" ON public."ProductionStatus" USING btree ("orderId");


--
-- Name: PromptTemplate_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PromptTemplate_isActive_idx" ON public."PromptTemplate" USING btree ("isActive");


--
-- Name: PromptTemplate_name_version_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PromptTemplate_name_version_key" ON public."PromptTemplate" USING btree (name, version);


--
-- Name: PromptTemplate_occasion_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PromptTemplate_occasion_idx" ON public."PromptTemplate" USING btree (occasion);


--
-- Name: PromptTemplate_style_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PromptTemplate_style_idx" ON public."PromptTemplate" USING btree (style);


--
-- Name: QualityReport_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "QualityReport_orderId_idx" ON public."QualityReport" USING btree ("orderId");


--
-- Name: QualityReport_orderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "QualityReport_orderId_key" ON public."QualityReport" USING btree ("orderId");


--
-- Name: Quote_artisanId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Quote_artisanId_idx" ON public."Quote" USING btree ("artisanId");


--
-- Name: Quote_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Quote_orderId_idx" ON public."Quote" USING btree ("orderId");


--
-- Name: Quote_overallScore_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Quote_overallScore_idx" ON public."Quote" USING btree ("overallScore");


--
-- Name: Quote_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Quote_status_idx" ON public."Quote" USING btree (status);


--
-- Name: RefreshToken_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RefreshToken_expiresAt_idx" ON public."RefreshToken" USING btree ("expiresAt");


--
-- Name: RefreshToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RefreshToken_token_key" ON public."RefreshToken" USING btree (token);


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RefreshToken_userId_idx" ON public."RefreshToken" USING btree ("userId");


--
-- Name: RenderError_renderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RenderError_renderId_idx" ON public."RenderError" USING btree ("renderId");


--
-- Name: RenderProgress_renderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RenderProgress_renderId_idx" ON public."RenderProgress" USING btree ("renderId");


--
-- Name: RenderProgress_renderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RenderProgress_renderId_key" ON public."RenderProgress" USING btree ("renderId");


--
-- Name: RenderResult_customizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RenderResult_customizationId_idx" ON public."RenderResult" USING btree ("customizationId");


--
-- Name: RenderResult_designId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RenderResult_designId_idx" ON public."RenderResult" USING btree ("designId");


--
-- Name: RenderResult_renderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RenderResult_renderId_idx" ON public."RenderResult" USING btree ("renderId");


--
-- Name: RenderResult_renderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RenderResult_renderId_key" ON public."RenderResult" USING btree ("renderId");


--
-- Name: RenderResult_snapshotId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RenderResult_snapshotId_idx" ON public."RenderResult" USING btree ("snapshotId");


--
-- Name: RenderResult_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RenderResult_status_idx" ON public."RenderResult" USING btree (status);


--
-- Name: RenderResult_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RenderResult_type_idx" ON public."RenderResult" USING btree (type);


--
-- Name: RenderResult_type_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RenderResult_type_status_idx" ON public."RenderResult" USING btree (type, status);


--
-- Name: SLARecord_artisanId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SLARecord_artisanId_idx" ON public."SLARecord" USING btree ("artisanId");


--
-- Name: SLARecord_onTime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SLARecord_onTime_idx" ON public."SLARecord" USING btree ("onTime");


--
-- Name: SLARecord_workOrderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SLARecord_workOrderId_key" ON public."SLARecord" USING btree ("workOrderId");


--
-- Name: ServiceHealth_lastCheck_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ServiceHealth_lastCheck_idx" ON public."ServiceHealth" USING btree ("lastCheck");


--
-- Name: ServiceHealth_service_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ServiceHealth_service_idx" ON public."ServiceHealth" USING btree (service);


--
-- Name: ServiceHealth_service_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ServiceHealth_service_key" ON public."ServiceHealth" USING btree (service);


--
-- Name: ServiceHealth_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ServiceHealth_status_idx" ON public."ServiceHealth" USING btree (status);


--
-- Name: SharedResource_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SharedResource_brandId_idx" ON public."SharedResource" USING btree ("brandId");


--
-- Name: SharedResource_brandId_resourceType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SharedResource_brandId_resourceType_idx" ON public."SharedResource" USING btree ("brandId", "resourceType");


--
-- Name: SharedResource_createdBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SharedResource_createdBy_idx" ON public."SharedResource" USING btree ("createdBy");


--
-- Name: SharedResource_isPublic_publicToken_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SharedResource_isPublic_publicToken_idx" ON public."SharedResource" USING btree ("isPublic", "publicToken");


--
-- Name: SharedResource_publicToken_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SharedResource_publicToken_idx" ON public."SharedResource" USING btree ("publicToken");


--
-- Name: SharedResource_publicToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SharedResource_publicToken_key" ON public."SharedResource" USING btree ("publicToken");


--
-- Name: SharedResource_resourceType_resourceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SharedResource_resourceType_resourceId_idx" ON public."SharedResource" USING btree ("resourceType", "resourceId");


--
-- Name: Snapshot_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Snapshot_createdAt_idx" ON public."Snapshot" USING btree ("createdAt");


--
-- Name: Snapshot_isLocked_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Snapshot_isLocked_idx" ON public."Snapshot" USING btree ("isLocked");


--
-- Name: Snapshot_isValidated_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Snapshot_isValidated_idx" ON public."Snapshot" USING btree ("isValidated");


--
-- Name: Snapshot_specHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Snapshot_specHash_idx" ON public."Snapshot" USING btree ("specHash");


--
-- Name: Snapshot_specHash_isValidated_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Snapshot_specHash_isValidated_idx" ON public."Snapshot" USING btree ("specHash", "isValidated");


--
-- Name: Snapshot_specHash_validatedAt_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Snapshot_specHash_validatedAt_key" ON public."Snapshot" USING btree ("specHash", "validatedAt");


--
-- Name: Snapshot_specId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Snapshot_specId_idx" ON public."Snapshot" USING btree ("specId");


--
-- Name: Snapshot_validatedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Snapshot_validatedAt_idx" ON public."Snapshot" USING btree ("validatedAt");


--
-- Name: SyncLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SyncLog_createdAt_idx" ON public."SyncLog" USING btree ("createdAt");


--
-- Name: SyncLog_integrationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SyncLog_integrationId_idx" ON public."SyncLog" USING btree ("integrationId");


--
-- Name: SyncLog_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SyncLog_status_idx" ON public."SyncLog" USING btree (status);


--
-- Name: SyncLog_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SyncLog_type_idx" ON public."SyncLog" USING btree (type);


--
-- Name: SystemConfig_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemConfig_key_idx" ON public."SystemConfig" USING btree (key);


--
-- Name: SystemConfig_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SystemConfig_key_key" ON public."SystemConfig" USING btree (key);


--
-- Name: TicketActivity_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketActivity_createdAt_idx" ON public."TicketActivity" USING btree ("createdAt");


--
-- Name: TicketActivity_ticketId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketActivity_ticketId_idx" ON public."TicketActivity" USING btree ("ticketId");


--
-- Name: TicketActivity_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketActivity_userId_idx" ON public."TicketActivity" USING btree ("userId");


--
-- Name: TicketAttachment_messageId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketAttachment_messageId_idx" ON public."TicketAttachment" USING btree ("messageId");


--
-- Name: TicketAttachment_ticketId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketAttachment_ticketId_idx" ON public."TicketAttachment" USING btree ("ticketId");


--
-- Name: TicketAttachment_uploadedBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketAttachment_uploadedBy_idx" ON public."TicketAttachment" USING btree ("uploadedBy");


--
-- Name: TicketMessage_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketMessage_createdAt_idx" ON public."TicketMessage" USING btree ("createdAt");


--
-- Name: TicketMessage_ticketId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketMessage_ticketId_idx" ON public."TicketMessage" USING btree ("ticketId");


--
-- Name: TicketMessage_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketMessage_type_idx" ON public."TicketMessage" USING btree (type);


--
-- Name: TicketMessage_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TicketMessage_userId_idx" ON public."TicketMessage" USING btree ("userId");


--
-- Name: Ticket_assignedTo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_assignedTo_idx" ON public."Ticket" USING btree ("assignedTo");


--
-- Name: Ticket_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_category_idx" ON public."Ticket" USING btree (category);


--
-- Name: Ticket_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_createdAt_idx" ON public."Ticket" USING btree ("createdAt");


--
-- Name: Ticket_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_priority_idx" ON public."Ticket" USING btree (priority);


--
-- Name: Ticket_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_status_idx" ON public."Ticket" USING btree (status);


--
-- Name: Ticket_status_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_status_priority_idx" ON public."Ticket" USING btree (status, priority);


--
-- Name: Ticket_ticketNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_ticketNumber_idx" ON public."Ticket" USING btree ("ticketNumber");


--
-- Name: Ticket_ticketNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON public."Ticket" USING btree ("ticketNumber");


--
-- Name: Ticket_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Ticket_userId_idx" ON public."Ticket" USING btree ("userId");


--
-- Name: UsageMetric_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UsageMetric_brandId_idx" ON public."UsageMetric" USING btree ("brandId");


--
-- Name: UsageMetric_metric_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UsageMetric_metric_idx" ON public."UsageMetric" USING btree (metric);


--
-- Name: UsageMetric_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UsageMetric_timestamp_idx" ON public."UsageMetric" USING btree ("timestamp");


--
-- Name: UserConsent_consentType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserConsent_consentType_idx" ON public."UserConsent" USING btree ("consentType");


--
-- Name: UserConsent_recordedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserConsent_recordedAt_idx" ON public."UserConsent" USING btree ("recordedAt");


--
-- Name: UserConsent_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserConsent_userId_idx" ON public."UserConsent" USING btree ("userId");


--
-- Name: UserQuota_resetAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserQuota_resetAt_idx" ON public."UserQuota" USING btree ("resetAt");


--
-- Name: UserQuota_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserQuota_userId_key" ON public."UserQuota" USING btree ("userId");


--
-- Name: User_ai_credits_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_ai_credits_idx" ON public."User" USING btree (ai_credits);


--
-- Name: User_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_brandId_idx" ON public."User" USING btree ("brandId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: WebVital_metric_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebVital_metric_idx" ON public."WebVital" USING btree (metric);


--
-- Name: WebVital_page_metric_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebVital_page_metric_timestamp_idx" ON public."WebVital" USING btree (page, metric, "timestamp");


--
-- Name: WebVital_sessionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebVital_sessionId_idx" ON public."WebVital" USING btree ("sessionId");


--
-- Name: WebVital_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebVital_timestamp_idx" ON public."WebVital" USING btree ("timestamp");


--
-- Name: WebVital_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebVital_userId_idx" ON public."WebVital" USING btree ("userId");


--
-- Name: WebhookLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebhookLog_createdAt_idx" ON public."WebhookLog" USING btree ("createdAt");


--
-- Name: WebhookLog_shopDomain_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebhookLog_shopDomain_idx" ON public."WebhookLog" USING btree ("shopDomain");


--
-- Name: WebhookLog_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebhookLog_status_idx" ON public."WebhookLog" USING btree (status);


--
-- Name: WebhookLog_topic_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebhookLog_topic_idx" ON public."WebhookLog" USING btree (topic);


--
-- Name: WebhookLog_webhookId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WebhookLog_webhookId_idx" ON public."WebhookLog" USING btree ("webhookId");


--
-- Name: Webhook_brandId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Webhook_brandId_idx" ON public."Webhook" USING btree ("brandId");


--
-- Name: Webhook_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Webhook_createdAt_idx" ON public."Webhook" USING btree ("createdAt");


--
-- Name: Webhook_event_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Webhook_event_idx" ON public."Webhook" USING btree (event);


--
-- Name: Webhook_idempotencyKey_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Webhook_idempotencyKey_idx" ON public."Webhook" USING btree ("idempotencyKey");


--
-- Name: Webhook_idempotencyKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Webhook_idempotencyKey_key" ON public."Webhook" USING btree ("idempotencyKey");


--
-- Name: Webhook_success_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Webhook_success_idx" ON public."Webhook" USING btree (success);


--
-- Name: WorkOrder_artisanId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WorkOrder_artisanId_idx" ON public."WorkOrder" USING btree ("artisanId");


--
-- Name: WorkOrder_orderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "WorkOrder_orderId_key" ON public."WorkOrder" USING btree ("orderId");


--
-- Name: WorkOrder_payoutStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WorkOrder_payoutStatus_idx" ON public."WorkOrder" USING btree ("payoutStatus");


--
-- Name: WorkOrder_quoteId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "WorkOrder_quoteId_key" ON public."WorkOrder" USING btree ("quoteId");


--
-- Name: WorkOrder_slaDeadline_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WorkOrder_slaDeadline_idx" ON public."WorkOrder" USING btree ("slaDeadline");


--
-- Name: WorkOrder_snapshotId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WorkOrder_snapshotId_idx" ON public."WorkOrder" USING btree ("snapshotId");


--
-- Name: WorkOrder_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WorkOrder_status_idx" ON public."WorkOrder" USING btree (status);


--
-- Name: Zone_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Zone_isActive_idx" ON public."Zone" USING btree ("isActive");


--
-- Name: Zone_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Zone_order_idx" ON public."Zone" USING btree ("order");


--
-- Name: Zone_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Zone_productId_idx" ON public."Zone" USING btree ("productId");


--
-- Name: Zone_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Zone_type_idx" ON public."Zone" USING btree (type);


--
-- Name: AICollectionGeneration AICollectionGeneration_collectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AICollectionGeneration"
    ADD CONSTRAINT "AICollectionGeneration_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES public."AICollection"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AICollectionGeneration AICollectionGeneration_generationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AICollectionGeneration"
    ADD CONSTRAINT "AICollectionGeneration_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES public."AIGeneration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AICollection AICollection_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AICollection"
    ADD CONSTRAINT "AICollection_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AICollection AICollection_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AICollection"
    ADD CONSTRAINT "AICollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AICost AICost_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AICost"
    ADD CONSTRAINT "AICost_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AIGeneration AIGeneration_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AIGeneration"
    ADD CONSTRAINT "AIGeneration_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AIGeneration AIGeneration_parentGenerationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AIGeneration"
    ADD CONSTRAINT "AIGeneration_parentGenerationId_fkey" FOREIGN KEY ("parentGenerationId") REFERENCES public."AIGeneration"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AIGeneration AIGeneration_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AIGeneration"
    ADD CONSTRAINT "AIGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AIVersion AIVersion_generationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AIVersion"
    ADD CONSTRAINT "AIVersion_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES public."AIGeneration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AnalyticsCohort AnalyticsCohort_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnalyticsCohort"
    ADD CONSTRAINT "AnalyticsCohort_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AnalyticsEvent AnalyticsEvent_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnalyticsEvent"
    ADD CONSTRAINT "AnalyticsEvent_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AnalyticsFunnel AnalyticsFunnel_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnalyticsFunnel"
    ADD CONSTRAINT "AnalyticsFunnel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AnalyticsPrediction AnalyticsPrediction_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnalyticsPrediction"
    ADD CONSTRAINT "AnalyticsPrediction_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AnalyticsSegment AnalyticsSegment_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AnalyticsSegment"
    ADD CONSTRAINT "AnalyticsSegment_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApiKey ApiKey_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApiKey"
    ADD CONSTRAINT "ApiKey_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ArtisanCapability ArtisanCapability_artisanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ArtisanCapability"
    ADD CONSTRAINT "ArtisanCapability_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES public."Artisan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Artisan Artisan_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Artisan"
    ADD CONSTRAINT "Artisan_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Asset Asset_designId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_designId_fkey" FOREIGN KEY ("designId") REFERENCES public."Design"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Comment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_sharedResourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_sharedResourceId_fkey" FOREIGN KEY ("sharedResourceId") REFERENCES public."SharedResource"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Conversion Conversion_experimentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversion"
    ADD CONSTRAINT "Conversion_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES public."Experiment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CreditTransaction CreditTransaction_pack_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CreditTransaction"
    ADD CONSTRAINT "CreditTransaction_pack_id_fkey" FOREIGN KEY (pack_id) REFERENCES public."CreditPack"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CreditTransaction CreditTransaction_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CreditTransaction"
    ADD CONSTRAINT "CreditTransaction_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomizableArea CustomizableArea_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomizableArea"
    ADD CONSTRAINT "CustomizableArea_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Customization Customization_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customization"
    ADD CONSTRAINT "Customization_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Customization Customization_designId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customization"
    ADD CONSTRAINT "Customization_designId_fkey" FOREIGN KEY ("designId") REFERENCES public."Design"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Customization Customization_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customization"
    ADD CONSTRAINT "Customization_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Customization Customization_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customization"
    ADD CONSTRAINT "Customization_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Customization Customization_snapshotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customization"
    ADD CONSTRAINT "Customization_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES public."Snapshot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Customization Customization_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customization"
    ADD CONSTRAINT "Customization_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Customization Customization_zoneId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customization"
    ADD CONSTRAINT "Customization_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES public."Zone"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DesignLayer DesignLayer_designId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DesignLayer"
    ADD CONSTRAINT "DesignLayer_designId_fkey" FOREIGN KEY ("designId") REFERENCES public."Design"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DesignSpec DesignSpec_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DesignSpec"
    ADD CONSTRAINT "DesignSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Design Design_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Design"
    ADD CONSTRAINT "Design_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Design Design_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Design"
    ADD CONSTRAINT "Design_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Design Design_specId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Design"
    ADD CONSTRAINT "Design_specId_fkey" FOREIGN KEY ("specId") REFERENCES public."DesignSpec"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Design Design_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Design"
    ADD CONSTRAINT "Design_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EcommerceIntegration EcommerceIntegration_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EcommerceIntegration"
    ADD CONSTRAINT "EcommerceIntegration_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExperimentAssignment ExperimentAssignment_experimentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ExperimentAssignment"
    ADD CONSTRAINT "ExperimentAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES public."Experiment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OAuthAccount OAuthAccount_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OAuthAccount"
    ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_designId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_designId_fkey" FOREIGN KEY ("designId") REFERENCES public."Design"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_snapshotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES public."Snapshot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_designId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_designId_fkey" FOREIGN KEY ("designId") REFERENCES public."Design"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payout Payout_artisanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payout"
    ADD CONSTRAINT "Payout_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES public."Artisan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductMapping ProductMapping_integrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductMapping"
    ADD CONSTRAINT "ProductMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES public."EcommerceIntegration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductMapping ProductMapping_luneoProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductMapping"
    ADD CONSTRAINT "ProductMapping_luneoProductId_fkey" FOREIGN KEY ("luneoProductId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quote Quote_artisanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES public."Artisan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Quote Quote_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RenderResult RenderResult_customizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RenderResult"
    ADD CONSTRAINT "RenderResult_customizationId_fkey" FOREIGN KEY ("customizationId") REFERENCES public."Customization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RenderResult RenderResult_designId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RenderResult"
    ADD CONSTRAINT "RenderResult_designId_fkey" FOREIGN KEY ("designId") REFERENCES public."Design"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RenderResult RenderResult_snapshotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RenderResult"
    ADD CONSTRAINT "RenderResult_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES public."Snapshot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SLARecord SLARecord_artisanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SLARecord"
    ADD CONSTRAINT "SLARecord_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES public."Artisan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SLARecord SLARecord_workOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SLARecord"
    ADD CONSTRAINT "SLARecord_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES public."WorkOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SharedResource SharedResource_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SharedResource"
    ADD CONSTRAINT "SharedResource_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SharedResource SharedResource_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SharedResource"
    ADD CONSTRAINT "SharedResource_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Snapshot Snapshot_specId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Snapshot"
    ADD CONSTRAINT "Snapshot_specId_fkey" FOREIGN KEY ("specId") REFERENCES public."DesignSpec"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SyncLog SyncLog_integrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SyncLog"
    ADD CONSTRAINT "SyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES public."EcommerceIntegration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketActivity TicketActivity_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketActivity"
    ADD CONSTRAINT "TicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketActivity TicketActivity_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketActivity"
    ADD CONSTRAINT "TicketActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TicketAttachment TicketAttachment_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketAttachment"
    ADD CONSTRAINT "TicketAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."TicketMessage"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketAttachment TicketAttachment_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketAttachment"
    ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketMessage TicketMessage_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketMessage TicketMessage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketMessage"
    ADD CONSTRAINT "TicketMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_assignedTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UsageMetric UsageMetric_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UsageMetric"
    ADD CONSTRAINT "UsageMetric_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserConsent UserConsent_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserConsent"
    ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserQuota UserQuota_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserQuota"
    ADD CONSTRAINT "UserQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Webhook Webhook_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Webhook"
    ADD CONSTRAINT "Webhook_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkOrder WorkOrder_artisanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES public."Artisan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkOrder WorkOrder_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkOrder WorkOrder_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public."Quote"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WorkOrder WorkOrder_snapshotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES public."Snapshot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Zone Zone_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Zone"
    ADD CONSTRAINT "Zone_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict DsfxRJEQgPU4OcV9xaZBPmxpYKqCgBGggEAVproQnn4quP4QIhk4EMHpqmnHWpB

