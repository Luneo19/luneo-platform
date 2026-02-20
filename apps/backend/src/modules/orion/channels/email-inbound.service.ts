import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface InboundEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    url?: string;
  }>;
}

@Injectable()
export class EmailInboundService {
  private readonly logger = new Logger(EmailInboundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async processInboundEmail(email: InboundEmail) {
    this.logger.log(
      `Processing inbound email from ${email.from}: ${email.subject}`,
    );

    const threadTicket = await this.findExistingThread(email);

    if (threadTicket) {
      return this.addMessageToThread(threadTicket.id, email);
    }

    return this.createTicketFromEmail(email);
  }

  private async findExistingThread(email: InboundEmail) {
    const refMatch = email.subject.match(/\[TKT-(\w+)\]/);
    if (refMatch) {
      return this.prisma.ticket.findFirst({
        where: { ticketNumber: `TKT-${refMatch[1]}` },
      });
    }

    return null;
  }

  private async addMessageToThread(ticketId: string, email: InboundEmail) {
    const user = await this.prisma.user.findFirst({
      where: { email: email.from.replace(/<|>/g, '').trim() },
    });

    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        type: 'USER',
        content: email.text || email.html || '',
        userId: user?.id,
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'IN_PROGRESS' },
    });

    this.eventEmitter.emit('ticket.message.added', { ticketId });

    return { action: 'threaded', ticketId };
  }

  private async createTicketFromEmail(email: InboundEmail) {
    const fromEmail = email.from.replace(/<|>/g, '').trim();
    const user = await this.prisma.user.findFirst({
      where: { email: fromEmail },
    });

    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        subject: email.subject || 'Email sans objet',
        description: email.text || email.html || '',
        source: 'EMAIL',
        userId: user?.id || '',
        status: 'OPEN',
        priority: 'MEDIUM',
        category: 'OTHER',
      },
    });

    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        type: 'USER',
        content: email.text || email.html || '',
        userId: user?.id,
      },
    });

    this.eventEmitter.emit('ticket.created', { ticketId: ticket.id });

    this.logger.log(
      `Created ticket ${ticketNumber} from email by ${fromEmail}`,
    );

    return { action: 'created', ticketId: ticket.id, ticketNumber };
  }
}
