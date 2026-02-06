import { Controller, Post, Body, Get, Query, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { MailgunService } from './mailgun.service';
import { SendGridService } from './sendgrid.service';
import { JsonValue } from '@/common/types/utility-types';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

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
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly mailgunService: MailgunService,
    private readonly sendgridService: SendGridService,
  ) {}

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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test/welcome')
  @ApiOperation({ summary: 'Send welcome test email' })
  @ApiBody({ type: TestEmailDto })
  @ApiResponse({ status: 200, description: 'Welcome email sent successfully' })
  async sendWelcomeTest(@Body() testData: TestEmailDto) {
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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send welcome email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test/password-reset')
  @ApiOperation({ summary: 'Send password reset test email' })
  @ApiBody({ type: TestEmailDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent successfully' })
  async sendPasswordResetTest(@Body() testData: TestEmailDto) {
    try {
      const resetToken = 'test-reset-token-' + Date.now();
      const resetUrl = 'https://app.luneo.com/reset-password';
      
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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send password reset email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test/confirmation')
  @ApiOperation({ summary: 'Send email confirmation test email' })
  @ApiBody({ type: TestEmailDto })
  @ApiResponse({ status: 200, description: 'Confirmation email sent successfully' })
  async sendConfirmationTest(@Body() testData: TestEmailDto) {
    try {
      const confirmationToken = 'test-confirmation-token-' + Date.now();
      const confirmationUrl = 'https://app.luneo.com/confirm-email';
      
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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send confirmation email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send SendGrid email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sendgrid/template')
  @ApiOperation({ summary: 'Send email with SendGrid template' })
  @ApiResponse({ status: 200, description: 'SendGrid template email sent successfully' })
  async sendSendGridTemplate(@Body() data: {
    email: string;
    templateId: string;
    templateData: Record<string, JsonValue>;
    subject?: string;
  }) {
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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send SendGrid template email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sendgrid/scheduled')
  @ApiOperation({ summary: 'Send scheduled email via SendGrid' })
  @ApiResponse({ status: 200, description: 'Scheduled email sent successfully' })
  async sendSendGridScheduled(@Body() data: {
    email: string;
    subject: string;
    html: string;
    sendAt: string; // ISO date string
  }) {
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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send scheduled email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get SendGrid stats',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send Mailgun email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get Mailgun stats',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
