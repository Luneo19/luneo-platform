import { Test, TestingModule } from '@nestjs/testing';
import { EmailService, EmailOptions } from './email.service';
import { ConfigService } from '@nestjs/config';
import { MailgunService } from './mailgun.service';
import { SendGridService } from './sendgrid.service';
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

/**
 * TEST-02: Tests unitaires pour EmailService
 * Couverture des envois d'emails et gestion des providers
 */
describe('EmailService', () => {
  let service: EmailService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockMailgunService = {
    isAvailable: jest.fn(),
    sendSimpleMessage: jest.fn(),
  };

  const mockSendGridService = {
    isAvailable: jest.fn(),
    sendSimpleMessage: jest.fn(),
  };

  let mockQueue: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Reset queue mock with fresh implementations
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
      getWaitingCount: jest.fn().mockResolvedValue(5),
      getActiveCount: jest.fn().mockResolvedValue(2),
      getCompletedCount: jest.fn().mockResolvedValue(100),
      getFailedCount: jest.fn().mockResolvedValue(1),
      getDelayedCount: jest.fn().mockResolvedValue(3),
    };
    
    // Default: SendGrid available, Mailgun not
    mockSendGridService.isAvailable.mockReturnValue(true);
    mockMailgunService.isAvailable.mockReturnValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailgunService, useValue: mockMailgunService },
        { provide: SendGridService, useValue: mockSendGridService },
        { provide: getQueueToken('email'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ============================================================================
  // getProviderStatus
  // ============================================================================
  describe('getProviderStatus', () => {
    it('should return provider status', () => {
      const status = service.getProviderStatus();

      expect(status).toEqual({
        sendgrid: true,
        mailgun: false,
        default: 'sendgrid',
      });
    });
  });

  // ============================================================================
  // sendEmail
  // ============================================================================
  describe('sendEmail', () => {
    const baseOptions: EmailOptions = {
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
    };

    it('should send email with SendGrid (default provider)', async () => {
      mockSendGridService.sendSimpleMessage.mockResolvedValue({ id: 'msg-123' });

      const result = await service.sendEmail(baseOptions);

      expect(mockSendGridService.sendSimpleMessage).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: undefined,
        from: undefined,
        cc: undefined,
        bcc: undefined,
        attachments: undefined,
        templateId: undefined,
        templateData: undefined,
        categories: undefined,
        headers: undefined,
      });
      expect(result).toEqual({ id: 'msg-123' });
    });

    it('should send email with explicit SendGrid provider', async () => {
      mockSendGridService.sendSimpleMessage.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({ ...baseOptions, provider: 'sendgrid' });

      expect(mockSendGridService.sendSimpleMessage).toHaveBeenCalled();
      expect(mockMailgunService.sendSimpleMessage).not.toHaveBeenCalled();
    });

    it('should send email with Mailgun when specified', async () => {
      mockMailgunService.isAvailable.mockReturnValue(true);
      mockMailgunService.sendSimpleMessage.mockResolvedValue({ id: 'mg-123' });
      
      // Reinitialize service to pick up new provider status
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: MailgunService, useValue: mockMailgunService },
          { provide: SendGridService, useValue: mockSendGridService },
          { provide: getQueueToken('email'), useValue: mockQueue },
        ],
      }).compile();
      const serviceWithMailgun = module.get<EmailService>(EmailService);

      await serviceWithMailgun.sendEmail({ ...baseOptions, provider: 'mailgun' });

      expect(mockMailgunService.sendSimpleMessage).toHaveBeenCalled();
    });

    it('should throw ServiceUnavailableException when SendGrid unavailable', async () => {
      mockSendGridService.isAvailable.mockReturnValue(false);
      mockMailgunService.isAvailable.mockReturnValue(false);
      
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: MailgunService, useValue: mockMailgunService },
          { provide: SendGridService, useValue: mockSendGridService },
          { provide: getQueueToken('email'), useValue: mockQueue },
        ],
      }).compile();
      const serviceNoProviders = module.get<EmailService>(EmailService);

      await expect(
        serviceNoProviders.sendEmail({ ...baseOptions, provider: 'sendgrid' })
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should fallback to auto when unknown provider is used', async () => {
      // Unknown provider triggers fallback to auto provider
      mockSendGridService.sendSimpleMessage.mockResolvedValue({ id: 'fallback-123' });

      // The service will attempt fallback to auto provider
      const result = await service.sendEmail({ ...baseOptions, provider: 'unknown' as any });

      // Should have fallen back to SendGrid (default provider)
      expect(mockSendGridService.sendSimpleMessage).toHaveBeenCalled();
      expect(result).toEqual({ id: 'fallback-123' });
    });

    it('should fallback to other provider on failure', async () => {
      mockSendGridService.isAvailable.mockReturnValue(true);
      mockMailgunService.isAvailable.mockReturnValue(true);
      mockSendGridService.sendSimpleMessage.mockRejectedValue(new Error('SendGrid error'));
      mockMailgunService.sendSimpleMessage.mockResolvedValue({ id: 'mg-fallback' });
      
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: MailgunService, useValue: mockMailgunService },
          { provide: SendGridService, useValue: mockSendGridService },
          { provide: getQueueToken('email'), useValue: mockQueue },
        ],
      }).compile();
      const serviceWithBoth = module.get<EmailService>(EmailService);

      const result = await serviceWithBoth.sendEmail({ ...baseOptions, provider: 'sendgrid' });

      expect(mockMailgunService.sendSimpleMessage).toHaveBeenCalled();
      expect(result).toEqual({ id: 'mg-fallback' });
    });

    it('should use auto provider mode', async () => {
      mockSendGridService.sendSimpleMessage.mockResolvedValue({ id: 'auto-123' });

      const result = await service.sendEmail({ ...baseOptions, provider: 'auto' });

      expect(mockSendGridService.sendSimpleMessage).toHaveBeenCalled();
      expect(result).toEqual({ id: 'auto-123' });
    });
  });

  // ============================================================================
  // sendWelcomeEmail
  // ============================================================================
  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct content', async () => {
      mockSendGridService.sendSimpleMessage.mockResolvedValue({ id: 'welcome-123' });

      await service.sendWelcomeEmail('user@example.com', 'John Doe');

      expect(mockSendGridService.sendSimpleMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Bienvenue chez Luneo ! 🎉',
          categories: ['welcome', 'onboarding'],
        })
      );

      const call = mockSendGridService.sendSimpleMessage.mock.calls[0][0];
      expect(call.html).toContain('John Doe');
      expect(call.html).toContain('Bienvenue');
    });

    it('should use specified provider', async () => {
      mockMailgunService.isAvailable.mockReturnValue(true);
      mockMailgunService.sendSimpleMessage.mockResolvedValue({ id: 'mg-welcome' });
      
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: MailgunService, useValue: mockMailgunService },
          { provide: SendGridService, useValue: mockSendGridService },
          { provide: getQueueToken('email'), useValue: mockQueue },
        ],
      }).compile();
      const serviceWithMailgun = module.get<EmailService>(EmailService);

      await serviceWithMailgun.sendWelcomeEmail('user@example.com', 'John', 'mailgun');

      expect(mockMailgunService.sendSimpleMessage).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // sendPasswordResetEmail
  // ============================================================================
  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with token and URL', async () => {
      mockSendGridService.sendSimpleMessage.mockResolvedValue({ id: 'reset-123' });

      await service.sendPasswordResetEmail(
        'user@example.com',
        'reset-token-xyz',
        'https://app.luneo.com/reset'
      );

      expect(mockSendGridService.sendSimpleMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Réinitialisation de votre mot de passe',
          categories: ['password-reset', 'security'],
        })
      );

      const call = mockSendGridService.sendSimpleMessage.mock.calls[0][0];
      expect(call.html).toContain('reset-token-xyz');
      expect(call.html).toContain('https://app.luneo.com/reset');
    });
  });

  // ============================================================================
  // sendConfirmationEmail
  // ============================================================================
  describe('sendConfirmationEmail', () => {
    it('should send confirmation email with token and URL', async () => {
      mockSendGridService.sendSimpleMessage.mockResolvedValue({ id: 'confirm-123' });

      await service.sendConfirmationEmail(
        'user@example.com',
        'confirm-token-abc',
        'https://app.luneo.com/confirm'
      );

      expect(mockSendGridService.sendSimpleMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Confirmez votre adresse email',
          categories: ['email-confirmation', 'onboarding'],
        })
      );

      const call = mockSendGridService.sendSimpleMessage.mock.calls[0][0];
      expect(call.html).toContain('confirm-token-abc');
      expect(call.html).toContain('https://app.luneo.com/confirm');
    });
  });

  // ============================================================================
  // queueEmail
  // ============================================================================
  describe('queueEmail', () => {
    it('should queue email with default options', async () => {
      const result = await service.queueEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send',
        expect.objectContaining({
          type: 'generic',
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
          priority: 'normal',
        }),
        expect.objectContaining({
          priority: 5, // normal priority
        })
      );
      expect(result).toEqual({ jobId: 'job-123' });
    });

    it('should queue email with high priority', async () => {
      await service.queueEmail(
        { to: 'test@example.com', subject: 'Urgent', html: '<p>Urgent</p>' },
        { priority: 'high' }
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send',
        expect.objectContaining({ priority: 'high' }),
        expect.objectContaining({ priority: 1 })
      );
    });

    it('should queue email with delay', async () => {
      await service.queueEmail(
        { to: 'test@example.com', subject: 'Delayed', html: '<p>Later</p>' },
        { delay: 60000 }
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send',
        expect.any(Object),
        expect.objectContaining({ delay: 60000 })
      );
    });
  });

  // ============================================================================
  // queueWelcomeEmail
  // ============================================================================
  describe('queueWelcomeEmail', () => {
    it('should queue welcome email', async () => {
      const result = await service.queueWelcomeEmail('user@example.com', 'John');

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send',
        expect.objectContaining({
          type: 'welcome',
          to: 'user@example.com',
          data: { userName: 'John' },
          tags: ['welcome', 'onboarding'],
        }),
        expect.any(Object)
      );
      expect(result).toEqual({ jobId: 'job-123' });
    });
  });

  // ============================================================================
  // queuePasswordResetEmail
  // ============================================================================
  describe('queuePasswordResetEmail', () => {
    it('should queue password reset email with high priority', async () => {
      const result = await service.queuePasswordResetEmail(
        'user@example.com',
        'token-xyz',
        'https://app.luneo.com/reset'
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send',
        expect.objectContaining({
          type: 'password-reset',
          to: 'user@example.com',
          data: { resetToken: 'token-xyz', resetUrl: 'https://app.luneo.com/reset' },
          priority: 'high',
        }),
        expect.objectContaining({ priority: 1 })
      );
      expect(result).toEqual({ jobId: 'job-123' });
    });
  });

  // ============================================================================
  // queueConfirmationEmail
  // ============================================================================
  describe('queueConfirmationEmail', () => {
    it('should queue confirmation email with high priority', async () => {
      const result = await service.queueConfirmationEmail(
        'user@example.com',
        'confirm-token',
        'https://app.luneo.com/confirm'
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send',
        expect.objectContaining({
          type: 'confirmation',
          to: 'user@example.com',
          data: { confirmationToken: 'confirm-token', confirmationUrl: 'https://app.luneo.com/confirm' },
        }),
        expect.objectContaining({ priority: 1 })
      );
      expect(result).toEqual({ jobId: 'job-123' });
    });
  });

  // ============================================================================
  // queueBatchEmails
  // ============================================================================
  describe('queueBatchEmails', () => {
    it('should queue batch of emails', async () => {
      const emails = [
        { to: 'user1@example.com', subject: 'Test 1', html: '<p>1</p>' },
        { to: 'user2@example.com', subject: 'Test 2', html: '<p>2</p>' },
        { to: 'user3@example.com', subject: 'Test 3', html: '<p>3</p>' },
      ];

      const result = await service.queueBatchEmails(emails);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'batch',
        expect.objectContaining({
          emails: expect.arrayContaining([
            expect.objectContaining({ to: 'user1@example.com' }),
            expect.objectContaining({ to: 'user2@example.com' }),
            expect.objectContaining({ to: 'user3@example.com' }),
          ]),
        }),
        expect.any(Object)
      );
      expect(result).toEqual({ jobId: 'job-123' });
    });
  });

  // ============================================================================
  // getQueueStats
  // ============================================================================
  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 1,
        delayed: 3,
      });
    });
  });

  // ============================================================================
  // Edge cases
  // ============================================================================
  describe('Edge cases', () => {
    it('should handle multiple recipients', async () => {
      mockSendGridService.sendSimpleMessage.mockResolvedValue({ id: 'multi-123' });

      await service.sendEmail({
        to: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
        subject: 'Multi Test',
        html: '<p>Test</p>',
      });

      expect(mockSendGridService.sendSimpleMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
        })
      );
    });

    it('should handle CC and BCC', async () => {
      mockSendGridService.sendSimpleMessage.mockResolvedValue({ id: 'cc-bcc-123' });

      await service.sendEmail({
        to: 'main@example.com',
        subject: 'CC BCC Test',
        html: '<p>Test</p>',
        cc: 'cc@example.com',
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      });

      expect(mockSendGridService.sendSimpleMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: 'cc@example.com',
          bcc: ['bcc1@example.com', 'bcc2@example.com'],
        })
      );
    });

    it('should handle text-only emails', async () => {
      mockSendGridService.sendSimpleMessage.mockResolvedValue({ id: 'text-123' });

      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Text Only',
        text: 'Plain text content',
      });

      expect(mockSendGridService.sendSimpleMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Plain text content',
          html: undefined,
        })
      );
    });
  });
});
