import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '@/modules/email/email.service';
import {
  ActionCategory,
  ActionContext,
  ActionDefinition,
  ActionExecutor,
  ActionResult,
} from '../action.interface';

@Injectable()
export class EmailExecutor implements ActionExecutor {
  private readonly logger = new Logger(EmailExecutor.name);

  readonly actionId = 'email.send';

  readonly definition: ActionDefinition = {
    id: this.actionId,
    name: 'Send Email',
    description: 'Send an email to a recipient using the configured provider',
    category: ActionCategory.EMAIL,
    requiresAuth: false,
    parameters: [
      {
        name: 'to',
        type: 'email',
        description: 'Recipient email address',
        required: true,
      },
      {
        name: 'subject',
        type: 'string',
        description: 'Email subject line',
        required: true,
      },
      {
        name: 'body',
        type: 'string',
        description: 'Email body content (plain text or HTML)',
        required: true,
      },
      {
        name: 'template',
        type: 'string',
        description:
          'Email template name (welcome, password-reset, confirmation, order-confirmation)',
        required: false,
      },
      {
        name: 'templateData',
        type: 'string',
        description: 'JSON-encoded data for the template variables',
        required: false,
      },
      {
        name: 'isHtml',
        type: 'boolean',
        description: 'Whether the body is HTML content',
        required: false,
        default: false,
      },
    ],
  };

  constructor(private readonly emailService: EmailService) {}

  async execute(
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      const to = (params.to as string) ?? context.visitorEmail;
      const subject = params.subject as string;
      const body = params.body as string;
      const template = params.template as string | undefined;
      const isHtml = (params.isHtml as boolean) ?? false;

      if (!to) {
        return {
          success: false,
          message: 'Recipient email address is required',
          error: 'MISSING_RECIPIENT',
        };
      }

      if (!subject) {
        return {
          success: false,
          message: 'Email subject is required',
          error: 'MISSING_SUBJECT',
        };
      }

      if (template) {
        return await this.sendTemplateEmail(to, template, params, context);
      }

      const result = await this.emailService.sendEmail({
        to,
        subject,
        ...(isHtml ? { html: body } : { text: body }),
        tags: ['agent-action', `agent-${context.agentId}`],
      });

      this.logger.log(
        `Email sent to ${to} for agent ${context.agentId}, org ${context.organizationId}`,
      );

      return {
        success: true,
        data: {
          messageId: this.extractMessageId(result),
          to,
          subject,
          status: 'sent',
        },
        message: `Email sent successfully to ${to}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email: ${errorMessage}`);

      return {
        success: false,
        message: 'Failed to send email',
        error: errorMessage,
      };
    }
  }

  private async sendTemplateEmail(
    to: string,
    template: string,
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    let templateData: Record<string, unknown> = {};

    if (typeof params.templateData === 'string') {
      try {
        templateData = JSON.parse(params.templateData);
      } catch {
        return {
          success: false,
          message: 'Invalid templateData JSON',
          error: 'INVALID_TEMPLATE_DATA',
        };
      }
    } else if (
      params.templateData &&
      typeof params.templateData === 'object'
    ) {
      templateData = params.templateData as Record<string, unknown>;
    }

    switch (template) {
      case 'welcome': {
        const userName =
          (templateData.userName as string) ??
          context.visitorName ??
          'Utilisateur';
        await this.emailService.sendWelcomeEmail(to, userName);
        break;
      }
      case 'order-confirmation': {
        await this.emailService.sendOrderConfirmationEmail(to, {
          orderId: (templateData.orderId as string) ?? '',
          orderNumber: (templateData.orderNumber as string) ?? '',
          customerName:
            (templateData.customerName as string) ??
            context.visitorName ??
            '',
          items:
            (templateData.items as Array<{
              name: string;
              quantity: number;
              price: string;
            }>) ?? [],
          total: (templateData.total as string) ?? '0',
          estimatedDelivery: templateData.estimatedDelivery as
            | string
            | undefined,
        });
        break;
      }
      default: {
        await this.emailService.sendEmail({
          to,
          subject: (params.subject as string) ?? `Notification Luneo`,
          template,
          templateData,
          tags: ['agent-action', `agent-${context.agentId}`],
        });
      }
    }

    this.logger.log(
      `Template email "${template}" sent to ${to} for agent ${context.agentId}`,
    );

    return {
      success: true,
      data: { to, template, status: 'sent' },
      message: `Template email "${template}" sent successfully to ${to}`,
    };
  }

  private extractMessageId(result: unknown): string | null {
    if (result && typeof result === 'object') {
      const res = result as Record<string, unknown>;
      if (typeof res.id === 'string') return res.id;
      if (typeof res.messageId === 'string') return res.messageId;
    }
    return null;
  }
}
