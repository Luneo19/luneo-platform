// @ts-nocheck
import { Controller, Post, Body, Get, InternalServerErrorException, Logger, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { MailgunService } from './mailgun.service';
import { SendGridService } from './sendgrid.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/compat/v1-enums';
import { SendGridTemplateDto } from './dto/sendgrid-template.dto';
import { SendGridScheduledDto } from './dto/sendgrid-scheduled.dto';

export class SendEmailDto {
  to!: string | string[];
  subject!: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  provider?: 'sendgrid' | 'mailgun' | 'auto';
}

export class TestEmailDto {
  email: string;
  name?: string;
  provider?: 'sendgrid' | 'mailgun' | 'auto';
}

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly mailgunService: MailgunService,
    private readonly sendgridService: SendGridService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Guard: block test endpoints in production even if RBAC is bypassed
   */
  private ensureNotProduction(): void {
    const nodeEnv = this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV;
    if (nodeEnv === 'production') {
      throw new ForbiddenException('Test email endpoints are disabled in production');
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get email providers status' })
  @ApiResponse({ status: 200, description: 'Email providers status' })
  getStatus() {
    return {
      providers: this.emailService.getProviderStatus(),
      sendgrid: this.sendgridService.getConfig(),
      mailgun: { available: this.mailgunService.isAvailable() },
      timestamp: new Date().toISOString(),
    };
  }

  @Post('send')
  @ApiOperation({ summary: 'Send email' })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid email data' })
  @ApiResponse({ status: 500, description: 'Email sending failed' })
  async sendEmail(@Body() emailData: SendEmailDto) {
    try {
      const result = await this.emailService.sendEmail(emailData);
      return {
        success: true,
        message: 'Email sent successfully',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to send email', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  @Post('test/welcome')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Send welcome test email (admin only)' })
  @ApiBody({ type: TestEmailDto })
  @ApiResponse({ status: 200, description: 'Welcome email sent successfully' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async sendWelcomeTest(@Body() testData: TestEmailDto) {
    this.ensureNotProduction();
    try {
      const result = await this.emailService.sendWelcomeEmail(
        testData.email,
        testData.name || 'Test User',
        testData.provider,
      );
      return {
        success: true,
        message: 'Welcome email sent successfully',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to send welcome email', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to send welcome email');
    }
  }

  @Post('test/password-reset')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Send password reset test email (admin only)' })
  @ApiBody({ type: TestEmailDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent successfully' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async sendPasswordResetTest(@Body() testData: TestEmailDto) {
    this.ensureNotProduction();
    try {
      const resetToken = 'test-reset-token-' + Date.now();
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`;
      
      const result = await this.emailService.sendPasswordResetEmail(
        testData.email,
        resetToken,
        resetUrl,
        testData.provider,
      );
      return {
        success: true,
        message: 'Password reset email sent successfully',
        result,
        resetToken,
        resetUrl,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to send password reset email', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }

  @Post('test/confirmation')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Send email confirmation test email (admin only)' })
  @ApiBody({ type: TestEmailDto })
  @ApiResponse({ status: 200, description: 'Confirmation email sent successfully' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async sendConfirmationTest(@Body() testData: TestEmailDto) {
    this.ensureNotProduction();
    try {
      const confirmationToken = 'test-confirmation-token-' + Date.now();
      const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirm-email`;
      
      const result = await this.emailService.sendConfirmationEmail(
        testData.email,
        confirmationToken,
        confirmationUrl,
        testData.provider,
      );
      return {
        success: true,
        message: 'Confirmation email sent successfully',
        result,
        confirmationToken,
        confirmationUrl,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to send confirmation email', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to send confirmation email');
    }
  }

  // SendGrid specific endpoints
  @Post('sendgrid/simple')
  @ApiOperation({ summary: 'Send simple email via SendGrid (direct)' })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({ status: 200, description: 'SendGrid email sent successfully' })
  async sendSendGridSimple(@Body() emailData: SendEmailDto) {
    try {
      const result = await this.sendgridService.sendSimpleMessage({
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        from: emailData.from,
        cc: emailData.cc,
        bcc: emailData.bcc,
      });
      return {
        success: true,
        message: 'SendGrid email sent successfully',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to send SendGrid email', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to send SendGrid email');
    }
  }

  @Post('sendgrid/template')
  @ApiOperation({ summary: 'Send email with SendGrid template' })
  @ApiResponse({ status: 200, description: 'SendGrid template email sent successfully' })
  async sendSendGridTemplate(@Body() data: SendGridTemplateDto) {
    try {
      const result = await this.sendgridService.sendTemplateEmail(
        data.email,
        data.templateId,
        data.templateData,
        data.subject,
      );
      return {
        success: true,
        message: 'SendGrid template email sent successfully',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to send SendGrid template email', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to send SendGrid template email');
    }
  }

  @Post('sendgrid/scheduled')
  @ApiOperation({ summary: 'Send scheduled email via SendGrid' })
  @ApiResponse({ status: 200, description: 'Scheduled email sent successfully' })
  async sendSendGridScheduled(@Body() data: SendGridScheduledDto) {
    try {
      const sendAt = new Date(data.sendAt);
      const result = await this.sendgridService.sendScheduledEmail(
        data.email,
        data.subject,
        data.html,
        sendAt,
      );
      return {
        success: true,
        message: 'Scheduled email sent successfully',
        result,
        sendAt: sendAt.toISOString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to send scheduled email', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to send scheduled email');
    }
  }

  @Get('sendgrid/stats')
  @ApiOperation({ summary: 'Get SendGrid statistics' })
  @ApiResponse({ status: 200, description: 'SendGrid statistics' })
  async getSendGridStats() {
    try {
      const stats = await this.sendgridService.getStats();
      return {
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get SendGrid stats', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to get SendGrid stats');
    }
  }

  // Mailgun specific endpoints
  @Post('mailgun/simple')
  @ApiOperation({ summary: 'Send simple email via Mailgun (direct)' })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({ status: 200, description: 'Mailgun email sent successfully' })
  async sendMailgunSimple(@Body() emailData: SendEmailDto) {
    try {
      const result = await this.mailgunService.sendSimpleMessage({
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        from: emailData.from,
        cc: emailData.cc,
        bcc: emailData.bcc,
      });
      return {
        success: true,
        message: 'Mailgun email sent successfully',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to send Mailgun email', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to send Mailgun email');
    }
  }

  @Get('mailgun/stats')
  @ApiOperation({ summary: 'Get Mailgun statistics' })
  @ApiResponse({ status: 200, description: 'Mailgun statistics' })
  async getMailgunStats() {
    try {
      const stats = await this.mailgunService.getStats();
      return {
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get Mailgun stats', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to get Mailgun stats');
    }
  }
}
