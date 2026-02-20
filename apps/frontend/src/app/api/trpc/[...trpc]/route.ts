/**
 * ★★★ ROUTE HANDLER TRPC ★★★
 * Handler Next.js pour tRPC
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/lib/trpc/routers/_app';
import { createContext } from '@/lib/trpc/server';
import { serverLogger } from '@/lib/logger-server';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    onError: ({ path, error }) => {
      serverLogger.error(`tRPC failed on ${path ?? '<no-path>'}`, error, { path });
    },
  });

export { handler as GET, handler as POST };



