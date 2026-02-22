/**
 * Tests unitaires pour CircuitBreakerService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService, CircuitState } from '../circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CircuitBreakerService],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should execute successfully when circuit is CLOSED', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await service.execute('test-key', fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should open circuit after failure threshold', async () => {
      const error = new Error('Service unavailable');
      const fn = jest.fn().mockRejectedValue(error);

      // Execute enough times to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await service.execute('test-key', fn);
        } catch (e) {
          // Expected
        }
      }

      // Circuit should be OPEN now
      const state = service.getState('test-key');
      expect(state).toBe(CircuitState.OPEN);

      // Next call should be rejected immediately
      await expect(service.execute('test-key', fn)).rejects.toThrow(
        'Circuit breaker is OPEN',
      );
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      const error = new Error('Service unavailable');
      const fn = jest.fn().mockRejectedValue(error);

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await service.execute('test-key', fn);
        } catch (e) {
          // Expected
        }
      }

      // Manually set openedAt to past (simulate timeout)
      const circuit = (service as unknown).circuits.get('test-key');
      if (circuit) {
        circuit.openedAt = Date.now() - 70000; // 70 seconds ago
      }

      // Update state (should transition to HALF_OPEN)
      (service as unknown).updateCircuitState(circuit);

      const state = service.getState('test-key');
      expect(state).toBe(CircuitState.HALF_OPEN);
    });

    it('should close circuit after successful HALF_OPEN', async () => {
      const error = new Error('Service unavailable');
      let shouldFail = true;
      const fn = jest.fn().mockImplementation(() => {
        if (shouldFail) {
          throw error;
        }
        return 'success';
      });

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await service.execute('test-key', fn);
        } catch (e) {
          // Expected
        }
      }

      // Simulate timeout and HALF_OPEN
      const circuit = (service as unknown).circuits.get('test-key');
      if (circuit) {
        circuit.openedAt = Date.now() - 70000;
        circuit.state = CircuitState.HALF_OPEN;
      }

      // Service recovered
      shouldFail = false;

      // Execute successfully twice (success threshold)
      await service.execute('test-key', fn);
      await service.execute('test-key', fn);

      const state = service.getState('test-key');
      expect(state).toBe(CircuitState.CLOSED);
    });
  });

  describe('reset', () => {
    it('should reset circuit to CLOSED', async () => {
      const error = new Error('Service unavailable');
      const fn = jest.fn().mockRejectedValue(error);

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await service.execute('test-key', fn);
        } catch (e) {
          // Expected
        }
      }

      expect(service.getState('test-key')).toBe(CircuitState.OPEN);

      // Reset
      service.reset('test-key');

      expect(service.getState('test-key')).toBe(CircuitState.CLOSED);
    });
  });
});
