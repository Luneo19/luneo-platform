import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import {
  VISUAL_CUSTOMIZER_LIMITS,
  MODERATION_SETTINGS,
} from '../visual-customizer.constants';

@Injectable()
export class TextSanitizationPipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('Text must be a string');
    }

    // Strip all HTML tags using sanitize-html
    const sanitized = sanitizeHtml(value, {
      allowedTags: [], // No tags allowed
      allowedAttributes: {},
    });

    // Trim whitespace
    const trimmed = sanitized.trim();

    // Check length
    if (trimmed.length > VISUAL_CUSTOMIZER_LIMITS.MAX_TEXT_LENGTH) {
      throw new BadRequestException(
        `Text length exceeds maximum allowed length of ${VISUAL_CUSTOMIZER_LIMITS.MAX_TEXT_LENGTH} characters`,
      );
    }

    // Check for profanity if enabled
    if (MODERATION_SETTINGS.PROFANITY_CHECK) {
      this.checkProfanity(trimmed);
    }

    return trimmed;
  }

  private checkProfanity(text: string): void {
    // Basic blocked words check
    // In production, use a more sophisticated profanity detection library
    const blockedWords: string[] = [
      // Add common blocked words here
      // This is a basic implementation - consider using a library like bad-words
    ];

    const lowerText = text.toLowerCase();
    for (const word of blockedWords) {
      if (lowerText.includes(word.toLowerCase())) {
        throw new BadRequestException('Text contains inappropriate content');
      }
    }

    // Additional checks can be added here
    // For example, using a profanity detection API or library
  }
}
