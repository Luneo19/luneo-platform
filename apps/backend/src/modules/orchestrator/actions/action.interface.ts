export enum ActionCategory {
  BOOKING = 'booking',
  EMAIL = 'email',
  TICKET = 'ticket',
  ECOMMERCE = 'ecommerce',
  CRM = 'crm',
  CUSTOM = 'custom',
}

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  category: ActionCategory;
  parameters: ActionParameter[];
  requiresAuth: boolean;
  requiredIntegration?: string;
}

export interface ActionParameter {
  name: string;
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'email'
    | 'phone'
    | 'date'
    | 'datetime';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  message: string;
  error?: string;
}

export interface ActionExecutor {
  readonly actionId: string;
  readonly definition: ActionDefinition;
  execute(
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult>;
}

export interface ActionContext {
  organizationId: string;
  agentId: string;
  conversationId: string;
  requestId?: string;
  visitorEmail?: string;
  visitorName?: string;
  integrationConfigs?: Record<string, Record<string, string>>;
  idempotencyKey?: string;
  timeoutMs?: number;
}
