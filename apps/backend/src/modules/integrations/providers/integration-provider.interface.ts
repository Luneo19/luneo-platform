export interface IntegrationProviderInterface {
  readonly integrationType: string;
  isConfigured(): boolean;
  testConnection(
    config: Record<string, string>,
  ): Promise<{ success: boolean; error?: string }>;
}

export interface CrmProviderInterface extends IntegrationProviderInterface {
  createContact(
    config: Record<string, string>,
    data: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      properties?: Record<string, unknown>;
    },
  ): Promise<{ id: string }>;

  getContact(
    config: Record<string, string>,
    email: string,
  ): Promise<Record<string, unknown> | null>;

  createDeal(
    config: Record<string, string>,
    data: {
      name: string;
      amount?: number;
      contactId?: string;
      stage?: string;
    },
  ): Promise<{ id: string }>;
}

export interface CalendarProviderInterface extends IntegrationProviderInterface {
  getAvailableSlots(
    config: Record<string, string>,
    calendarId: string,
    dateRange: { from: string; to: string },
  ): Promise<{ start: string; end: string }[]>;

  createEvent(
    config: Record<string, string>,
    data: {
      calendarId: string;
      title: string;
      start: string;
      end: string;
      attendeeEmail?: string;
      description?: string;
    },
  ): Promise<{ id: string; link?: string }>;
}

export interface EmailMarketingProviderInterface
  extends IntegrationProviderInterface {
  addSubscriber(
    config: Record<string, string>,
    data: {
      email: string;
      firstName?: string;
      lastName?: string;
      listId?: string;
      tags?: string[];
    },
  ): Promise<{ id: string }>;

  removeSubscriber(
    config: Record<string, string>,
    email: string,
    listId?: string,
  ): Promise<void>;
}
