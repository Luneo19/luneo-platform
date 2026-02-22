// STUB: tRPC client replaced by REST API (@/lib/api/client)
const noopHandler = {
  get(_target: any, prop: string): any {
    if (prop === 'useQuery' || prop === 'useMutation' || prop === 'useUtils') {
      return () => ({ data: undefined, isLoading: false, error: null, mutate: () => {}, mutateAsync: async () => ({}) });
    }
    if (prop === 'Provider') {
      return function StubProvider(props: any) { return props.children; };
    }
    return new Proxy({}, noopHandler);
  }
};

export const trpc = new Proxy({} as any, noopHandler);
export const api = trpc;
export default trpc;

export function getTRPCClient() { return trpc; }
