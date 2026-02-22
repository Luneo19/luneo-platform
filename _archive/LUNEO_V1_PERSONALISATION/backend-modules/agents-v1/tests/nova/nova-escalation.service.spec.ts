import { Test, TestingModule } from '@nestjs/testing';
import { NovaEscalationService } from '../../nova/services/nova-escalation.service';
import { NovaTicketsService } from '../../nova/services/nova-tickets.service';

describe('NovaEscalationService', () => {
  let service: NovaEscalationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NovaEscalationService,
        { provide: NovaTicketsService, useValue: {} },
      ],
    }).compile();

    service = module.get<NovaEscalationService>(NovaEscalationService);
  });

  describe('getSupportTools', () => {
    it('should return 4 support tool definitions', () => {
      const tools = service.getSupportTools();
      expect(tools).toHaveLength(4);
    });

    it('should include create_ticket tool', () => {
      const tools = service.getSupportTools();
      expect(tools.find((t) => t.function.name === 'create_ticket')).toBeDefined();
    });

    it('should include lookup_order tool', () => {
      const tools = service.getSupportTools();
      expect(tools.find((t) => t.function.name === 'lookup_order')).toBeDefined();
    });

    it('should include search_knowledge_base tool', () => {
      const tools = service.getSupportTools();
      expect(tools.find((t) => t.function.name === 'search_knowledge_base')).toBeDefined();
    });

    it('should include escalate_to_human tool', () => {
      const tools = service.getSupportTools();
      expect(tools.find((t) => t.function.name === 'escalate_to_human')).toBeDefined();
    });

    it('should have valid priority enum for create_ticket', () => {
      const tools = service.getSupportTools();
      const createTicket = tools.find((t) => t.function.name === 'create_ticket');
      const props = createTicket!.function.parameters.properties as Record<string, unknown>;
      const priorities = props.priority.enum;
      expect(priorities).toEqual(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']);
    });
  });

  describe('analyzeEscalation', () => {
    describe('immediate triggers', () => {
      it('should escalate for legal/lawyer mentions', () => {
        const messages = [{ role: 'user', content: 'I will contact my lawyer about this' }];
        const result = service.analyzeEscalation(messages);
        expect(result.shouldEscalate).toBe(true);
        expect(result.priority).toBe('URGENT');
      });

      it('should escalate for complaint/plainte mentions', () => {
        const messages = [{ role: 'user', content: 'Je vais déposer une plainte officielle' }];
        const result = service.analyzeEscalation(messages);
        expect(result.shouldEscalate).toBe(true);
        expect(result.priority).toBe('URGENT');
      });

      it('should escalate for fraud/arnaque mentions', () => {
        const messages = [{ role: 'user', content: "C'est une arnaque complète votre service" }];
        const result = service.analyzeEscalation(messages);
        expect(result.shouldEscalate).toBe(true);
        expect(result.priority).toBe('URGENT');
      });

      it('should escalate for safety/danger mentions', () => {
        const messages = [{ role: 'user', content: 'Le produit est dangereux pour les enfants' }];
        const result = service.analyzeEscalation(messages);
        expect(result.shouldEscalate).toBe(true);
        expect(result.priority).toBe('URGENT');
      });

      it('should escalate for urgent refund demands', () => {
        const messages = [{ role: 'user', content: 'Je exige un remboursement immédiat' }];
        const result = service.analyzeEscalation(messages);
        expect(result.shouldEscalate).toBe(true);
        expect(result.priority).toBe('URGENT');
      });
    });

    describe('frustration detection', () => {
      it('should detect high frustration and escalate', () => {
        const messages = [
          { role: 'user', content: "Ce n'est pas normal!!" },
          { role: 'assistant', content: 'Je comprends.' },
          { role: 'user', content: "Toujours pas résolu!! C'est scandaleux!!" },
        ];
        const result = service.analyzeEscalation(messages);
        expect(result.shouldEscalate).toBe(true);
      });
    });

    describe('category detection', () => {
      it('should detect BILLING category', () => {
        const messages = [{ role: 'user', content: 'Mon paiement a été débité deux fois' }];
        const result = service.analyzeEscalation(messages);
        expect(result.suggestedCategory).toBe('BILLING');
      });

      it('should detect TECHNICAL category', () => {
        const messages = [{ role: 'user', content: 'Le site affiche une erreur 500' }];
        const result = service.analyzeEscalation(messages);
        expect(result.suggestedCategory).toBe('TECHNICAL');
      });

      it('should detect SHIPPING category', () => {
        const messages = [{ role: 'user', content: 'Ma livraison est en retard' }];
        const result = service.analyzeEscalation(messages);
        expect(result.suggestedCategory).toBe('SHIPPING');
      });

      it('should detect RETURNS category', () => {
        const messages = [{ role: 'user', content: 'Je voudrais faire un retour et obtenir un échange' }];
        const result = service.analyzeEscalation(messages);
        expect(result.suggestedCategory).toBe('RETURNS');
      });

      it('should detect PRODUCT category', () => {
        const messages = [{ role: 'user', content: 'Ce produit ne correspond pas' }];
        const result = service.analyzeEscalation(messages);
        expect(result.suggestedCategory).toBe('PRODUCT');
      });

      it('should detect ACCOUNT category', () => {
        const messages = [{ role: 'user', content: 'Je ne peux pas me connecter à mon compte' }];
        const result = service.analyzeEscalation(messages);
        expect(result.suggestedCategory).toBe('ACCOUNT');
      });

      it('should default to GENERAL', () => {
        const messages = [{ role: 'user', content: 'Bonjour, pouvez-vous me renseigner?' }];
        const result = service.analyzeEscalation(messages);
        expect(result.suggestedCategory).toBe('GENERAL');
      });
    });

    describe('no escalation needed', () => {
      it('should not escalate for simple questions', () => {
        const messages = [{ role: 'user', content: 'Quels sont vos horaires?' }];
        const result = service.analyzeEscalation(messages);
        expect(result.shouldEscalate).toBe(false);
        expect(result.priority).toBe('MEDIUM');
      });

      it('should not escalate for polite feedback', () => {
        const messages = [{ role: 'user', content: 'Merci pour votre aide.' }];
        const result = service.analyzeEscalation(messages);
        expect(result.shouldEscalate).toBe(false);
      });
    });

    describe('repeated topics detection', () => {
      it('should detect repeated topics and escalate', () => {
        const messages = [
          { role: 'user', content: 'Mon remboursement livraison commande produit est en attente' },
          { role: 'assistant', content: 'Je vérifie.' },
          { role: 'user', content: 'Le remboursement livraison commande produit prend trop de temps!!' },
          { role: 'assistant', content: 'Je comprends.' },
          { role: 'user', content: 'Toujours rien pour mon remboursement livraison commande produit!!' },
          { role: 'assistant', content: 'Laissez-moi vérifier.' },
          { role: 'user', content: 'Le remboursement livraison commande produit toujours pas résolu!!' },
        ];
        const result = service.analyzeEscalation(messages);
        expect(result.shouldEscalate).toBe(true);
      });
    });
  });
});
