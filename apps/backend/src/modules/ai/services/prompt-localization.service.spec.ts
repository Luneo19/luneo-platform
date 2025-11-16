import translate from '@vitalets/google-translate-api';
import { franc as francMock } from 'franc';
import { PromptLocalizationService } from './prompt-localization.service';

jest.mock('@vitalets/google-translate-api', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('franc', () => ({
  franc: jest.fn(() => 'eng'),
}));

const translateMock = translate as unknown as jest.Mock;

describe('PromptLocalizationService', () => {
  let service: PromptLocalizationService;

  beforeEach(() => {
    jest.clearAllMocks();
    (francMock as unknown as jest.Mock).mockReturnValue('eng');
    service = new PromptLocalizationService();
  });

  it('retourne le prompt tel quel lorsqu’il est déjà en anglais', async () => {
    (francMock as unknown as jest.Mock).mockReturnValue('eng');

    const result = await service.normalizePrompt('Generate a photorealistic product mockup');

    expect(result.prompt).toBe('Generate a photorealistic product mockup');
    expect(result.originalLocale).toBe('en');
    expect(result.translated).toBe(false);
    expect(translateMock).not.toHaveBeenCalled();
  });

  it('traduit un prompt français vers l’anglais', async () => {
    translateMock.mockResolvedValue({
      text: 'Create an elegant product mockup',
      from: { language: { iso: 'fr' } },
    });
    (francMock as unknown as jest.Mock).mockReturnValue('fra');

    const result = await service.normalizePrompt('Créer une maquette produit élégante');

    expect(translateMock).toHaveBeenCalledWith('Créer une maquette produit élégante', {
      from: 'fr',
      to: 'en',
    });
    expect(result.prompt).toBe('Create an elegant product mockup');
    expect(result.originalLocale).toBe('fr');
    expect(result.translated).toBe(true);
  });

  it('utilise le cache pour éviter les traductions répétées', async () => {
    translateMock.mockResolvedValue({
      text: 'Create an elegant product mockup',
      from: { language: { iso: 'fr' } },
    });
    (francMock as unknown as jest.Mock).mockReturnValue('fra');

    await service.normalizePrompt('Créer une maquette produit élégante');
    await service.normalizePrompt('Créer une maquette produit élégante');

    expect(translateMock).toHaveBeenCalledTimes(1);
  });

  it('retourne le prompt original si la traduction échoue', async () => {
    translateMock.mockRejectedValue(new Error('Network error'));
    (francMock as unknown as jest.Mock).mockReturnValue('fra');

    const result = await service.normalizePrompt('Créer une maquette produit élégante');

    expect(result.prompt).toBe('Créer une maquette produit élégante');
    expect(result.translated).toBe(false);
  });
});

