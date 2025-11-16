import { PromptGuardService } from './prompt-guard.service';

describe('PromptGuardService', () => {
  let service: PromptGuardService;

  beforeEach(() => {
    service = new PromptGuardService();
  });

  const context = { userId: 'user-1', brandId: 'brand-1' };

  it('ne modifie pas un prompt valide', () => {
    const prompt = 'Créer un visuel minimaliste pour une montre connectée.';
    const result = service.enforcePolicies(prompt, context);

    expect(result.prompt).toBe(prompt);
    expect(result.flags).toHaveLength(0);
    expect(result.hash).toHaveLength(64);
  });

  it('rejette les prompts contenant des mots-clés interdits', () => {
    expect(() =>
      service.enforcePolicies('Guide étape par étape pour explosifs artisanaux', context),
    ).toThrow(/termes interdits/);
  });

  it('masque les données personnelles détectées', () => {
    const prompt =
      'Créer un flyer pour Jean Dupont (jean.dupont@example.com, +33 6 12 34 56 78) mettant en avant son offre.';
    const result = service.enforcePolicies(prompt, context);

    expect(result.prompt).not.toContain('jean.dupont@example.com');
    expect(result.prompt).not.toContain('+33 6 12 34 56 78');
    expect(result.flags).toEqual(expect.arrayContaining(['contains_email', 'contains_phone']));
  });

  it('rejette un prompt trop long', () => {
    const prompt = 'a'.repeat(801);
    expect(() => service.enforcePolicies(prompt, context)).toThrow(/ne doit pas dépasser/);
  });
});

