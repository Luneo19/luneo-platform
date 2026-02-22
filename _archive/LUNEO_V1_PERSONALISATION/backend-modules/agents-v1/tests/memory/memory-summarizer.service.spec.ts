import { MemorySummarizerService } from '../../memory/memory-summarizer.service';

describe('MemorySummarizerService', () => {
  let service: MemorySummarizerService;
  let mockCache: { getOrSet: jest.Mock };

  beforeEach(() => {
    mockCache = {
      getOrSet: jest.fn(async (_key: string, factory: () => Promise<string>) => factory()),
    };
    service = new MemorySummarizerService(mockCache as unknown);
  });

  describe('summarize', () => {
    it('should return empty string for empty messages', async () => {
      const result = await service.summarize([]);
      expect(result).toBe('');
    });

    it('should include message count in summary', async () => {
      const messages = [
        { role: 'user', content: 'Bonjour, comment configurer mon compte?' },
        { role: 'assistant', content: 'Bonjour! Pour configurer votre compte, allez dans les paramètres.' },
      ];

      const result = await service.summarize(messages);
      expect(result).toContain('2 messages');
    });

    it('should extract key phrases from user messages', async () => {
      const messages = [
        { role: 'user', content: 'Comment créer une palette de couleurs pour ma marque?' },
        { role: 'assistant', content: 'Voici les étapes pour créer une palette harmonieuse.' },
      ];

      const result = await service.summarize(messages);
      expect(result).toContain('Questions principales');
    });

    it('should extract key points from assistant messages', async () => {
      const messages = [
        { role: 'user', content: 'Quel est le prix de votre abonnement?' },
        { role: 'assistant', content: 'Notre abonnement professionnel coûte 49 euros par mois avec toutes les fonctionnalités incluses.' },
      ];

      const result = await service.summarize(messages);
      expect(result).toContain('Points clés');
    });

    it('should use cache with correct key prefix and TTL', async () => {
      const messages = [
        { role: 'user', content: 'Test message' },
        { role: 'assistant', content: 'Test response' },
      ];

      await service.summarize(messages);
      expect(mockCache.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('memory-summary:'),
        expect.any(Function),
        3600,
      );
    });

    it('should handle conversations with only user messages', async () => {
      const messages = [
        { role: 'user', content: 'Question numéro un sur le design de la plateforme.' },
        { role: 'user', content: 'Question numéro deux sur les couleurs des composants.' },
      ];

      const result = await service.summarize(messages);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle very long conversations', async () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message numéro ${i} de la conversation de test.`,
      }));

      const result = await service.summarize(messages);
      expect(result).toContain('50 messages');
    });

    it('should not call cache for empty messages', async () => {
      await service.summarize([]);
      expect(mockCache.getOrSet).not.toHaveBeenCalled();
    });
  });
});
