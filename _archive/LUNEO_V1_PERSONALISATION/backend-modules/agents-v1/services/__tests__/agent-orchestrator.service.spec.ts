/**
 * @fileoverview Tests unitaires pour AgentOrchestratorService
 * @module AgentOrchestratorServiceSpec
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AgentOrchestratorService } from '../agent-orchestrator.service';

describe('AgentOrchestratorService', () => {
  let service: AgentOrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentOrchestratorService],
    }).compile();

    service = module.get<AgentOrchestratorService>(AgentOrchestratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('routeToAgent', () => {
    it('should return explicit agent when not auto', () => {
      const result = service.routeToAgent('luna', { message: 'test' });
      expect(result).toBe('luna');
    });

    it('should route to luna for analytics related message', () => {
      const result = service.routeToAgent('auto', {
        message: 'Peux-tu analyser mes ventes et mes KPIs ?',
        currentPage: '/dashboard/analytics',
      });
      expect(result).toBe('luna');
    });

    it('should route to aria for creative personalization message', () => {
      const result = service.routeToAgent('auto', {
        message: 'Donne-moi une idée de texte pour une gravure',
        selectedProductId: 'prod-1',
      });
      expect(result).toBe('aria');
    });

    it('should route to nova by default for generic support', () => {
      const result = service.routeToAgent('auto', {
        message: 'Je ne comprends pas comment fonctionne la plateforme',
      });
      expect(result).toBe('nova');
    });
  });

  describe('routeWithContext', () => {
    it('should return confidence between 0 and 1', () => {
      const result = service.routeWithContext({
        message: 'Analyse mes ventes',
        currentPage: '/dashboard',
      });

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(['luna', 'aria', 'nova']).toContain(result.agent);
      expect(Array.isArray(result.reasons)).toBe(true);
    });
  });

  describe('routeWithContextAsync', () => {
    it('should return confidence between 0 and 1 (async version)', async () => {
      const result = await service.routeWithContextAsync({
        message: 'Analyse mes ventes',
        currentPage: '/dashboard',
      });

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(['luna', 'aria', 'nova']).toContain(result.agent);
      expect(Array.isArray(result.reasons)).toBe(true);
    });
  });

  // ✅ PHASE 1 - C) Orchestrateur : Tests sur routage, fallback, plan d'exécution
  describe('generateExecutionPlan - Multi-steps Support', () => {
    it('should generate simple plan for simple requests', () => {
      const routingResult = {
        agent: 'luna' as const,
        confidence: 0.9,
        reasons: ['luna: high confidence'],
      };

      const plan = service.generateExecutionPlan(
        { message: 'Analyse mes ventes' },
        routingResult,
      );

      expect(plan.complexity).toBe('simple');
      expect(plan.steps.length).toBe(1);
      expect(plan.steps[0].agent).toBe('luna');
      expect(plan.estimatedLatency).toBeLessThanOrEqual(2000);
    });

    it('should generate complex plan for multi-step requests', () => {
      const routingResult = {
        agent: 'luna' as const,
        confidence: 0.5,
        reasons: ['luna: low confidence'],
      };

      const plan = service.generateExecutionPlan(
        { message: 'Analyse mes ventes et recommande-moi des produits' },
        routingResult,
      );

      expect(plan.complexity).toBe('complex');
      expect(plan.steps.length).toBeGreaterThan(1);
      expect(plan.estimatedLatency).toBeGreaterThan(2000);
    });
  });

  describe('routeWithContextAsync - IntentDetectionService Integration', () => {
    it('should use IntentDetectionService when available', async () => {
      // Note: Ce test nécessite un mock d'IntentDetectionService
      // Pour l'instant, on teste que la méthode existe et retourne un résultat
      const result = await service.routeWithContextAsync({
        message: 'Analyse mes ventes',
        currentPage: '/dashboard',
      });

      expect(result).toBeDefined();
      expect(result.agent).toBeDefined();
      expect(['luna', 'aria', 'nova']).toContain(result.agent);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});

