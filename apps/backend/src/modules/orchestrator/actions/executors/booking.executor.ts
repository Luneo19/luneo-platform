import { Injectable, Logger } from '@nestjs/common';
import { IntegrationRouterService } from '@/modules/integrations/providers/integration-router.service';
import {
  ActionCategory,
  ActionContext,
  ActionDefinition,
  ActionExecutor,
  ActionResult,
} from '../action.interface';

@Injectable()
export class BookingExecutor implements ActionExecutor {
  private readonly logger = new Logger(BookingExecutor.name);

  readonly actionId = 'booking.create_appointment';

  readonly definition: ActionDefinition = {
    id: this.actionId,
    name: 'Create Appointment',
    description:
      'Book an appointment or meeting via Google Calendar or Calendly',
    category: ActionCategory.BOOKING,
    requiresAuth: true,
    requiredIntegration: 'calendar',
    parameters: [
      {
        name: 'date',
        type: 'date',
        description: 'Date of the appointment (ISO 8601)',
        required: true,
      },
      {
        name: 'time',
        type: 'string',
        description: 'Start time (HH:mm format, 24h)',
        required: true,
      },
      {
        name: 'duration',
        type: 'number',
        description: 'Duration in minutes',
        required: false,
        default: 30,
      },
      {
        name: 'attendeeEmail',
        type: 'email',
        description: 'Email of the attendee',
        required: true,
      },
      {
        name: 'attendeeName',
        type: 'string',
        description: 'Full name of the attendee',
        required: false,
      },
      {
        name: 'description',
        type: 'string',
        description: 'Description or notes for the appointment',
        required: false,
      },
      {
        name: 'calendarProvider',
        type: 'string',
        description: 'Calendar provider to use (google_calendar or calendly)',
        required: false,
        default: 'google_calendar',
      },
      {
        name: 'calendarId',
        type: 'string',
        description: 'Calendar ID (defaults to primary)',
        required: false,
        default: 'primary',
      },
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
      const date = params.date as string;
      const time = params.time as string;
      const duration = (params.duration as number) ?? 30;
      const attendeeEmail =
        (params.attendeeEmail as string) ?? context.visitorEmail;
      const attendeeName =
        (params.attendeeName as string) ?? context.visitorName;
      const description = (params.description as string) ?? '';
      const providerType =
        (params.calendarProvider as string) ?? 'google_calendar';
      const calendarId = (params.calendarId as string) ?? 'primary';

      if (!attendeeEmail) {
        return {
          success: false,
          message: 'Attendee email is required to book an appointment',
          error: 'MISSING_ATTENDEE_EMAIL',
        };
      }

      const config = context.integrationConfigs?.['calendar'];
      if (!config) {
        return {
          success: false,
          message:
            'No calendar integration configured for this organization',
          error: 'INTEGRATION_NOT_CONFIGURED',
        };
      }

      const startDateTime = this.buildDateTime(date, time);
      const endDateTime = new Date(
        startDateTime.getTime() + duration * 60_000,
      );

      const calendarProvider =
        this.integrationRouter.getCalendarProvider(providerType);

      const title = attendeeName
        ? `Rendez-vous avec ${attendeeName}`
        : `Rendez-vous - ${attendeeEmail}`;

      const event = await calendarProvider.createEvent(config, {
        calendarId,
        title,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        attendeeEmail,
        description,
      });

      this.logger.log(
        `Appointment created: ${event.id} for org ${context.organizationId}`,
      );

      return {
        success: true,
        data: {
          eventId: event.id,
          bookingLink: event.link ?? null,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          attendeeEmail,
          attendeeName: attendeeName ?? null,
          provider: providerType,
        },
        message: `Appointment booked successfully for ${startDateTime.toLocaleDateString('fr-FR')} at ${time}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create appointment: ${errorMessage}`);

      return {
        success: false,
        message: 'Failed to create the appointment',
        error: errorMessage,
      };
    }
  }

  private buildDateTime(date: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const dateObj = new Date(date);
    dateObj.setHours(hours, minutes, 0, 0);
    return dateObj;
  }
}
