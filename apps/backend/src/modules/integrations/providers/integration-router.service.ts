import { Injectable, Logger } from '@nestjs/common';
import {
  CrmProviderInterface,
  CalendarProviderInterface,
  EmailMarketingProviderInterface,
} from './integration-provider.interface';
import { HubSpotProvider } from './hubspot.provider';
import { SalesforceProvider } from './salesforce.provider';
import { GoogleCalendarProvider } from './google-calendar.provider';
import { CalendlyProvider } from './calendly.provider';
import { MailchimpProvider } from './mailchimp.provider';

@Injectable()
export class IntegrationRouterService {
  private readonly logger = new Logger(IntegrationRouterService.name);

  private readonly crmProviders: Map<string, CrmProviderInterface>;
  private readonly calendarProviders: Map<string, CalendarProviderInterface>;
  private readonly emailMarketingProviders: Map<string, EmailMarketingProviderInterface>;

  constructor(
    private readonly hubSpotProvider: HubSpotProvider,
    private readonly salesforceProvider: SalesforceProvider,
    private readonly googleCalendarProvider: GoogleCalendarProvider,
    private readonly calendlyProvider: CalendlyProvider,
    private readonly mailchimpProvider: MailchimpProvider,
  ) {
    this.crmProviders = new Map<string, CrmProviderInterface>([
      ['hubspot', this.hubSpotProvider],
      ['salesforce', this.salesforceProvider],
    ]);

    this.calendarProviders = new Map<string, CalendarProviderInterface>([
      ['google_calendar', this.googleCalendarProvider],
      ['calendly', this.calendlyProvider],
    ]);

    this.emailMarketingProviders = new Map<string, EmailMarketingProviderInterface>([
      ['mailchimp', this.mailchimpProvider],
    ]);
  }

  getCrmProvider(type: string): CrmProviderInterface {
    const provider = this.crmProviders.get(type);
    if (!provider) {
      this.logger.warn(`Unknown CRM provider type: ${type}`);
      throw new Error(`Unsupported CRM provider: ${type}. Available: ${[...this.crmProviders.keys()].join(', ')}`);
    }
    return provider;
  }

  getCalendarProvider(type: string): CalendarProviderInterface {
    const provider = this.calendarProviders.get(type);
    if (!provider) {
      this.logger.warn(`Unknown calendar provider type: ${type}`);
      throw new Error(`Unsupported calendar provider: ${type}. Available: ${[...this.calendarProviders.keys()].join(', ')}`);
    }
    return provider;
  }

  getEmailMarketingProvider(type: string): EmailMarketingProviderInterface {
    const provider = this.emailMarketingProviders.get(type);
    if (!provider) {
      this.logger.warn(`Unknown email marketing provider type: ${type}`);
      throw new Error(`Unsupported email marketing provider: ${type}. Available: ${[...this.emailMarketingProviders.keys()].join(', ')}`);
    }
    return provider;
  }

  getSupportedCrmTypes(): string[] {
    return [...this.crmProviders.keys()];
  }

  getSupportedCalendarTypes(): string[] {
    return [...this.calendarProviders.keys()];
  }

  getSupportedEmailMarketingTypes(): string[] {
    return [...this.emailMarketingProviders.keys()];
  }
}
