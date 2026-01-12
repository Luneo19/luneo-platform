/**
 * @luneo/api-sdk
 * Official TypeScript SDK for Luneo Public API
 */

import { LuneoClient } from './client';
import { LuneoClientConfig } from './types';

export * from './types';
export * from './client';
export * from './resources/products';
export * from './resources/designs';
export * from './resources/orders';
export * from './resources/analytics';

/**
 * Create a new Luneo API client
 */
export function createClient(config: LuneoClientConfig): LuneoClient {
  return new LuneoClient(config);
}

/**
 * Default export
 */
export default LuneoClient;
