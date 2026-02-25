import { Injectable, Logger } from '@nestjs/common';
import { CrmProviderInterface } from './integration-provider.interface';

const SF_API_VERSION = 'v58.0';

@Injectable()
export class SalesforceProvider implements CrmProviderInterface {
  readonly integrationType = 'salesforce';
  private readonly logger = new Logger(SalesforceProvider.name);

  isConfigured(): boolean {
    return true;
  }

  async testConnection(
    config: Record<string, string>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const baseUrl = this.getBaseUrl(config);
      const response = await fetch(`${baseUrl}/services/data/${SF_API_VERSION}/limits`, {
        headers: this.buildHeaders(config),
      });

      if (!response.ok) {
        const body = await response.text();
        return { success: false, error: `Salesforce API error ${response.status}: ${body}` };
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Salesforce connection test failed', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createContact(
    config: Record<string, string>,
    data: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      properties?: Record<string, unknown>;
    },
  ): Promise<{ id: string }> {
    const baseUrl = this.getBaseUrl(config);
    const payload: Record<string, unknown> = {
      Email: data.email,
      LastName: data.lastName || 'Unknown',
      ...data.properties,
    };

    if (data.firstName) payload.FirstName = data.firstName;
    if (data.phone) payload.Phone = data.phone;

    const response = await fetch(
      `${baseUrl}/services/data/${SF_API_VERSION}/sobjects/Contact`,
      {
        method: 'POST',
        headers: this.buildHeaders(config),
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Salesforce createContact failed: ${response.status} ${body}`);
      throw new Error(`Salesforce createContact failed: ${response.status}`);
    }

    const result = await response.json();
    return { id: result.id };
  }

  async getContact(
    config: Record<string, string>,
    email: string,
  ): Promise<Record<string, unknown> | null> {
    const baseUrl = this.getBaseUrl(config);
    const soql = `SELECT Id, FirstName, LastName, Email, Phone FROM Contact WHERE Email = '${this.escapeSoql(email)}' LIMIT 1`;

    const response = await fetch(
      `${baseUrl}/services/data/${SF_API_VERSION}/query?q=${encodeURIComponent(soql)}`,
      { headers: this.buildHeaders(config) },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Salesforce getContact failed: ${response.status} ${body}`);
      throw new Error(`Salesforce getContact failed: ${response.status}`);
    }

    const result = await response.json();
    if (result.totalSize === 0) return null;

    const record = result.records[0];
    return {
      id: record.Id,
      firstName: record.FirstName,
      lastName: record.LastName,
      email: record.Email,
      phone: record.Phone,
    };
  }

  async createDeal(
    config: Record<string, string>,
    data: {
      name: string;
      amount?: number;
      contactId?: string;
      stage?: string;
    },
  ): Promise<{ id: string }> {
    const baseUrl = this.getBaseUrl(config);
    const payload: Record<string, unknown> = {
      Name: data.name,
      StageName: data.stage || 'Prospecting',
      CloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    };

    if (data.amount !== undefined) payload.Amount = data.amount;
    if (data.contactId) payload.ContactId = data.contactId;

    const response = await fetch(
      `${baseUrl}/services/data/${SF_API_VERSION}/sobjects/Opportunity`,
      {
        method: 'POST',
        headers: this.buildHeaders(config),
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Salesforce createDeal failed: ${response.status} ${body}`);
      throw new Error(`Salesforce createDeal failed: ${response.status}`);
    }

    const result = await response.json();
    return { id: result.id };
  }

  private getBaseUrl(config: Record<string, string>): string {
    const instanceUrl = config.salesforce_instance_url;
    if (!instanceUrl) throw new Error('Missing salesforce_instance_url in config');
    return instanceUrl.replace(/\/$/, '');
  }

  private buildHeaders(config: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.salesforce_access_token}`,
    };
  }

  private escapeSoql(value: string): string {
    return value.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
  }
}
