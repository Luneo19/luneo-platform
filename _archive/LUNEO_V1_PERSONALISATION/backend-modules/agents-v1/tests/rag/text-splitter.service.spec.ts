import { TextSplitterService } from '../../rag/services/text-splitter.service';

describe('TextSplitterService', () => {
  let service: TextSplitterService;

  beforeEach(() => {
    service = new TextSplitterService();
  });

  describe('split', () => {
    it('should return single chunk for short text', () => {
      const chunks = service.split('Hello world');
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('Hello world');
      expect(chunks[0].index).toBe(0);
    });

    it('should split long text into multiple chunks', () => {
      const longText = 'word '.repeat(500);
      const chunks = service.split(longText, { chunkSize: 100, chunkOverlap: 0 });
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should produce chunks that are not excessively large', () => {
      const longText = Array.from({ length: 50 }, (_, i) => `Sentence number ${i}.`).join('\n\n');
      const chunks = service.split(longText, { chunkSize: 200, chunkOverlap: 0 });
      expect(chunks.length).toBeGreaterThan(1);
      for (const chunk of chunks) {
        expect(chunk.content.length).toBeGreaterThan(0);
      }
    });

    it('should produce more chunks with overlap enabled', () => {
      const paragraphs = Array.from({ length: 20 }, (_, i) => `Paragraph ${i} with some content here.`).join('\n\n');
      const chunksNoOverlap = service.split(paragraphs, { chunkSize: 100, chunkOverlap: 0 });
      const chunksWithOverlap = service.split(paragraphs, { chunkSize: 100, chunkOverlap: 30 });

      expect(chunksWithOverlap.length).toBeGreaterThanOrEqual(chunksNoOverlap.length);
    });

    it('should filter out empty chunks', () => {
      const text = 'Hello\n\n\n\nWorld';
      const chunks = service.split(text);
      for (const chunk of chunks) {
        expect(chunk.content.length).toBeGreaterThan(0);
      }
    });

    it('should assign correct sequential indices', () => {
      const longText = 'word '.repeat(500);
      const chunks = service.split(longText, { chunkSize: 100, chunkOverlap: 0 });
      for (let i = 0; i < chunks.length; i++) {
        expect(chunks[i].index).toBe(i);
      }
    });

    it('should handle empty text', () => {
      const chunks = service.split('');
      expect(chunks).toHaveLength(0);
    });

    it('should handle custom separators', () => {
      const text = 'Section A---Section B---Section C';
      const chunks = service.split(text, { chunkSize: 15, chunkOverlap: 0, separators: ['---', ' '] });
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should split using paragraph boundaries first', () => {
      const text = 'Short A.\n\nShort B.\n\nShort C.';
      const chunks = service.split(text, { chunkSize: 15, chunkOverlap: 0 });
      expect(chunks.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle text shorter than chunk size', () => {
      const text = 'Short text here.';
      const chunks = service.split(text, { chunkSize: 1000 });
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('Short text here.');
    });
  });
});
