import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

export interface FraudCheckRequest {
  userId?: string;
  email?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  orderValue?: number;
  action: 'signup' | 'login' | 'order' | 'payment';
}

export interface FraudResult {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  action: 'allow' | 'review' | 'block';
  checks: {
    velocity: boolean;
    device: boolean;
    email: boolean;
    ip: boolean;
    value: boolean;
  };
}

@Injectable()
export class AntiFraudeService {
  private readonly logger = new Logger(AntiFraudeService.name);

  // Seuils de risque
  private readonly THRESHOLDS = {
    velocity: {
      signupsPerHour: 3,
      ordersPerHour: 5,
      paymentsPerHour: 10,
    },
    device: {
      maxDevicesPerUser: 5,
    },
    email: {
      suspiciousDomains: ['tempmail.com', '10minutemail.com', 'guerrillamail.com'],
    },
    ip: {
      maxUsersPerIP: 10,
    },
    value: {
      suspiciousOrderValue: 10000, // 100€
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Vérifie le risque de fraude
   */
  async checkFraud(check: FraudCheckRequest): Promise<FraudResult> {
    const reasons: string[] = [];
    const checks = {
      velocity: false,
      device: false,
      email: false,
      ip: false,
      value: false,
    };

    let riskScore = 0;

    // 1. Vérification velocity
    if (check.userId || check.email) {
      const velocityCheck = await this.checkVelocity(check);
      if (!velocityCheck.passed) {
        riskScore += 30;
        reasons.push(velocityCheck.reason);
        checks.velocity = true;
      }
    }

    // 2. Vérification device
    if (check.deviceFingerprint) {
      const deviceCheck = await this.checkDevice(check);
      if (!deviceCheck.passed) {
        riskScore += 20;
        reasons.push(deviceCheck.reason);
        checks.device = true;
      }
    }

    // 3. Vérification email
    if (check.email) {
      const emailCheck = this.checkEmail(check.email);
      if (!emailCheck.passed) {
        riskScore += 25;
        reasons.push(emailCheck.reason);
        checks.email = true;
      }
    }

    // 4. Vérification IP
    if (check.ipAddress) {
      const ipCheck = await this.checkIP(check.ipAddress);
      if (!ipCheck.passed) {
        riskScore += 15;
        reasons.push(ipCheck.reason);
        checks.ip = true;
      }
    }

    // 5. Vérification valeur commande
    if (check.orderValue) {
      const valueCheck = this.checkOrderValue(check.orderValue);
      if (!valueCheck.passed) {
        riskScore += 10;
        reasons.push(valueCheck.reason);
        checks.value = true;
      }
    }

    // Déterminer le niveau de risque
    let riskLevel: FraudResult['riskLevel'] = 'low';
    let action: FraudResult['action'] = 'allow';

    if (riskScore >= 80) {
      riskLevel = 'critical';
      action = 'block';
    } else if (riskScore >= 60) {
      riskLevel = 'high';
      action = 'review';
    } else if (riskScore >= 40) {
      riskLevel = 'medium';
      action = 'review';
    }

    return {
      riskScore,
      riskLevel,
      reasons,
      action,
      checks,
    };
  }

  /**
   * Vérifie la velocity (trop d'actions en peu de temps)
   */
  private async checkVelocity(check: FraudCheckRequest): Promise<{ passed: boolean; reason?: string }> {
    const key = `fraud:velocity:${check.userId || check.email}:${check.action}`;
    const count = await this.cache.getSimple<number>(key) || 0;

    const threshold = this.THRESHOLDS.velocity[`${check.action}sPerHour` as keyof typeof this.THRESHOLDS.velocity] || 5;

    if (count >= threshold) {
      return {
        passed: false,
        reason: `Velocity check failed: ${count} ${check.action}s in the last hour (threshold: ${threshold})`,
      };
    }

    // Incrémenter le compteur
    await this.cache.setSimple(key, count + 1, 3600); // 1 heure

    return { passed: true };
  }

  /**
   * Vérifie le device fingerprint
   */
  private async checkDevice(check: FraudCheckRequest): Promise<{ passed: boolean; reason?: string }> {
    if (!check.userId || !check.deviceFingerprint) {
      return { passed: true };
    }

    const key = `fraud:device:${check.userId}`;
    const devices = await this.cache.getSimple<string[]>(key) || [];

    if (!devices.includes(check.deviceFingerprint)) {
      devices.push(check.deviceFingerprint);
      await this.cache.setSimple(key, devices, 86400 * 30); // 30 jours
    }

    if (devices.length > this.THRESHOLDS.device.maxDevicesPerUser) {
      return {
        passed: false,
        reason: `Too many devices: ${devices.length} devices for user (threshold: ${this.THRESHOLDS.device.maxDevicesPerUser})`,
      };
    }

    return { passed: true };
  }

  /**
   * Vérifie l'email
   */
  private checkEmail(email: string): { passed: boolean; reason?: string } {
    const domain = email.split('@')[1]?.toLowerCase();

    if (this.THRESHOLDS.email.suspiciousDomains.includes(domain)) {
      return {
        passed: false,
        reason: `Suspicious email domain: ${domain}`,
      };
    }

    return { passed: true };
  }

  /**
   * Vérifie l'IP
   */
  private async checkIP(ipAddress: string): Promise<{ passed: boolean; reason?: string }> {
    const key = `fraud:ip:${ipAddress}`;
    const userCount = await this.cache.getSimple<number>(key) || 0;

    if (userCount >= this.THRESHOLDS.ip.maxUsersPerIP) {
      return {
        passed: false,
        reason: `Too many users from IP: ${userCount} users (threshold: ${this.THRESHOLDS.ip.maxUsersPerIP})`,
      };
    }

    // Incrémenter (sera mis à jour lors de la création utilisateur)
    await this.cache.setSimple(key, userCount + 1, 86400); // 24 heures

    return { passed: true };
  }

  /**
   * Vérifie la valeur de commande
   */
  private checkOrderValue(value: number): { passed: boolean; reason?: string } {
    if (value > this.THRESHOLDS.value.suspiciousOrderValue) {
      return {
        passed: false,
        reason: `Suspicious order value: ${value} cents (threshold: ${this.THRESHOLDS.value.suspiciousOrderValue})`,
      };
    }

    return { passed: true };
  }
}






























