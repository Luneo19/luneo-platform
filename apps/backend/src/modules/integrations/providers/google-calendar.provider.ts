import { Injectable, Logger } from '@nestjs/common';
import { CalendarProviderInterface } from './integration-provider.interface';
import { IntegrationHttpClient } from './integration-http.client';

const GCAL_API_BASE = 'https://www.googleapis.com/calendar/v3';

@Injectable()
export class GoogleCalendarProvider implements CalendarProviderInterface {
  readonly integrationType = 'google_calendar';
  private readonly logger = new Logger(GoogleCalendarProvider.name);

  constructor(private readonly http: IntegrationHttpClient) {}

  isConfigured(): boolean {
    return true;
  }

  async testConnection(
    config: Record<string, string>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.http.requestJson(`${GCAL_API_BASE}/users/me/calendarList?maxResults=1`, {
        headers: this.buildHeaders(config),
        timeoutMs: 10000,
        retries: 1,
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Google Calendar connection test failed', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAvailableSlots(
    config: Record<string, string>,
    calendarId: string,
    dateRange: { from: string; to: string },
  ): Promise<{ start: string; end: string }[]> {
    const busyPeriods = await this.getFreeBusy(config, calendarId, dateRange);
    return this.invertBusyPeriods(busyPeriods, dateRange);
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
    const event: Record<string, unknown> = {
      summary: data.title,
      start: { dateTime: data.start },
      end: { dateTime: data.end },
    };

    if (data.description) event.description = data.description;
    if (data.attendeeEmail) {
      event.attendees = [{ email: data.attendeeEmail }];
    }

    const encodedCalendarId = encodeURIComponent(data.calendarId);
    const result = await this.http.requestJson<{ id: string; htmlLink?: string }>(
      `${GCAL_API_BASE}/calendars/${encodedCalendarId}/events?sendUpdates=all`,
      {
        method: 'POST',
        headers: this.buildHeaders(config),
        body: event,
        timeoutMs: 10000,
        retries: 1,
      },
    );

    return { id: result.id, link: result.htmlLink };
  }

  private async getFreeBusy(
    config: Record<string, string>,
    calendarId: string,
    dateRange: { from: string; to: string },
  ): Promise<{ start: string; end: string }[]> {
    const result = await this.http.requestJson<{ calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }> }>(
      `${GCAL_API_BASE}/freeBusy`,
      {
        method: 'POST',
        headers: this.buildHeaders(config),
        body: {
          timeMin: dateRange.from,
          timeMax: dateRange.to,
          items: [{ id: calendarId }],
        },
        timeoutMs: 10000,
        retries: 1,
      },
    );

    const calendarBusy = result.calendars?.[calendarId]?.busy || [];

    return calendarBusy.map((period: { start: string; end: string }) => ({
      start: period.start,
      end: period.end,
    }));
  }

  private invertBusyPeriods(
    busyPeriods: { start: string; end: string }[],
    dateRange: { from: string; to: string },
  ): { start: string; end: string }[] {
    if (busyPeriods.length === 0) {
      return [{ start: dateRange.from, end: dateRange.to }];
    }

    const sorted = [...busyPeriods].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );

    const freeSlots: { start: string; end: string }[] = [];

    const rangeStart = new Date(dateRange.from);
    const firstBusyStart = new Date(sorted[0].start);
    if (rangeStart < firstBusyStart) {
      freeSlots.push({ start: dateRange.from, end: sorted[0].start });
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      const gapStart = new Date(sorted[i].end);
      const gapEnd = new Date(sorted[i + 1].start);
      if (gapStart < gapEnd) {
        freeSlots.push({ start: sorted[i].end, end: sorted[i + 1].start });
      }
    }

    const lastBusyEnd = new Date(sorted[sorted.length - 1].end);
    const rangeEnd = new Date(dateRange.to);
    if (lastBusyEnd < rangeEnd) {
      freeSlots.push({ start: sorted[sorted.length - 1].end, end: dateRange.to });
    }

    return freeSlots;
  }

  private buildHeaders(config: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.google_calendar_access_token}`,
    };
    if (config.__requestId) headers['X-Request-Id'] = config.__requestId;
    return headers;
  }
}
