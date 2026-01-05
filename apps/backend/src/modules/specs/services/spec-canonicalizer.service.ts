import { Injectable } from '@nestjs/common';

@Injectable()
export class SpecCanonicalizerService {
  /**
   * Canonicaliser un JSON (ordre des clés, pas de whitespace)
   * Pour avoir un hash stable
   */
  canonicalize(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.canonicalize(item));
    }

    if (typeof obj === 'object') {
      // Trier les clés
      const sortedKeys = Object.keys(obj).sort();
      const canonical: any = {};
      
      for (const key of sortedKeys) {
        canonical[key] = this.canonicalize(obj[key]);
      }
      
      return canonical;
    }

    return obj;
  }

  /**
   * Convertir en JSON string canonique
   */
  toCanonicalString(obj: any): string {
    return JSON.stringify(this.canonicalize(obj));
  }
}








