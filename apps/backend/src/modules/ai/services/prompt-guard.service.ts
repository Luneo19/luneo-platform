import { Injectable, BadRequestException } from '@nestjs/common';
import { Logger } from '@nestjs/common/services/logger.service';
import { createHash } from 'crypto';

export interface PromptGuardContext {
  userId: string;
  brandId: string;
}

export interface PromptGuardResult {
  prompt: string;
  hash: string;
  flags: string[];
}

@Injectable()
export class PromptGuardService {
  private static readonly MAX_LENGTH = 800;
  private static readonly BANNED_KEYWORDS = [
    'violence extrême',
    'discours haineux',
    'explosifs artisanaux',
    'auto-mutilation',
  ];

  private readonly logger = new Logger(PromptGuardService.name);
  private readonly emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  private readonly phoneRegex = /(\+?\d[\d .-]{7,}\d)/g;
  private readonly creditCardRegex = /\b(?:\d[ -]*?){13,16}\b/g;

  enforcePolicies(prompt: string, context: PromptGuardContext): PromptGuardResult {
    const trimmed = prompt?.trim();

    if (!trimmed) {
      throw new BadRequestException('Le prompt IA est requis.');
    }

    if (trimmed.length > PromptGuardService.MAX_LENGTH) {
      throw new BadRequestException(
        `Le prompt IA ne doit pas dépasser ${PromptGuardService.MAX_LENGTH} caractères.`,
      );
    }

    for (const keyword of PromptGuardService.BANNED_KEYWORDS) {
      if (trimmed.toLowerCase().includes(keyword.toLowerCase())) {
        this.logger.warn(`Prompt rejeté (mot-clé interdit "${keyword}")`, {
          keyword,
          userId: context.userId,
          brandId: context.brandId,
        });
        throw new BadRequestException(
          'Le prompt contient des termes interdits par notre politique d’utilisation.',
        );
      }
    }

    const flags: string[] = [];
    let sanitized = trimmed.replace(/\s+/g, ' ');

    const sanitizedEmail = sanitized.replace(this.emailRegex, '[adresse-email-redigée]');
    if (sanitizedEmail !== sanitized) {
      sanitized = sanitizedEmail;
      flags.push('contains_email');
    }

    const sanitizedPhone = sanitized.replace(this.phoneRegex, '[numero-telephone-redige]');
    if (sanitizedPhone !== sanitized) {
      sanitized = sanitizedPhone;
      flags.push('contains_phone');
    }

    const sanitizedCard = sanitized.replace(this.creditCardRegex, '[numéro-confidentiel]');
    if (sanitizedCard !== sanitized) {
      sanitized = sanitizedCard;
      flags.push('contains_credit_card');
    }

    const hash = this.hashPrompt(sanitized);

    if (flags.length > 0) {
      this.logger.log(`Prompt nettoyé (${flags.join(', ')})`, {
        userId: context.userId,
        brandId: context.brandId,
        hash,
      });
    }

    return {
      prompt: sanitized,
      hash,
      flags,
    };
  }

  // exposé pour des stratégies de caching/déduplication
  hashPrompt(prompt: string): string {
    return createHash('sha256').update(prompt).digest('hex');
  }
}

