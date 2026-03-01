import { Injectable, Logger } from '@nestjs/common';
import { CalendarProviderInterface } from './integration-provider.interface';
import { IntegrationHttpClient } from './integration-http.client';

const CALENDLY_API_BASE = 'https://api.calendly.com';

@Injectable()
export class CalendlyProvider implements CalendarProviderInterface {
  readonly integrationType = 'calendly';
  private readonly logger = new Logger(CalendlyProvider.name);

  constructor(private readonly http: IntegrationHttpClient) {}

  isConfigured(): boolean {
    return true;
  }

  async testConnection(
    config: Record<string, string>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.http.requestJson(`${CALENDLY_API_BASE}/users/me`, {
        headers: this.buildHeaders(config),
        timeoutMs: 10000,
        retries: 1,
      });
      return { success: true };
    } catch (error) {
      this.logger.error('Calendly connection test failed', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAvailableSlots(
    config: Record<string, string>,
    calendarId: string,
    dateRange: { from: string; to: string },
  ): Promise<{ start: string; end: string }[]> {
    const params = new URLSearchParams({
      event_type: calendarId,
      start_time: dateRange.from,
      end_time: dateRange.to,
    });

    const result = await this.http.requestJson<{ collection?: Array<{ start_time: string; end_time?: string }> }>(
      `${CALENDLY_API_BASE}/event_type_available_times?${params.toString()}`,
      {
        headers: this.buildHeaders(config),
        timeoutMs: 10000,
        retries: 1,
      },
    );

    const slots = result.collection || [];

    return slots.map((slot) => ({
      start: slot.start_time,
      end: slot.end_time || slot.start_time,
    }));
  }

  async createEvent(
    config: Record<string, string>,
    data: {
      calendarId: string;
      title: string;
      start: string;
      end: string;
      attendeeEmail?: string;
      description?: string;
    },
  ): Promise<{ id: string; link?: string }> {
    const schedulingLink = await this.getSchedulingLink(config, data.calendarId);

    return {
      id: `calendly_booking_${Date.now()}`,
      link: schedulingLink,
    };
  }

  private async getSchedulingLink(
    config: Record<string, string>,
    eventTypeUri: string,
  ): Promise<string> {
    const result = await this.http.requestJson<{ resource?: { booking_url?: string } }>(
      `${CALENDLY_API_BASE}/scheduling_links`,
      {
        method: 'POST',
        headers: this.buildHeaders(config),
        body: {
          max_event_count: 1,
          owner: eventTypeUri,
          owner_type: 'EventType',
        },
        timeoutMs: 10000,
        retries: 1,
      },
    );

    return result.resource?.booking_url || '';
  }

  private buildHeaders(config: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.calendly_api_key}`,
    };
    if (config.__requestId) headers['X-Request-Id'] = config.__requestId;
    return headers;
  }
}
