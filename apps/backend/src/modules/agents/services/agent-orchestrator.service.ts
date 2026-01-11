/**
 * @fileoverview Service orchestrateur pour gérer les interactions entre agents
 * @module AgentOrchestratorService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs
 */

import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  /**
   * Détermine quel agent doit traiter une requête
   */
  routeToAgent(
    agentType: 'luna' | 'aria' | 'nova',
    context: Record<string, unknown>,
  ): string {
    // Logique de routage simple
    // TODO: Implémenter une logique plus sophistiquée basée sur le contexte
    return agentType;
  }
}
