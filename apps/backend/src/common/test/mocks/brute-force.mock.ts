/**
 * Mock Brute Force Service pour les tests d'intégration
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class MockBruteForceService {
  private attempts: Map<string, number> = new Map();
  private blocked: Set<string> = new Set();

  private getIdentifier(email: string, ip: string): string {
    return `${email}:${ip}`;
  }

  async canAttempt(email: string, ip: string): Promise<boolean> {
    const identifier = this.getIdentifier(email, ip);
    return !this.blocked.has(identifier);
  }

  async recordAttempt(email: string, ip: string): Promise<{ attempts: number; blocked: boolean }> {
    const identifier = this.getIdentifier(email, ip);
    const current = this.attempts.get(identifier) || 0;
    const newCount = current + 1;
    this.attempts.set(identifier, newCount);
    
    if (newCount >= 5) {
      this.blocked.add(identifier);
    }
    
    return {
      attempts: newCount,
      blocked: newCount >= 5,
    };
  }

  async resetAttempts(email: string, ip: string): Promise<void> {
    const identifier = this.getIdentifier(email, ip);
    this.attempts.delete(identifier);
    this.blocked.delete(identifier);
  }

  async recordSuccess(email: string, ip: string): Promise<void> {
    await this.resetAttempts(email, ip);
  }

  async isBlocked(email: string, ip: string): Promise<{ blocked: boolean; ttl: number }> {
    const identifier = this.getIdentifier(email, ip);
    return {
      blocked: this.blocked.has(identifier),
      ttl: this.blocked.has(identifier) ? 300 : 0,
    };
  }

  /**
   * Check if blocked and throw exception if so
   * Used by AuthService.login
   */
  async checkAndThrow(email: string, ip: string): Promise<void> {
    const { blocked } = await this.isBlocked(email, ip);
    if (blocked) {
      throw new Error('Too many failed login attempts. Please try again later.');
    }
  }

  /**
   * Record a failed login attempt
   * Used by AuthService.login on invalid credentials
   */
  async recordFailedAttempt(email: string, ip: string): Promise<void> {
    await this.recordAttempt(email, ip);
  }

  // For testing
  clear(): void {
    this.attempts.clear();
    this.blocked.clear();
  }
}
