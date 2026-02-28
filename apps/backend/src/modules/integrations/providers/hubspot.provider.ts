import { Injectable, Logger } from '@nestjs/common';
import { CrmProviderInterface } from './integration-provider.interface';
import { IntegrationHttpClient } from './integration-http.client';

const HUBSPOT_API_BASE = 'https://api.hubapi.com/crm/v3';

@Injectable()
export class HubSpotProvider implements CrmProviderInterface {
  readonly integrationType = 'hubspot';
  private readonly logger = new Logger(HubSpotProvider.name);

  constructor(private readonly http: IntegrationHttpClient) {}

  isConfigured(): boolean {
    return true;
  }

  async testConnection(
    config: Record<string, string>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.http.requestJson(`${HUBSPOT_API_BASE}/objects/contacts?limit=1`, {
        headers: this.buildHeaders(config),
        timeoutMs: 10000,
        retries: 1,
      });
      return { success: true };
    } catch (error) {
      this.logger.error('HubSpot connection test failed', error);
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
    const properties: Record<string, unknown> = {
      email: data.email,
      ...data.properties,
    };

    if (data.firstName) properties.firstname = data.firstName;
    if (data.lastName) properties.lastname = data.lastName;
    if (data.phone) properties.phone = data.phone;

    const result = await this.http.requestJson<{ id: string }>(`${HUBSPOT_API_BASE}/objects/contacts`, {
      method: 'POST',
      headers: this.buildHeaders(config),
      body: { properties },
      timeoutMs: 10000,
      retries: 1,
    });

    return { id: result.id };
  }

  async getContact(
    config: Record<string, string>,
    email: string,
  ): Promise<Record<string, unknown> | null> {
    const result = await this.http.requestJson<{ total: number; results: Array<{ id: string; properties: Record<string, unknown> }> }>(
      `${HUBSPOT_API_BASE}/objects/contacts/search`,
      {
        method: 'POST',
        headers: this.buildHeaders(config),
        body: {
          filterGroups: [
            {
              filters: [
                { propertyName: 'email', operator: 'EQ', value: email },
              ],
            },
          ],
        },
        timeoutMs: 10000,
        retries: 1,
      },
    );

    if (result.total === 0) return null;

    const contact = result.results[0];
    return { id: contact.id, ...contact.properties };
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
    const properties: Record<string, unknown> = {
      dealname: data.name,
    };

    if (data.amount !== undefined) properties.amount = String(data.amount);
    if (data.stage) properties.dealstage = data.stage;

    const result = await this.http.requestJson<{ id: string }>(`${HUBSPOT_API_BASE}/objects/deals`, {
      method: 'POST',
      headers: this.buildHeaders(config),
      body: { properties },
      timeoutMs: 10000,
      retries: 1,
    });

    if (data.contactId) {
      await this.associateDealToContact(config, result.id, data.contactId);
    }

    return { id: result.id };
  }

  private async associateDealToContact(
    config: Record<string, string>,
    dealId: string,
    contactId: string,
  ): Promise<void> {
    const url = `${HUBSPOT_API_BASE}/objects/deals/${dealId}/associations/contacts/${contactId}/deal_to_contact`;

    try {
      await this.http.requestJson(url, {
        method: 'PUT',
        headers: this.buildHeaders(config),
        timeoutMs: 10000,
        retries: 1,
      });
    } catch (error) {
      this.logger.warn(`HubSpot deal-contact association failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildHeaders(config: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.hubspot_api_key}`,
    };
    if (config.__requestId) headers['X-Request-Id'] = config.__requestId;
    return headers;
  }
}
