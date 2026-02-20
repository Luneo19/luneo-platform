import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly secretKey: string;
  private readonly verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('captcha.secretKey') || '';
    
    if (!this.secretKey) {
      this.logger.debug('reCAPTCHA secret key not configured. CAPTCHA validation will be disabled.');
    }
  }

  /**
   * Verify reCAPTCHA v3 token
   * @param token The reCAPTCHA token from frontend
   * @param action The action name (e.g., 'register', 'contact')
   * @param minScore Minimum score threshold (default: 0.5)
   * @returns true if valid, throws BadRequestException if invalid
   */
  async verifyToken(token: string, action: string, minScore: number = 0.5): Promise<boolean> {
    if (!this.secretKey) {
      // If CAPTCHA is not configured, skip verification gracefully
      // This prevents blocking users when reCAPTCHA keys are not set
      this.logger.warn('CAPTCHA validation skipped — secret key not configured');
      return true;
    }

    if (!token) {
      throw new BadRequestException('CAPTCHA token is required');
    }

    try {
      const response = await axios.post(this.verifyUrl, null, {
        params: {
          secret: this.secretKey,
          response: token,
        },
      });

      const { success, score, action: returnedAction, challenge_ts, hostname } = response.data;

      if (!success) {
        this.logger.warn('reCAPTCHA verification failed', {
          action,
          errors: response.data['error-codes'],
        });
        throw new BadRequestException('CAPTCHA verification failed. Please try again.');
      }

      // Verify action matches
      if (returnedAction !== action) {
        this.logger.warn('reCAPTCHA action mismatch', {
          expected: action,
          received: returnedAction,
        });
        throw new BadRequestException('CAPTCHA action mismatch');
      }

      // Verify score meets threshold
      if (score < minScore) {
        this.logger.warn('reCAPTCHA score too low', {
          action,
          score,
          minScore,
        });
        throw new BadRequestException('CAPTCHA verification failed. Please try again.');
      }

      this.logger.debug('reCAPTCHA verification successful', {
        action,
        score,
        hostname,
        challenge_ts,
      });

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('reCAPTCHA verification error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        action,
      });
      throw new BadRequestException('CAPTCHA verification failed. Please try again.');
    }
  }

  /**
   * Verify reCAPTCHA v2 (checkbox) token
   * @param token The reCAPTCHA token from frontend
   * @returns true if valid
   */
  async verifyV2Token(token: string): Promise<boolean> {
    if (!this.secretKey) {
      this.logger.warn('CAPTCHA v2 validation skipped — secret key not configured');
      return true;
    }

    if (!token) {
      throw new BadRequestException('CAPTCHA token is required');
    }

    try {
      const response = await axios.post(this.verifyUrl, null, {
        params: {
          secret: this.secretKey,
          response: token,
        },
      });

      const { success } = response.data;

      if (!success) {
        this.logger.warn('reCAPTCHA v2 verification failed', {
          errors: response.data['error-codes'],
        });
        throw new BadRequestException('CAPTCHA verification failed. Please try again.');
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('reCAPTCHA v2 verification error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new BadRequestException('CAPTCHA verification failed. Please try again.');
    }
  }
}
