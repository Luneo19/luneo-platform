import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { VISUAL_CUSTOMIZER_LIMITS, SUPPORTED_SYSTEM_FONTS } from '../visual-customizer.constants';

interface TextSettings {
  maxLength?: number;
  blockedWords?: string[];
  allowedFonts?: string[];
  minFontSize?: number;
  maxFontSize?: number;
}

@Injectable()
export class CustomizerTextsService {
  private readonly logger = new Logger(CustomizerTextsService.name);

  /**
   * Validate text content
   */
  validateText(text: string, settings?: TextSettings): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxLength = settings?.maxLength || VISUAL_CUSTOMIZER_LIMITS.MAX_TEXT_LENGTH;

    // Check length
    if (text.length > maxLength) {
      errors.push(
        `Text exceeds maximum length of ${maxLength} characters`,
      );
    }

    // Check blocked words
    if (settings?.blockedWords && settings.blockedWords.length > 0) {
      const lowerText = text.toLowerCase();
      const foundBlockedWords = settings.blockedWords.filter((word) =>
        lowerText.includes(word.toLowerCase()),
      );

      if (foundBlockedWords.length > 0) {
        errors.push(
          `Text contains blocked words: ${foundBlockedWords.join(', ')}`,
        );
      }
    }

    // Sanitize HTML tags (basic check)
    const htmlTagRegex = /<[^>]*>/g;
    if (htmlTagRegex.test(text)) {
      errors.push('Text contains HTML tags which are not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize text (remove HTML, trim, etc.)
   */
  sanitizeText(text: string): string {
    // Remove HTML tags
    let sanitized = text.replace(/<[^>]*>/g, '');

    // Decode HTML entities
    sanitized = sanitized
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  }

  /**
   * Validate font family
   */
  validateFont(
    fontFamily: string,
    allowedFonts?: string[],
  ): {
    isValid: boolean;
    error?: string;
  } {
    // If no allowed fonts specified, allow all system fonts
    const allowed = allowedFonts || SUPPORTED_SYSTEM_FONTS;

    // Check if font is in allowed list
    const isAllowed = allowed.some(
      (font) => font.toLowerCase() === fontFamily.toLowerCase(),
    );

    if (!isAllowed) {
      return {
        isValid: false,
        error: `Font "${fontFamily}" is not allowed. Allowed fonts: ${allowed.join(', ')}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate font size
   */
  validateFontSize(
    fontSize: number,
    settings?: TextSettings,
  ): {
    isValid: boolean;
    error?: string;
  } {
    const minSize =
      settings?.minFontSize || VISUAL_CUSTOMIZER_LIMITS.MIN_FONT_SIZE;
    const maxSize =
      settings?.maxFontSize || VISUAL_CUSTOMIZER_LIMITS.MAX_FONT_SIZE;

    if (fontSize < minSize) {
      return {
        isValid: false,
        error: `Font size ${fontSize} is below minimum of ${minSize}`,
      };
    }

    if (fontSize > maxSize) {
      return {
        isValid: false,
        error: `Font size ${fontSize} exceeds maximum of ${maxSize}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Check for blocked words
   */
  checkBlockedWords(
    text: string,
    blockedWords: string[],
  ): {
    isBlocked: boolean;
    foundWords: string[];
  } {
    if (!blockedWords || blockedWords.length === 0) {
      return { isBlocked: false, foundWords: [] };
    }

    const lowerText = text.toLowerCase();
    const foundWords = blockedWords.filter((word) =>
      lowerText.includes(word.toLowerCase()),
    );

    return {
      isBlocked: foundWords.length > 0,
      foundWords,
    };
  }
}
