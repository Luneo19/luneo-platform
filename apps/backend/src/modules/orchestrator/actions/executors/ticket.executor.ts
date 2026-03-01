import { Injectable, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import {
  ActionCategory,
  ActionContext,
  ActionDefinition,
  ActionExecutor,
  ActionResult,
} from '../action.interface';

const PRIORITY_MAP: Record<string, string> = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  urgent: 'URGENT',
};

@Injectable()
export class TicketExecutor implements ActionExecutor {
  private readonly logger = new Logger(TicketExecutor.name);

  readonly actionId = 'ticket.create';

  readonly definition: ActionDefinition = {
    id: this.actionId,
    name: 'Create Support Ticket',
    description:
      'Create a support ticket in the system for customer follow-up',
    category: ActionCategory.TICKET,
    requiresAuth: false,
    parameters: [
      {
        name: 'subject',
        type: 'string',
        description: 'Ticket subject / title',
        required: true,
      },
      {
        name: 'description',
        type: 'string',
        description: 'Detailed description of the issue or request',
        required: true,
      },
      {
        name: 'priority',
        type: 'string',
        description: 'Ticket priority: low, medium, high, urgent',
        required: false,
        default: 'medium',
      },
      {
        name: 'category',
        type: 'string',
        description: 'Ticket category (e.g. billing, technical, general)',
        required: false,
      },
      {
        name: 'customerEmail',
        type: 'email',
        description: 'Customer email address for follow-up',
        required: false,
      },
      {
        name: 'customerName',
        type: 'string',
        description: 'Customer name',
        required: false,
      },
    ],
  };

  constructor(private readonly prisma: PrismaOptimizedService) {}

  async execute(
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      const subject = params.subject as string;
      const description = params.description as string;
      const priorityInput = ((params.priority as string) ?? 'medium').toLowerCase();
      const category = params.category as string | undefined;
      const customerEmail =
        (params.customerEmail as string) ?? context.visitorEmail;
      const customerName =
        (params.customerName as string) ?? context.visitorName;

      if (!subject || !description) {
        return {
          success: false,
          message: 'Subject and description are required',
          error: 'MISSING_REQUIRED_FIELDS',
        };
      }

      const priority = PRIORITY_MAP[priorityInput] ?? 'MEDIUM';

      const descriptionWithContext = customerEmail
        ? `${description}\n\n---\nContact: ${customerName ?? 'N/A'} <${customerEmail}>\nConversation: ${context.conversationId}\nAgent: ${context.agentId}`
        : `${description}\n\n---\nConversation: ${context.conversationId}\nAgent: ${context.agentId}`;

      const ticket = await this.prisma.ticket.create({
        data: {
          subject,
          description: descriptionWithContext,
          priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
          status: 'OPEN',
          category: category ?? null,
          organizationId: context.organizationId,
          tags: customerEmail
            ? ['agent-created', `conversation-${context.conversationId}`]
            : ['agent-created'],
          customFields: {
            source: 'ai-agent',
            agentId: context.agentId,
            conversationId: context.conversationId,
            customerEmail: customerEmail ?? null,
            customerName: customerName ?? null,
          },
        },
      });

      this.logger.log(
        `Ticket created: ${ticket.id} for org ${context.organizationId}`,
      );

      return {
        success: true,
        data: {
          ticketId: ticket.id,
          subject: ticket.subject,
          priority,
          status: ticket.status,
          category: ticket.category,
          customerEmail: customerEmail ?? null,
        },
        message: `Support ticket created successfully (ID: ${ticket.id})`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create ticket: ${errorMessage}`);

      return {
        success: false,
        message: 'Failed to create support ticket',
        error: errorMessage,
      };
    }
  }
}
