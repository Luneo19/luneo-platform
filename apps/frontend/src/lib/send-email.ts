/**
 * ENVOI D'EMAILS
 * Utilise Resend (ou fallback sur logger si pas configuré)
 */

import { logger } from '@/lib/logger';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Envoyer un email
 * Note: Requiert RESEND_API_KEY dans les variables d'environnement
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, subject, html, from = 'Luneo <no-reply@luneo.app>' } = params;

  // Si Resend n'est pas configuré, logger (dev)
  if (!process.env.RESEND_API_KEY) {
    logger.info('Email (dev mode)', {
      from,
      to,
      subject,
      htmlPreview: html.substring(0, 100) + '...',
    });
    return true;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await response.json();
    logger.info('Email sent', {
      emailId: data.id,
      to,
      subject,
    });
    return true;
  } catch (error: any) {
    logger.error('Failed to send email', {
      error,
      to,
      subject,
      message: error.message,
    });
    return false;
  }
}

/**
 * Envoyer plusieurs emails (batch)
 */
export async function sendBatchEmails(emails: SendEmailParams[]): Promise<boolean[]> {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  );

  return results.map((result) => result.status === 'fulfilled' && result.value);
}

