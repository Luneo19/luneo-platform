import { Injectable, Logger } from '@nestjs/common';
import { IntegrationRouterService } from '@/modules/integrations/providers/integration-router.service';
import {
  ActionCategory,
  ActionContext,
  ActionDefinition,
  ActionExecutor,
  ActionParameter,
  ActionResult,
} from '../action.interface';

type CrmSubAction = 'create_contact' | 'update_contact' | 'create_deal';

const SUB_ACTION_PARAMS: Record<CrmSubAction, ActionParameter[]> = {
  create_contact: [
    {
      name: 'email',
      type: 'email',
      description: 'Contact email address',
      required: true,
    },
    {
      name: 'firstName',
      type: 'string',
      description: 'Contact first name',
      required: false,
    },
    {
      name: 'lastName',
      type: 'string',
      description: 'Contact last name',
      required: false,
    },
    {
      name: 'phone',
      type: 'phone',
      description: 'Contact phone number',
      required: false,
    },
    {
      name: 'company',
      type: 'string',
      description: 'Company name',
      required: false,
    },
  ],
  update_contact: [
    {
      name: 'email',
      type: 'email',
      description: 'Contact email to identify and update',
      required: true,
    },
    {
      name: 'firstName',
      type: 'string',
      description: 'Updated first name',
      required: false,
    },
    {
      name: 'lastName',
      type: 'string',
      description: 'Updated last name',
      required: false,
    },
    {
      name: 'phone',
      type: 'phone',
      description: 'Updated phone number',
      required: false,
    },
    {
      name: 'company',
      type: 'string',
      description: 'Updated company name',
      required: false,
    },
  ],
  create_deal: [
    {
      name: 'name',
      type: 'string',
      description: 'Deal name / title',
      required: true,
    },
    {
      name: 'amount',
      type: 'number',
      description: 'Deal amount in base currency',
      required: false,
    },
    {
      name: 'contactEmail',
      type: 'email',
      description: 'Email of the associated contact',
      required: false,
    },
    {
      name: 'stage',
      type: 'string',
      description: 'Pipeline stage (e.g. prospecting, qualified, closed)',
      required: false,
    },
  ],
};

@Injectable()
export class CrmExecutor implements ActionExecutor {
  private readonly logger = new Logger(CrmExecutor.name);

  readonly actionId = 'crm.manage';

  readonly definition: ActionDefinition = {
    id: this.actionId,
    name: 'CRM Management',
    description:
      'Create or update contacts and deals in your CRM (HubSpot, Salesforce)',
    category: ActionCategory.CRM,
    requiresAuth: true,
    requiredIntegration: 'crm',
    parameters: [
      {
        name: 'subAction',
        type: 'string',
        description:
          'Sub-action: create_contact, update_contact, or create_deal',
        required: true,
      },
      {
        name: 'crmProvider',
        type: 'string',
        description: 'CRM provider: hubspot or salesforce',
        required: false,
        default: 'hubspot',
      },
      ...SUB_ACTION_PARAMS.create_contact,
      ...SUB_ACTION_PARAMS.create_deal.filter(
        (p) => !SUB_ACTION_PARAMS.create_contact.some((cp) => cp.name === p.name),
      ),
    ],
  };

  constructor(
    private readonly integrationRouter: IntegrationRouterService,
  ) {}

  async execute(
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      const subAction = params.subAction as CrmSubAction;
      const providerType = (params.crmProvider as string) ?? 'hubspot';

      if (!subAction) {
        return {
          success: false,
          message:
            'subAction is required (create_contact, update_contact, create_deal)',
          error: 'MISSING_SUB_ACTION',
        };
      }

      const config = context.integrationConfigs?.['crm'];
      if (!config) {
        return {
          success: false,
          message: 'No CRM integration configured for this organization',
          error: 'INTEGRATION_NOT_CONFIGURED',
        };
      }

      const crmProvider = this.integrationRouter.getCrmProvider(providerType);

      switch (subAction) {
        case 'create_contact':
          return await this.createContact(crmProvider, config, params, context);
        case 'update_contact':
          return await this.updateContact(crmProvider, config, params, context);
        case 'create_deal':
          return await this.createDeal(crmProvider, config, params, context);
        default:
          return {
            success: false,
            message: `Unknown sub-action: ${subAction}`,
            error: 'INVALID_SUB_ACTION',
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`CRM action failed: ${errorMessage}`);

      return {
        success: false,
        message: 'CRM action failed',
        error: errorMessage,
      };
    }
  }

  private async createContact(
    crmProvider: ReturnType<IntegrationRouterService['getCrmProvider']>,
    config: Record<string, string>,
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    const email =
      (params.email as string) ?? context.visitorEmail;

    if (!email) {
      return {
        success: false,
        message: 'Contact email is required',
        error: 'MISSING_EMAIL',
      };
    }

    const existing = await crmProvider.getContact(config, email);
    if (existing) {
      return {
        success: true,
        data: { contactId: existing.id as string, alreadyExisted: true },
        message: `Contact already exists in CRM (${email})`,
      };
    }

    const nameParts = this.parseVisitorName(
      params,
      context.visitorName,
    );

    const result = await crmProvider.createContact(config, {
      email,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      phone: params.phone as string | undefined,
      properties: {
        company: params.company as string | undefined,
        source: 'ai-agent',
        agentId: context.agentId,
        conversationId: context.conversationId,
      },
    });

    this.logger.log(
      `CRM contact created: ${result.id} for org ${context.organizationId}`,
    );

    return {
      success: true,
      data: {
        contactId: result.id,
        email,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        alreadyExisted: false,
      },
      message: `Contact created successfully in CRM (${email})`,
    };
  }

  private async updateContact(
    crmProvider: ReturnType<IntegrationRouterService['getCrmProvider']>,
    config: Record<string, string>,
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    const email = (params.email as string) ?? context.visitorEmail;

    if (!email) {
      return {
        success: false,
        message: 'Contact email is required to identify the contact',
        error: 'MISSING_EMAIL',
      };
    }

    const existing = await crmProvider.getContact(config, email);
    if (!existing) {
      return await this.createContact(crmProvider, config, params, context);
    }

    const nameParts = this.parseVisitorName(params, context.visitorName);

    const updated = await crmProvider.createContact(config, {
      email,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      phone: params.phone as string | undefined,
      properties: {
        company: params.company as string | undefined,
        lastUpdatedByAgent: context.agentId,
      },
    });

    this.logger.log(
      `CRM contact updated: ${updated.id} for org ${context.organizationId}`,
    );

    return {
      success: true,
      data: { contactId: updated.id, email, updated: true },
      message: `Contact updated successfully in CRM (${email})`,
    };
  }

  private async createDeal(
    crmProvider: ReturnType<IntegrationRouterService['getCrmProvider']>,
    config: Record<string, string>,
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    const name = params.name as string;
    if (!name) {
      return {
        success: false,
        message: 'Deal name is required',
        error: 'MISSING_DEAL_NAME',
      };
    }

    let contactId: string | undefined;
    const contactEmail =
      (params.contactEmail as string) ?? context.visitorEmail;

    if (contactEmail) {
      const contact = await crmProvider.getContact(config, contactEmail);
      if (contact) {
        contactId = contact.id as string;
      }
    }

    const result = await crmProvider.createDeal(config, {
      name,
      amount: params.amount as number | undefined,
      contactId,
      stage: params.stage as string | undefined,
    });

    this.logger.log(
      `CRM deal created: ${result.id} for org ${context.organizationId}`,
    );

    return {
      success: true,
      data: {
        dealId: result.id,
        name,
        amount: params.amount ?? null,
        contactId: contactId ?? null,
        stage: params.stage ?? null,
      },
      message: `Deal "${name}" created successfully in CRM`,
    };
  }

  private parseVisitorName(
    params: Record<string, unknown>,
    visitorName?: string,
  ): { firstName?: string; lastName?: string } {
    if (params.firstName || params.lastName) {
      return {
        firstName: params.firstName as string | undefined,
        lastName: params.lastName as string | undefined,
      };
    }

    if (visitorName) {
      const parts = visitorName.trim().split(/\s+/);
      return {
        firstName: parts[0],
        lastName: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
      };
    }

    return {};
  }
}
