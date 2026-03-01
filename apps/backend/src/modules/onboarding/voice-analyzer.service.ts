import { Injectable } from '@nestjs/common';

export interface VoiceAnalysisInput {
  pages: Array<{ url: string; text: string }>;
}

export interface VoiceAnalysisResult {
  detectedLanguage: string;
  tone: 'formal' | 'friendly' | 'luxury' | 'technical' | 'warm';
  recurringVocabulary: string[];
  styleHints: string[];
}

@Injectable()
export class VoiceAnalyzerService {
  analyze(input: VoiceAnalysisInput): VoiceAnalysisResult {
    const corpus = input.pages.map((p) => p.text).join(' ').toLowerCase();

    const tone = this.detectTone(corpus);
    const recurringVocabulary = this.extractRecurringVocabulary(corpus);

    return {
      detectedLanguage: this.detectLanguage(corpus),
      tone,
      recurringVocabulary,
      styleHints: this.buildStyleHints(tone, recurringVocabulary),
    };
  }

  private detectLanguage(text: string): string {
    const frenchTokens = ['bonjour', 'livraison', 'commande', 'contact', 'prix'];
    const englishTokens = ['hello', 'shipping', 'order', 'contact', 'price'];
    const frScore = frenchTokens.filter((token) => text.includes(token)).length;
    const enScore = englishTokens.filter((token) => text.includes(token)).length;
    return frScore >= enScore ? 'fr' : 'en';
  }

  private detectTone(text: string): VoiceAnalysisResult['tone'] {
    if (/(premium|exclusive|luxe|haut de gamme)/.test(text)) return 'luxury';
    if (/(api|sdk|integration|technical|architecture)/.test(text)) return 'technical';
    if (/(merci|bienvenue|ravis|accompagner)/.test(text)) return 'warm';
    if (/(veuillez|conformement|conditions|politique)/.test(text)) return 'formal';
    return 'friendly';
  }

  private extractRecurringVocabulary(text: string): string[] {
    const tokens = text
      .split(/[^a-zA-Z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 5);

    const counts = new Map<string, number>();
    for (const token of tokens) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([token]) => token);
  }

  private buildStyleHints(tone: VoiceAnalysisResult['tone'], vocabulary: string[]): string[] {
    const baseHints: string[] = [];
    if (tone === 'formal') baseHints.push('Utiliser un ton professionnel et structure.');
    if (tone === 'friendly') baseHints.push('Favoriser des reponses courtes et chaleureuses.');
    if (tone === 'luxury') baseHints.push('Mettre en avant qualite, exclusivite et service premium.');
    if (tone === 'technical') baseHints.push('Utiliser un vocabulaire precis et des etapes explicites.');
    if (tone === 'warm') baseHints.push('Montrer de l empathie et reformuler le besoin client.');

    if (vocabulary.length > 0) {
      baseHints.push(`Reutiliser le vocabulaire metier detecte: ${vocabulary.slice(0, 8).join(', ')}`);
    }
    return baseHints;
  }
}
