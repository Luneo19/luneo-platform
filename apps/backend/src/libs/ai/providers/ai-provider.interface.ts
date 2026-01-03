/**
 * Interface pour les providers IA
 * Permet d'abstraire les différents providers (OpenAI, SDXL, etc.)
 */

export interface AIGenerationOptions {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
  model?: string;
}

export interface AIGenerationResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
    format: string;
    size: number;
  }>;
  metadata: {
    provider: string;
    model: string;
    version: string;
    generationTime: number;
    prompt: string;
    seed?: number;
  };
  costs: {
    tokens?: number;
    credits?: number;
    costCents: number;
  };
}

export interface AIProviderConfig {
  name: string;
  enabled: boolean;
  priority: number; // Plus bas = priorité plus haute
  costPerImageCents: number;
  maxRetries: number;
  timeout: number; // ms
}

/**
 * Interface pour un provider IA
 */
export interface AIProvider {
  /**
   * Nom du provider
   */
  getName(): string;

  /**
   * Configuration du provider
   */
  getConfig(): AIProviderConfig;

  /**
   * Génère une image
   */
  generateImage(options: AIGenerationOptions): Promise<AIGenerationResult>;

  /**
   * Estime le coût d'une génération
   */
  estimateCost(options: AIGenerationOptions): number;

  /**
   * Vérifie si le provider est disponible
   */
  isAvailable(): Promise<boolean>;

  /**
   * Modère un prompt (safety check)
   */
  moderatePrompt(prompt: string): Promise<{
    isApproved: boolean;
    reason?: string;
    confidence: number;
    categories?: string[];
  }>;
}




























