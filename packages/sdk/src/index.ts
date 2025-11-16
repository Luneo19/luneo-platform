import { LuneoClient } from './client';

export * from './types';
export { LuneoClient } from './client';

export const createClient = (options?: import('./types').LuneoClientOptions) =>
  new LuneoClient(options);

