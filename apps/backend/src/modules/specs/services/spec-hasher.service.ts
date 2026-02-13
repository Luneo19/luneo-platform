import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { SpecCanonicalizerService } from './spec-canonicalizer.service';

@Injectable()
export class SpecHasherService {
  constructor(private canonicalizer: SpecCanonicalizerService) {}

  /**
   * Hasher un spec (SHA256)
   */
  hash(spec: unknown): string {
    const canonical = this.canonicalizer.toCanonicalString(spec);
    return createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Vérifier si un spec correspond à un hash
   */
  verify(spec: unknown, expectedHash: string): boolean {
    return this.hash(spec) === expectedHash;
  }
}











