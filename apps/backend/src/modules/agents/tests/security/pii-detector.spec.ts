import { PIIDetectorService } from '../../security/pii-detector.service';

describe('PIIDetectorService', () => {
  let service: PIIDetectorService;

  beforeEach(() => {
    service = new PIIDetectorService();
  });

  describe('detect', () => {
    it('should detect email addresses', () => {
      const result = service.detect('Mon email est john@example.com');
      expect(result.hasPII).toBe(true);
      expect(result.detections.some(d => d.type === 'email')).toBe(true);
    });

    it('should detect French phone numbers', () => {
      const result = service.detect('Appelez-moi au 06 12 34 56 78');
      expect(result.hasPII).toBe(true);
      expect(result.detections.some(d => d.type === 'phone_fr')).toBe(true);
    });

    it('should detect Swiss phone numbers', () => {
      const result = service.detect('Mon numéro suisse est +41 79 123 45 67');
      expect(result.hasPII).toBe(true);
      expect(result.detections.some(d => d.type === 'phone_ch')).toBe(true);
    });

    it('should detect credit card numbers with Luhn validation', () => {
      const result = service.detect('Ma carte: 4532 0151 2345 6789');
      // Valid Luhn number
      expect(result.hasPII).toBe(true);
    });

    it('should detect IBAN numbers', () => {
      const result = service.detect('IBAN: CH93 0076 2011 6238 5295 7');
      expect(result.hasPII).toBe(true);
      expect(result.detections.some(d => d.type === 'iban')).toBe(true);
    });

    it('should detect Swiss AHV numbers', () => {
      const result = service.detect('Mon AHV: 756.1234.5678.90');
      expect(result.hasPII).toBe(true);
      expect(result.detections.some(d => d.type === 'ahv_ch')).toBe(true);
    });

    it('should detect US SSN', () => {
      const result = service.detect('SSN: 123-45-6789');
      expect(result.hasPII).toBe(true);
      expect(result.detections.some(d => d.type === 'ssn_us')).toBe(true);
    });

    it('should not flag clean text', () => {
      const result = service.detect('Bonjour, comment puis-je vous aider ?');
      expect(result.hasPII).toBe(false);
      expect(result.detections).toHaveLength(0);
    });

    it('should redact PII correctly', () => {
      const result = service.detect('Email: john@example.com et tel: 06 12 34 56 78');
      expect(result.redactedText).toContain('[EMAIL_REDACTED]');
      expect(result.redactedText).toContain('[PHONE_FR_REDACTED]');
      expect(result.redactedText).not.toContain('john@example.com');
    });
  });

  describe('redact', () => {
    it('should redact all PII in a text', () => {
      const text = 'Contact: test@mail.com, 06 11 22 33 44';
      const redacted = service.redact(text);
      expect(redacted).not.toContain('test@mail.com');
      expect(redacted).toContain('[EMAIL_REDACTED]');
    });
  });
});
