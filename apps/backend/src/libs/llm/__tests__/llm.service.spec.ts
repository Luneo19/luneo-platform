import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from '../llm.service';
import { LlmProvider, MODEL_CATALOG } from '../llm.interface';
import { OpenAiProvider } from '../providers/openai.provider';
import { AnthropicProvider } from '../providers/anthropic.provider';
import { GoogleProvider } from '../providers/google.provider';
import { GroqProvider } from '../providers/groq.provider';
import { MistralProvider } from '../providers/mistral.provider';

describe('LlmService', () => {
  let service: LlmService;

  const mockOpenAiProvider = {
    provider: LlmProvider.OPENAI,
    isAvailable: jest.fn(),
    complete: jest.fn(),
    stream: jest.fn(),
    generateEmbedding: jest.fn(),
  };

  const mockAnthropicProvider = {
    provider: LlmProvider.ANTHROPIC,
    isAvailable: jest.fn(),
    complete: jest.fn(),
    stream: jest.fn(),
  };

  const mockGoogleProvider = {
    provider: LlmProvider.GOOGLE,
    isAvailable: jest.fn(),
    complete: jest.fn(),
    stream: jest.fn(),
  };

  const mockGroqProvider = {
    provider: LlmProvider.GROQ,
    isAvailable: jest.fn(),
    complete: jest.fn(),
    stream: jest.fn(),
  };

  const mockMistralProvider = {
    provider: LlmProvider.MISTRAL,
    isAvailable: jest.fn(),
    complete: jest.fn(),
    stream: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockOpenAiProvider.isAvailable.mockReturnValue(true);
    mockAnthropicProvider.isAvailable.mockReturnValue(true);
    mockGoogleProvider.isAvailable.mockReturnValue(true);
    mockGroqProvider.isAvailable.mockReturnValue(true);
    mockMistralProvider.isAvailable.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: OpenAiProvider, useValue: mockOpenAiProvider },
        { provide: AnthropicProvider, useValue: mockAnthropicProvider },
        { provide: GoogleProvider, useValue: mockGoogleProvider },
        { provide: GroqProvider, useValue: mockGroqProvider },
        { provide: MistralProvider, useValue: mockMistralProvider },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('onModuleInit should register all providers', () => {
    service.onModuleInit();

    const providerMap = (service as any).providerMap as Map<LlmProvider, unknown>;
    expect(providerMap.size).toBe(5);
    expect(providerMap.get(LlmProvider.OPENAI)).toBe(mockOpenAiProvider);
    expect(providerMap.get(LlmProvider.ANTHROPIC)).toBe(mockAnthropicProvider);
    expect(providerMap.get(LlmProvider.GOOGLE)).toBe(mockGoogleProvider);
    expect(providerMap.get(LlmProvider.GROQ)).toBe(mockGroqProvider);
    expect(providerMap.get(LlmProvider.MISTRAL)).toBe(mockMistralProvider);
  });

  describe('resolveProvider', () => {
    const baseOptions = {
      messages: [],
    };

    it('should resolve gpt-4o to OPENAI', () => {
      const result = service.resolveProvider({ ...baseOptions, model: 'gpt-4o' });
      expect(result).toBe(LlmProvider.OPENAI);
    });

    it('should resolve claude-3 to ANTHROPIC', () => {
      const result = service.resolveProvider({ ...baseOptions, model: 'claude-3-5-sonnet-20241022' });
      expect(result).toBe(LlmProvider.ANTHROPIC);
    });

    it('should resolve gemini-2.0 to GOOGLE', () => {
      const result = service.resolveProvider({ ...baseOptions, model: 'gemini-2.0-flash' });
      expect(result).toBe(LlmProvider.GOOGLE);
    });

    it('should resolve mixtral to GROQ', () => {
      const result = service.resolveProvider({ ...baseOptions, model: 'mixtral-8x7b-32768' });
      expect(result).toBe(LlmProvider.GROQ);
    });

    it('should resolve mistral-large to MISTRAL', () => {
      const result = service.resolveProvider({ ...baseOptions, model: 'mistral-large-latest' });
      expect(result).toBe(LlmProvider.MISTRAL);
    });

    it('should throw for unknown model', () => {
      expect(() =>
        service.resolveProvider({ ...baseOptions, model: 'unknown-model-v1' }),
      ).toThrow(/Cannot determine provider/);
    });
  });

  it('getAvailableModels should return only models from available providers', () => {
    mockOpenAiProvider.isAvailable.mockReturnValue(true);
    mockAnthropicProvider.isAvailable.mockReturnValue(false);
    mockGoogleProvider.isAvailable.mockReturnValue(true);
    mockGroqProvider.isAvailable.mockReturnValue(false);
    mockMistralProvider.isAvailable.mockReturnValue(false);

    service.onModuleInit();
    const models = service.getAvailableModels();
    const expectedProviders = [LlmProvider.OPENAI, LlmProvider.GOOGLE];

    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => expectedProviders.includes(m.provider))).toBe(true);

    const expectedIds = MODEL_CATALOG
      .filter((m) => expectedProviders.includes(m.provider))
      .map((m) => m.id)
      .sort();
    expect(models.map((m) => m.id).sort()).toEqual(expectedIds);
  });
});
