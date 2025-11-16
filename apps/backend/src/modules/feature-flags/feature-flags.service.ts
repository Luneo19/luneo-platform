import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type FeatureFlagMap = Record<string, boolean>;

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private flags: FeatureFlagMap = {};
  private updatedAt: string = new Date().toISOString();

  constructor(private readonly configService: ConfigService) {
    this.reload();
  }

  getAll(): FeatureFlagMap {
    return { ...this.flags };
  }

  getUpdatedAt(): string {
    return this.updatedAt;
  }

  isEnabled(flag: string): boolean {
    return Boolean(this.flags[flag]);
  }

  reload(): void {
    const raw = this.configService.get<string>('featureFlags.raw') ?? '';
    const parsed = this.parseFlags(raw);
    this.flags = parsed;
    this.updatedAt = new Date().toISOString();
    this.logger.debug(`Feature flags reloaded (${Object.keys(parsed).length} flags)`);
  }

  private parseFlags(value: string): FeatureFlagMap {
    if (!value) {
      return {};
    }

    try {
      if (value.trim().startsWith('{')) {
        const json = JSON.parse(value);
        return Object.entries(json).reduce<FeatureFlagMap>((acc, [key, val]) => {
          acc[key] = this.coerceBoolean(val);
          return acc;
        }, {});
      }

      return value.split(',').reduce<FeatureFlagMap>((acc, token) => {
        const [key, rawVal] = token.split(':').map((part) => part.trim());
        if (!key) {
          return acc;
        }
        acc[key] = this.coerceBoolean(rawVal ?? 'true');
        return acc;
      }, {});
    } catch (error) {
      this.logger.error(
        `Failed to parse FEATURE_FLAGS value "${value}"`,
        error instanceof Error ? error.stack : undefined,
      );
      return {};
    }
  }

  private coerceBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return ['1', 'true', 'on', 'yes', 'enabled'].includes(normalized);
    }

    return false;
  }
}

