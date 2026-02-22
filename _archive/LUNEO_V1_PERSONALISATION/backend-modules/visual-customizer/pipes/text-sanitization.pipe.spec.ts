/**
 * TextSanitizationPipe unit tests
 */
import { BadRequestException } from '@nestjs/common';
import { ArgumentMetadata } from '@nestjs/common';
import { TextSanitizationPipe } from './text-sanitization.pipe';
import { VISUAL_CUSTOMIZER_LIMITS } from '../visual-customizer.constants';

describe('TextSanitizationPipe', () => {
  let pipe: TextSanitizationPipe;
  const metadata: ArgumentMetadata = {
    type: 'body',
    data: '',
  };

  beforeEach(() => {
    pipe = new TextSanitizationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('transform', () => {
    it('should accept valid text', () => {
      const validText = 'This is a valid text string';

      const result = pipe.transform(validText, metadata);

      expect(result).toBe(validText);
    });

    it('should reject non-string input', () => {
      expect(() => pipe.transform(null, metadata)).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform(123, metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform({}, metadata)).toThrow(BadRequestException);
      expect(() => pipe.transform([], metadata)).toThrow(BadRequestException);
    });

    it('should strip HTML tags', () => {
      const htmlText = '<p>Hello <strong>World</strong></p>';
      const expected = 'Hello World';

      const result = pipe.transform(htmlText, metadata);

      expect(result).toBe(expected);
    });

    it('should trim whitespace', () => {
      const textWithWhitespace = '   Hello World   ';
      const expected = 'Hello World';

      const result = pipe.transform(textWithWhitespace, metadata);

      expect(result).toBe(expected);
    });

    it('should reject too long text', () => {
      const longText = 'x'.repeat(VISUAL_CUSTOMIZER_LIMITS.MAX_TEXT_LENGTH + 1);

      expect(() => pipe.transform(longText, metadata)).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform(longText, metadata)).toThrow(
        /exceeds maximum allowed length/,
      );
    });

    it('should accept text at max length', () => {
      const maxLengthText = 'x'.repeat(VISUAL_CUSTOMIZER_LIMITS.MAX_TEXT_LENGTH);

      const result = pipe.transform(maxLengthText, metadata);

      expect(result).toBe(maxLengthText);
    });

    it('should handle empty string', () => {
      const emptyText = '';

      const result = pipe.transform(emptyText, metadata);

      expect(result).toBe('');
    });

    it('should handle text with only whitespace', () => {
      const whitespaceText = '   \n\t   ';

      const result = pipe.transform(whitespaceText, metadata);

      expect(result).toBe('');
    });

    it('should remove script tags', () => {
      const scriptText = 'Hello <script>alert("xss")</script> World';
      const expected = 'Hello  World';

      const result = pipe.transform(scriptText, metadata);

      expect(result).toBe(expected);
    });

    it('should remove style tags', () => {
      const styleText = 'Hello <style>body { color: red; }</style> World';
      const expected = 'Hello  World';

      const result = pipe.transform(styleText, metadata);

      expect(result).toBe(expected);
    });

    it('should handle special characters', () => {
      const specialText = 'Hello &amp; World &lt;test&gt;';

      const result = pipe.transform(specialText, metadata);

      // HTML entities should be decoded and tags removed
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('should handle multiline text', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';

      const result = pipe.transform(multilineText, metadata);

      expect(result).toBe(multilineText.trim());
    });
  });
});
