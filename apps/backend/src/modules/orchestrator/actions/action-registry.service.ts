import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ActionCategory,
  ActionContext,
  ActionDefinition,
  ActionExecutor,
  ActionResult,
} from './action.interface';
import { BookingExecutor } from './executors/booking.executor';
import { EmailExecutor } from './executors/email.executor';
import { TicketExecutor } from './executors/ticket.executor';
import { CrmExecutor } from './executors/crm.executor';
import { EcommerceExecutor } from './executors/ecommerce.executor';
import { CustomApiExecutor } from './executors/custom-api.executor';

@Injectable()
export class ActionRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ActionRegistryService.name);
  private readonly executors = new Map<string, ActionExecutor>();
  private readonly idempotencyCache = new Map<
    string,
    { expiresAt: number; result: ActionResult }
  >();

  constructor(
    private readonly bookingExecutor: BookingExecutor,
    private readonly emailExecutor: EmailExecutor,
    private readonly ticketExecutor: TicketExecutor,
    private readonly crmExecutor: CrmExecutor,
    private readonly ecommerceExecutor: EcommerceExecutor,
    private readonly customApiExecutor: CustomApiExecutor,
  ) {}

  onModuleInit(): void {
    this.registerExecutor(this.bookingExecutor);
    this.registerExecutor(this.emailExecutor);
    this.registerExecutor(this.ticketExecutor);
    this.registerExecutor(this.crmExecutor);
    this.registerExecutor(this.ecommerceExecutor);
    this.registerExecutor(this.customApiExecutor);

    this.logger.log(
      `Action registry initialized with ${this.executors.size} executors: ${[...this.executors.keys()].join(', ')}`,
    );
  }

  registerExecutor(executor: ActionExecutor): void {
    if (this.executors.has(executor.actionId)) {
      this.logger.warn(
        `Overwriting existing executor for action "${executor.actionId}"`,
      );
    }
    this.executors.set(executor.actionId, executor);
  }

  getActions(): ActionDefinition[] {
    return [...this.executors.values()].map((e) => e.definition);
  }

  getAction(actionId: string): ActionDefinition | undefined {
    return this.executors.get(actionId)?.definition;
  }

  getActionsByCategory(category: ActionCategory): ActionDefinition[] {
    return [...this.executors.values()]
      .filter((e) => e.definition.category === category)
      .map((e) => e.definition);
  }

  getAvailableActions(
    integrationConfigs?: Record<string, Record<string, string>>,
  ): ActionDefinition[] {
    return [...this.executors.values()]
      .filter((executor) => {
        const def = executor.definition;
        if (!def.requiredIntegration) return true;
        return !!integrationConfigs?.[def.requiredIntegration];
      })
      .map((e) => e.definition);
  }

  async executeAction(
    actionId: string,
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    const idempotencyKey = this.computeIdempotencyKey(actionId, params, context);
    const cached = this.idempotencyCache.get(idempotencyKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Returning idempotent cached result for ${actionId}`);
      return cached.result;
    }

    const executor = this.executors.get(actionId);

    if (!executor) {
      this.logger.warn(`Action "${actionId}" not found in registry`);
      return {
        success: false,
        message: `Action "${actionId}" not found`,
        error: 'ACTION_NOT_FOUND',
      };
    }

    const definition = executor.definition;

    if (
      definition.requiredIntegration &&
      !context.integrationConfigs?.[definition.requiredIntegration]
    ) {
      return {
        success: false,
        message: `Action "${actionId}" requires the "${definition.requiredIntegration}" integration to be configured`,
        error: 'INTEGRATION_REQUIRED',
      };
    }

    const validationError = this.validateParams(params, definition);
    if (validationError) {
      return validationError;
    }

    this.logger.log(
      `Executing action "${actionId}" for agent ${context.agentId}, org ${context.organizationId}`,
    );

    const startTime = Date.now();

    try {
      const timeoutMs = Math.max(3000, context.timeoutMs ?? 15000);
      const result = await this.executeWithRetry(
        () => this.withTimeout(executor.execute(params, context), timeoutMs),
        2,
      );

      const durationMs = Date.now() - startTime;
      this.logger.log(
        `Action "${actionId}" completed in ${durationMs}ms: success=${result.success}`,
      );

      this.idempotencyCache.set(idempotencyKey, {
        result,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      this.compactIdempotencyCache();
      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Action "${actionId}" failed after ${durationMs}ms: ${errorMessage}`,
      );

      return {
        success: false,
        message: `Action "${actionId}" failed unexpectedly`,
        error: errorMessage,
      };
    }
  }

  private validateParams(
    params: Record<string, unknown>,
    definition: ActionDefinition,
  ): ActionResult | null {
    const missing = definition.parameters
      .filter((p) => p.required && params[p.name] == null)
      .map((p) => p.name);

    if (missing.length > 0) {
      return {
        success: false,
        message: `Missing required parameters: ${missing.join(', ')}`,
        error: 'VALIDATION_ERROR',
      };
    }

    for (const paramDef of definition.parameters) {
      const value = params[paramDef.name];
      if (value == null) continue;

      const typeError = this.validateParamType(paramDef.name, value, paramDef.type);
      if (typeError) return typeError;
    }

    return null;
  }

  private validateParamType(
    name: string,
    value: unknown,
    type: string,
  ): ActionResult | null {
    switch (type) {
      case 'email': {
        if (typeof value !== 'string' || !value.includes('@')) {
          return {
            success: false,
            message: `Parameter "${name}" must be a valid email address`,
            error: 'VALIDATION_ERROR',
          };
        }
        break;
      }
      case 'number': {
        if (typeof value !== 'number' && isNaN(Number(value))) {
          return {
            success: false,
            message: `Parameter "${name}" must be a number`,
            error: 'VALIDATION_ERROR',
          };
        }
        break;
      }
      case 'boolean': {
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return {
            success: false,
            message: `Parameter "${name}" must be a boolean`,
            error: 'VALIDATION_ERROR',
          };
        }
        break;
      }
      case 'date':
      case 'datetime': {
        if (typeof value === 'string' && isNaN(Date.parse(value))) {
          return {
            success: false,
            message: `Parameter "${name}" must be a valid date`,
            error: 'VALIDATION_ERROR',
          };
        }
        break;
      }
    }

    return null;
  }

  private computeIdempotencyKey(
    actionId: string,
    params: Record<string, unknown>,
    context: ActionContext,
  ): string {
    if (context.idempotencyKey) {
      return `${context.organizationId}:${context.agentId}:${actionId}:${context.idempotencyKey}`;
    }
    const stableParams = JSON.stringify(params, Object.keys(params).sort());
    return `${context.organizationId}:${context.agentId}:${context.conversationId}:${actionId}:${stableParams}`;
  }

  private compactIdempotencyCache(): void {
    const now = Date.now();
    for (const [key, value] of this.idempotencyCache.entries()) {
      if (value.expiresAt <= now) {
        this.idempotencyCache.delete(key);
      }
    }
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number,
  ): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, 200 * (i + 1)));
        }
      }
    }
    throw lastError;
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Action timeout after ${timeoutMs}ms`)), timeoutMs);
      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }
}
