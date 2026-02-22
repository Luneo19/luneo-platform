// STUB: tRPC vanilla client replaced by REST API

const noopAsync = (): Promise<any> => Promise.resolve(undefined);

const procedureStub = { query: noopAsync, mutate: noopAsync };

const handler: ProxyHandler<any> = {
  get: () => new Proxy(procedureStub, handler),
};

export const trpcVanilla: any = new Proxy({}, handler);
export default trpcVanilla;
