import { Injectable, Logger } from '@nestjs/common';
import { EmailMarketingProviderInterface } from './integration-provider.interface';
import { createHash } from 'crypto';

@Injectable()
export class MailchimpProvider implements EmailMarketingProviderInterface {
  readonly integrationType = 'mailchimp';
  private readonly logger = new Logger(MailchimpProvider.name);

  isConfigured(): boolean {
    return true;
  }

  async testConnection(
    config: Record<string, string>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const baseUrl = this.getBaseUrl(config);
      const response = await fetch(`${baseUrl}/3.0/ping`, {
        headers: this.buildHeaders(config),
      });

      if (!response.ok) {
        const body = await response.text();
        return { success: false, error: `Mailchimp API error ${response.status}: ${body}` };
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Mailchimp connection test failed', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async addSubscriber(
    config: Record<string, string>,
    data: {
      email: string;
      firstName?: string;
      lastName?: string;
      listId?: string;
      tags?: string[];
    },
  ): Promise<{ id: string }> {
    const baseUrl = this.getBaseUrl(config);
    const listId = data.listId || config.mailchimp_default_list_id;

    if (!listId) {
      throw new Error('No listId provided and no default list configured');
    }

    const mergeFields: Record<string, string> = {};
    if (data.firstName) mergeFields.FNAME = data.firstName;
    if (data.lastName) mergeFields.LNAME = data.lastName;

    const payload: Record<string, unknown> = {
      email_address: data.email,
      status: 'subscribed',
    };

    if (Object.keys(mergeFields).length > 0) payload.merge_fields = mergeFields;
    if (data.tags && data.tags.length > 0) payload.tags = data.tags;

    const response = await fetch(`${baseUrl}/3.0/lists/${listId}/members`, {
      method: 'POST',
      headers: this.buildHeaders(config),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Mailchimp addSubscriber failed: ${response.status} ${body}`);
      throw new Error(`Mailchimp addSubscriber failed: ${response.status}`);
    }

    const result = await response.json();
    return { id: result.id };
  }

  async removeSubscriber(
    config: Record<string, string>,
    email: string,
    listId?: string,
  ): Promise<void> {
    const baseUrl = this.getBaseUrl(config);
    const resolvedListId = listId || config.mailchimp_default_list_id;

    if (!resolvedListId) {
      throw new Error('No listId provided and no default list configured');
    }

    const subscriberHash = this.getEmailHash(email);

    const response = await fetch(
      `${baseUrl}/3.0/lists/${resolvedListId}/members/${subscriberHash}`,
      {
        method: 'DELETE',
        headers: this.buildHeaders(config),
      },
    );

    if (!response.ok && response.status !== 404) {
      const body = await response.text();
      this.logger.error(`Mailchimp removeSubscriber failed: ${response.status} ${body}`);
      throw new Error(`Mailchimp removeSubscriber failed: ${response.status}`);
    }
  }

  private getBaseUrl(config: Record<string, string>): string {
    const serverPrefix = config.mailchimp_server_prefix;
    if (!serverPrefix) throw new Error('Missing mailchimp_server_prefix in config');
    return `https://${serverPrefix}.api.mailchimp.com`;
  }

  private buildHeaders(config: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.mailchimp_api_key}`,
    };
  }

  private getEmailHash(email: string): string {
    return createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  }
}
