/**
 * Mock Email Service pour les tests d'intégration
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class MockEmailService {
  private sentEmails: Array<{
    to: string;
    subject: string;
    template?: string;
    data?: Record<string, unknown>;
    timestamp: Date;
  }> = [];

  /**
   * Send email - just records it for testing
   */
  async sendEmail(to: string, subject: string, _html: string): Promise<void> {
    this.sentEmails.push({
      to,
      subject,
      timestamp: new Date(),
    });
  }

  /**
   * Send template email
   */
  async sendTemplateEmail(to: string, template: string, data: Record<string, unknown>): Promise<void> {
    this.sentEmails.push({
      to,
      subject: `Template: ${template}`,
      template,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Queue confirmation email - mock implementation
   */
  async queueConfirmationEmail(
    to: string, 
    token: string, 
    verificationUrl: string, 
    options?: { userId?: string; priority?: string }
  ): Promise<{ jobId: string }> {
    this.sentEmails.push({
      to,
      subject: 'Email Confirmation',
      template: 'confirmation',
      data: { token, verificationUrl, ...options },
      timestamp: new Date(),
    });
    return { jobId: `mock-job-${Date.now()}` };
  }

  /**
   * Queue password reset email - mock implementation
   */
  async queuePasswordResetEmail(to: string, data: { firstName: string; resetUrl: string }): Promise<void> {
    this.sentEmails.push({
      to,
      subject: 'Password Reset',
      template: 'password-reset',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Queue welcome email - mock implementation
   */
  async queueWelcomeEmail(to: string, data: { firstName: string }): Promise<void> {
    this.sentEmails.push({
      to,
      subject: 'Welcome',
      template: 'welcome',
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Get all sent emails (for testing assertions)
   */
  getSentEmails(): typeof this.sentEmails {
    return [...this.sentEmails];
  }

  /**
   * Get emails sent to a specific address
   */
  getEmailsTo(email: string): typeof this.sentEmails {
    return this.sentEmails.filter(e => e.to === email);
  }

  /**
   * Clear sent emails (for test cleanup)
   */
  clearSentEmails(): void {
    this.sentEmails = [];
  }

  /**
   * Check if email was sent
   */
  wasEmailSent(to: string, template?: string): boolean {
    return this.sentEmails.some(e => 
      e.to === to && (!template || e.template === template)
    );
  }
}
