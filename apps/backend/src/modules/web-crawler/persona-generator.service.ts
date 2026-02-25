import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '@/libs/llm/llm.service';
import { CrawlResult } from './web-crawler.service';

export interface GeneratedPersona {
  agentName: string;
  systemPrompt: string;
  greeting: string;
  tone: string;
  responseStyle: string;
  suggestedFAQ: { question: string; answer: string }[];
  suggestedTopics: string[];
  brandVoice: {
    vocabulary: string[];
    avoidWords: string[];
    communicationStyle: string;
  };
  industry: string;
  language: string;
}

@Injectable()
export class PersonaGeneratorService {
  private readonly logger = new Logger(PersonaGeneratorService.name);

  constructor(private readonly llmService: LlmService) {}

  async generateFromCrawl(crawlResult: CrawlResult): Promise<GeneratedPersona> {
    this.logger.log(`Generating persona from crawled site: ${crawlResult.url}`);

    const prompt = this.buildPrompt(crawlResult);

    const result = await this.llmService.complete({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en création d'agents IA conversationnels pour les entreprises.
Tu analyses le contenu d'un site web et génères une configuration complète d'agent IA.
Tu DOIS répondre UNIQUEMENT en JSON valide, sans aucun texte avant ou après.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      maxTokens: 3000,
    });

    try {
      const cleaned = result.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleaned) as GeneratedPersona;
    } catch (error) {
      this.logger.error(`Failed to parse persona JSON: ${error}`);
      return this.buildFallbackPersona(crawlResult);
    }
  }

  private buildPrompt(crawl: CrawlResult): string {
    const sections: string[] = [];

    sections.push(`URL: ${crawl.url}`);
    sections.push(`Titre: ${crawl.title}`);

    if (crawl.metaDescription) {
      sections.push(`Description: ${crawl.metaDescription}`);
    }

    if (crawl.headings.length > 0) {
      sections.push(`Titres principaux:\n${crawl.headings.slice(0, 15).join('\n')}`);
    }

    if (crawl.mainContent) {
      sections.push(`Contenu principal (extrait):\n${crawl.mainContent.slice(0, 3000)}`);
    }

    if (crawl.faqItems.length > 0) {
      sections.push(`FAQ existantes:\n${crawl.faqItems.map((f) => `Q: ${f.question}\nR: ${f.answer}`).join('\n\n')}`);
    }

    if (crawl.products.length > 0) {
      sections.push(`Produits/Services mentionnés:\n${crawl.products.join(', ')}`);
    }

    if (crawl.contactInfo.email || crawl.contactInfo.phone) {
      sections.push(`Contact: ${crawl.contactInfo.email ?? ''} ${crawl.contactInfo.phone ?? ''}`);
    }

    return `Analyse ce site web et génère une configuration d'agent IA en JSON.

${sections.join('\n\n---\n\n')}

---

Génère un JSON avec cette structure exacte:
{
  "agentName": "nom suggéré pour l'agent (ex: Assistant MonEntreprise)",
  "systemPrompt": "prompt système complet et détaillé pour l'agent (300+ mots), incluant son rôle, ses connaissances, son comportement",
  "greeting": "message d'accueil personnalisé pour les visiteurs",
  "tone": "PROFESSIONAL ou FRIENDLY ou FORMAL ou CASUAL ou EMPATHETIC ou ENTHUSIASTIC",
  "responseStyle": "description du style de réponse",
  "suggestedFAQ": [
    {"question": "...", "answer": "..."}
  ],
  "suggestedTopics": ["sujet1", "sujet2", ...],
  "brandVoice": {
    "vocabulary": ["mots clés de la marque"],
    "avoidWords": ["mots à éviter"],
    "communicationStyle": "description du style de communication"
  },
  "industry": "secteur d'activité détecté",
  "language": "${crawl.language}"
}

Génère au moins 5 FAQ pertinentes basées sur le contenu du site.
Le systemPrompt doit être très détaillé et spécifique à l'entreprise.
Adapte le ton et le vocabulaire à l'identité de la marque.`;
  }

  private buildFallbackPersona(crawl: CrawlResult): GeneratedPersona {
    return {
      agentName: `Assistant ${crawl.title || 'IA'}`,
      systemPrompt: `Tu es un assistant IA pour ${crawl.title || 'cette entreprise'}. ${crawl.metaDescription || ''} Tu aides les visiteurs du site ${crawl.url} en répondant à leurs questions de manière professionnelle et utile.`,
      greeting: `Bonjour ! Bienvenue sur ${crawl.title || 'notre site'}. Comment puis-je vous aider ?`,
      tone: 'PROFESSIONAL',
      responseStyle: 'Réponses claires, concises et professionnelles.',
      suggestedFAQ: crawl.faqItems.slice(0, 5),
      suggestedTopics: crawl.headings.slice(0, 5),
      brandVoice: {
        vocabulary: [],
        avoidWords: [],
        communicationStyle: 'Professionnel et accessible',
      },
      industry: crawl.industry ?? 'Général',
      language: crawl.language,
    };
  }
}
