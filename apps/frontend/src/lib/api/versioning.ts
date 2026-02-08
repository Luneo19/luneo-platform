/**
 * ★★★ API VERSIONING ★★★
 * Gestion du versioning d'API
 * - Support multi-versions (v1, v2)
 * - Migration automatique
 * - Deprecation warnings
 */

import { getBackendUrl } from '@/lib/api/server-url';

// ========================================
// TYPES
// ========================================

export type ApiVersion = 'v1' | 'v2' | 'latest';

export interface VersionInfo {
  version: ApiVersion;
  deprecated?: boolean;
  deprecationDate?: Date;
  sunsetDate?: Date;
  migrationGuide?: string;
}

// ========================================
// CONFIG
// ========================================

const API_VERSIONS: Record<ApiVersion, VersionInfo> = {
  v1: {
    version: 'v1',
    deprecated: false,
  },
  v2: {
    version: 'v2',
    deprecated: false,
  },
  latest: {
    version: 'v2',
    deprecated: false,
  },
};

// ========================================
// SERVICE
// ========================================

export class ApiVersioningService {
  private static instance: ApiVersioningService;
  private currentVersion: ApiVersion = 'v2';

  private constructor() {}

  static getInstance(): ApiVersioningService {
    if (!ApiVersioningService.instance) {
      ApiVersioningService.instance = new ApiVersioningService();
    }
    return ApiVersioningService.instance;
  }

  /**
   * Récupère la version actuelle
   */
  getCurrentVersion(): ApiVersion {
    return this.currentVersion;
  }

  /**
   * Définit la version à utiliser
   */
  setVersion(version: ApiVersion): void {
    this.currentVersion = version;
  }

  /**
   * Récupère les infos d'une version
   */
  getVersionInfo(version: ApiVersion): VersionInfo {
    return API_VERSIONS[version] || API_VERSIONS.latest;
  }

  /**
   * Vérifie si une version est dépréciée
   */
  isDeprecated(version: ApiVersion): boolean {
    const info = this.getVersionInfo(version);
    return info.deprecated || false;
  }

  /**
   * Génère l'URL avec version
   */
  getVersionedUrl(path: string, version?: ApiVersion): string {
    const v = version || this.currentVersion;
    const baseUrl = getBackendUrl();
    return `${baseUrl}/api/${v}${path.startsWith('/') ? path : `/${path}`}`;
  }

  /**
   * Ajoute les headers de version
   */
  getVersionHeaders(version?: ApiVersion): Record<string, string> {
    const v = version || this.currentVersion;
    return {
      'X-API-Version': v,
      Accept: `application/vnd.luneo.${v}+json`,
    };
  }
}

// ========================================
// EXPORT
// ========================================

export const apiVersioning = ApiVersioningService.getInstance();

