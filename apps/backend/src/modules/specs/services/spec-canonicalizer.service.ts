import { Injectable } from '@nestjs/common';

@Injectable()
export class SpecCanonicalizerService {
  /**
   * Canonicaliser un JSON (ordre des clés, pas de whitespace)
   * Pour avoir un hash stable
   */
  canonicalize(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.canonicalize(item));
    }

    if (typeof obj === 'object') {
      // Trier les clés
      const sortedKeys = Object.keys(obj).sort();
      const canonical: Record<string, unknown> = {};
      const record = obj as Record<string, unknown>;
      
      for (const key of sortedKeys) {
        canonical[key] = this.canonicalize(record[key]);
      }
      
      return canonical;
    }

    return obj;
  }

  /**
   * Convertir en JSON string canonique
   */
  toCanonicalString(obj: unknown): string {
    return JSON.stringify(this.canonicalize(obj));
  }
}











