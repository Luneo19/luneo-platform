/**
 * @fileoverview Types partagés pour les Agents IA
 * @module AgentTypes
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Pas de 'any'
 * - ✅ Documentation JSDoc
 */

// ============================================================================
// LUNA (B2B)
// ============================================================================

/**
 * Types d'intentions que Luna peut détecter
 */
export enum LunaIntentType {
  ANALYZE_SALES = 'analyze_sales',
  RECOMMEND_PRODUCTS = 'recommend_products',
  OPTIMIZE_PROMPT = 'optimize_prompt',
  PREDICT_TRENDS = 'predict_trends',
  GENERATE_REPORT = 'generate_report',
  CONFIGURE_PRODUCT = 'configure_product',
  GENERAL_QUESTION = 'general_question',
}

/**
 * Action proposée par Luna
 */
export interface LunaAction {
  type: 'create_product' | 'update_product' | 'generate_report' | 'navigate' | 'configure';
  label: string;
  payload: Record<string, unknown>;
  requiresConfirmation: boolean;
}

/**
 * Réponse de Luna
 */
export interface LunaResponse {
  conversationId: string;
  message: string;
  intent: LunaIntentType;
  confidence: number;
  actions: LunaAction[];
  data?: Record<string, unknown>;
  suggestions: string[];
}

// ============================================================================
// ARIA (B2C)
// ============================================================================

/**
 * Types d'intentions que Aria peut détecter
 */
export enum AriaIntentType {
  SUGGEST_TEXT = 'suggest_text',
  IMPROVE_TEXT = 'improve_text',
  SUGGEST_STYLE = 'suggest_style',
  GIFT_IDEAS = 'gift_ideas',
  TRANSLATE = 'translate',
  SPELL_CHECK = 'spell_check',
  GENERAL_HELP = 'general_help',
}

/**
 * Suggestion d'Aria
 */
export interface AriaSuggestion {
  type: 'text' | 'style' | 'action';
  value: string;
  label: string;
  metadata?: Record<string, unknown>;
}

/**
 * Réponse d'Aria
 */
export interface AriaResponse {
  message: string;
  intent: AriaIntentType;
  suggestions: AriaSuggestion[];
  preview?: {
    text: string;
    font: string;
    color: string;
  };
}

// ============================================================================
// NOVA (Support)
// ============================================================================

/**
 * Types d'intentions que Nova peut détecter
 */
export enum NovaIntentType {
  FAQ = 'faq',
  TICKET = 'ticket',
  TUTORIAL = 'tutorial',
  BILLING = 'billing',
  TECHNICAL = 'technical',
  ESCALATE = 'escalate',
}

/**
 * Réponse de Nova
 */
export interface NovaResponse {
  conversationId?: string;
  message: string;
  intent: NovaIntentType;
  resolved: boolean;
  ticketId?: string;
  articles?: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  escalated: boolean;
}

// ============================================================================
// SHARED
// ============================================================================

/**
 * Message de conversation
 */
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Conversation avec un agent
 */
export interface AgentConversation {
  id: string;
  agentType: 'luna' | 'aria' | 'nova';
  brandId?: string;
  userId?: string;
  sessionId?: string;
  messages: AgentMessage[];
  createdAt: Date;
  updatedAt: Date;
}
