import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const emailDomainSchema = z.object({
  // SendGrid Domain Authentication
  SENDGRID_DOMAIN: z.string().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_REPLY_TO: z.string().email().optional(),
  
  // SMTP Configuration
  SMTP_HOST: z.string().default('smtp.sendgrid.net'),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_SECURE: z.string().transform(val => val === 'true').default('false'),
  SMTP_FROM: z.string().optional(),
  
  // Domain Verification
  DOMAIN_VERIFIED: z.string().transform(val => val === 'true').default('false'),
  SPF_RECORD: z.string().optional(),
  DKIM_RECORD: z.string().optional(),
  DMARC_RECORD: z.string().optional(),
  
  // Email Templates
  EMAIL_TEMPLATES: z.object({
    welcome: z.string().optional(),
    passwordReset: z.string().optional(),
    emailConfirmation: z.string().optional(),
    invoice: z.string().optional(),
    newsletter: z.string().optional(),
  }).optional(),
});

export type EmailDomainConfig = z.infer<typeof emailDomainSchema>;

export const emailDomainConfig = registerAs('emailDomain', () => {
  const config = {
    // SendGrid Domain Configuration
    sendgridDomain: process.env.SENDGRID_DOMAIN || 'luneo.app',
    sendgridFromName: process.env.SENDGRID_FROM_NAME || 'Luneo',
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@luneo.app',
    sendgridReplyTo: process.env.SENDGRID_REPLY_TO || 'support@luneo.app',
    
    // SMTP Configuration
    smtpHost: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpFrom: process.env.SMTP_FROM || `Luneo <no-reply@luneo.app>`,
    
    // Domain Verification Status
    domainVerified: process.env.DOMAIN_VERIFIED === 'true',
    spfRecord: process.env.SPF_RECORD,
    dkimRecord: process.env.DKIM_RECORD,
    dmarcRecord: process.env.DMARC_RECORD,
    
    // Email Templates
    emailTemplates: {
      welcome: process.env.EMAIL_TEMPLATE_WELCOME || 'd-welcome-template-id',
      passwordReset: process.env.EMAIL_TEMPLATE_PASSWORD_RESET || 'd-password-reset-template-id',
      emailConfirmation: process.env.EMAIL_TEMPLATE_EMAIL_CONFIRMATION || 'd-email-confirmation-template-id',
      invoice: process.env.EMAIL_TEMPLATE_INVOICE || 'd-invoice-template-id',
      newsletter: process.env.EMAIL_TEMPLATE_NEWSLETTER || 'd-newsletter-template-id',
    },
  };

  return config;
});

// Validation function
export const validateEmailDomainConfig = (): EmailDomainConfig => {
  try {
    return emailDomainSchema.parse({
      SENDGRID_DOMAIN: process.env.SENDGRID_DOMAIN,
      SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME,
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
      SENDGRID_REPLY_TO: process.env.SENDGRID_REPLY_TO,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_FROM: process.env.SMTP_FROM,
      DOMAIN_VERIFIED: process.env.DOMAIN_VERIFIED,
      SPF_RECORD: process.env.SPF_RECORD,
      DKIM_RECORD: process.env.DKIM_RECORD,
      DMARC_RECORD: process.env.DMARC_RECORD,
      EMAIL_TEMPLATES: {
        welcome: process.env.EMAIL_TEMPLATE_WELCOME,
        passwordReset: process.env.EMAIL_TEMPLATE_PASSWORD_RESET,
        emailConfirmation: process.env.EMAIL_TEMPLATE_EMAIL_CONFIRMATION,
        invoice: process.env.EMAIL_TEMPLATE_INVOICE,
        newsletter: process.env.EMAIL_TEMPLATE_NEWSLETTER,
      },
    });
  } catch (error) {
    throw new Error(`Email domain configuration validation failed: ${error.message}`);
  }
};
