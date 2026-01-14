# 📋 TYPES & INTERFACES - AGENTS IA LUNEO

## Types Principaux

```typescript
// ============================================================================
// BASE TYPES
// ============================================================================

export type AgentType = 'luna' | 'aria' | 'nova';
export type LLMProvider = 'openai' | 'anthropic' | 'mistral';

// ============================================================================
// AGENT INPUT/OUTPUT
// ============================================================================

export interface AgentChatInput {
  message: string;
  brandId?: string;
  userId?: string;
  conversationId?: string;
  sessionId?: string; // Pour Aria (B2C)
  productId?: string; // Pour Aria
  context?: {
    currentPage?: string;
    selectedProductId?: string;
    dateRange?: {
      start?: string;
      end?: string;
    };
    occasion?: string; // Pour Aria
    recipient?: string; // Pour Aria
    currentText?: string; // Pour Aria
    currentStyle?: {
      font?: string;
      color?: string;
    };
    language?: string;
  };
}

export interface AgentResponse {
  conversationId?: string;
  message: string;
  intent: AgentIntent;
  confidence: number;
  actions?: AgentAction[];
  suggestions?: string[];
  data?: Record<string, unknown>;
  toolCalls?: ToolCallResult[];
  // Spécifique Aria
  preview?: {
    text: string;
    font: string;
    color: string;
  };
  // Spécifique Nova
  articles?: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  escalated?: boolean;
  ticketId?: string;
}

export interface AgentIntent {
  type: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface AgentAction {
  type: string;
  label: string;
  payload: Record<string, unknown>;
  requiresConfirmation: boolean;
}

// ============================================================================
// BUSINESS CONTEXT
// ============================================================================

export interface LuneoBusinessContext {
  // B2B Context
  brand: {
    id: string;
    name: string;
    plan: SubscriptionPlan;
    status: BrandStatus;
    settings: {
      whiteLabel: boolean;
      customDomain?: string;
      theme?: Record<string, unknown>;
    };
    limits: {
      products: number;
      designs: number;
      apiCalls: number;
      storage: number; // MB
    };
    createdAt: Date;
    subscriptionEndsAt?: Date;
  };
  
  // Products & Catalog
  products: {
    total: number;
    active: number;
    draft: number;
    archived: number;
    recent: Array<{
      id: string;
      name: string;
      status: ProductStatus;
      createdAt: Date;
    }>;
    topSelling: Array<{
      id: string;
      name: string;
      salesCount: number;
      revenue: number;
    }>;
  };
  
  // Orders & Revenue
  orders: {
    total: number;
    revenue: number;
    avgOrderValue: number;
    recent: Array<{
      id: string;
      status: OrderStatus;
      total: number;
      createdAt: Date;
    }>;
    statusBreakdown: Record<OrderStatus, number>;
    revenueByPeriod: Array<{
      period: string;
      revenue: number;
      orders: number;
    }>;
  };
  
  // Analytics
  analytics: {
    designsCreated: number;
    designsCompleted: number;
    conversionRate: number;
    avgOrderValue: number;
    topProducts: Array<{
      productId: string;
      productName: string;
      designs: number;
      orders: number;
      revenue: number;
    }>;
    trends: {
      designsByDay: Array<{ date: string; count: number }>;
      ordersByDay: Array<{ date: string; count: number; revenue: number }>;
    };
  };
  
  // B2C Context (si applicable)
  consumer?: {
    sessionId: string;
    currentProduct?: {
      id: string;
      name: string;
      type: string;
      personalizationOptions: Array<{
        type: CustomizationType;
        label: string;
        options: unknown[];
      }>;
    };
    cart?: Array<{
      productId: string;
      customization: Record<string, unknown>;
      quantity: number;
    }>;
  };
  
  // User Context
  user: {
    id: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
    brandId?: string;
  };
  
  // Credits & Usage
  credits?: {
    aiCredits: number;
    aiCreditsUsed: number;
    aiCreditsPurchased: number;
    quota: {
      designs: number;
      designsUsed: number;
      apiCalls: number;
      apiCallsUsed: number;
    };
  };
}

// ============================================================================
// AGENT CONTEXT
// ============================================================================

export interface AgentContext {
  brandId?: string;
  userId?: string;
  sessionId?: string;
  productId?: string;
  businessContext?: LuneoBusinessContext;
  conversationHistory?: Message[];
  currentProduct?: Product;
  userPreferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// TOOLS
// ============================================================================

export interface AgentTool {
  name: string;
  description: string;
  parameters: JSONSchema;
  execute: (params: any, context: AgentContext) => Promise<any>;
  requiredPermissions: Permission[];
  agentTypes: AgentType[];
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
}

export interface ToolCallResult {
  name: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

// ============================================================================
// LLM
// ============================================================================

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  metadata?: Record<string, unknown>;
}

export interface LLMRequest {
  provider: LLMProvider;
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: JSONSchema;
    };
  }>;
  brandId?: string;
  agentType?: AgentType;
  enableFallback?: boolean;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  latencyMs: number;
  toolCalls?: ToolCall[];
}

// ============================================================================
// RAG
// ============================================================================

export interface RAGDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    title?: string;
    category?: string;
    relevanceScore?: number;
  };
}

export interface RAGResult {
  enhancedPrompt: string;
  documents: RAGDocument[];
  query: string;
  totalDocuments: number;
}

// ============================================================================
// CONVERSATION
// ============================================================================

export interface Conversation {
  id: string;
  brandId?: string;
  userId?: string;
  sessionId?: string;
  agentType: AgentType;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  metadata?: Record<string, unknown>;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    intent?: AgentIntent;
    toolCalls?: ToolCallResult[];
    actions?: AgentAction[];
  };
  createdAt: Date;
}

// ============================================================================
// MEMORY
// ============================================================================

export interface AgentMemory {
  conversationId: string;
  context: {
    lastIntent?: string;
    lastToolsUsed?: string[];
    lastDataAccessed?: string[];
    preferences?: Record<string, unknown>;
    facts?: Array<{
      fact: string;
      confidence: number;
      source: string;
    }>;
  };
  updatedAt: Date;
}

// ============================================================================
// INTENT DETECTION
// ============================================================================

export interface IntentDetectionResult {
  intent: string;
  confidence: number;
  alternatives?: Array<{
    intent: string;
    confidence: number;
  }>;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// ENUMS
// ============================================================================

export enum SubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum BrandStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum OrderStatus {
  CREATED = 'CREATED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum UserRole {
  CONSUMER = 'CONSUMER',
  BRAND_USER = 'BRAND_USER',
  BRAND_ADMIN = 'BRAND_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  FABRICATOR = 'FABRICATOR',
}

export enum CustomizationType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  COLOR = 'COLOR',
  PATTERN = 'PATTERN',
  FONT = 'FONT',
  SIZE = 'SIZE',
  POSITION = 'POSITION',
}

export enum Permission {
  CREATE_PRODUCT = 'CREATE_PRODUCT',
  UPDATE_PRODUCT = 'UPDATE_PRODUCT',
  DELETE_PRODUCT = 'DELETE_PRODUCT',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  GENERATE_REPORT = 'GENERATE_REPORT',
  MANAGE_TEAM = 'MANAGE_TEAM',
  MANAGE_BILLING = 'MANAGE_BILLING',
  // ...
}

// ============================================================================
// LUNA SPECIFIC
// ============================================================================

export enum LunaIntentType {
  ANALYZE_SALES = 'analyze_sales',
  RECOMMEND_PRODUCTS = 'recommend_products',
  OPTIMIZE_PROMPT = 'optimize_prompt',
  PREDICT_TRENDS = 'predict_trends',
  GENERATE_REPORT = 'generate_report',
  CONFIGURE_PRODUCT = 'configure_product',
  GENERAL_QUESTION = 'general_question',
}

// ============================================================================
// ARIA SPECIFIC
// ============================================================================

export enum AriaIntentType {
  SUGGEST_TEXT = 'suggest_text',
  IMPROVE_TEXT = 'improve_text',
  SUGGEST_STYLE = 'suggest_style',
  GIFT_IDEAS = 'gift_ideas',
  TRANSLATE = 'translate',
  SPELL_CHECK = 'spell_check',
  GENERAL_HELP = 'general_help',
}

// ============================================================================
// NOVA SPECIFIC
// ============================================================================

export enum NovaIntentType {
  FAQ = 'faq',
  TICKET = 'ticket',
  TUTORIAL = 'tutorial',
  BILLING = 'billing',
  TECHNICAL = 'technical',
  ESCALATE = 'escalate',
}
