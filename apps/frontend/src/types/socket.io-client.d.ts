declare module 'socket.io-client' {
  export interface ManagerOptions {
    transports?: string[];
  }

  export interface SocketOptions extends ManagerOptions {}

  export interface Socket {
    on(event: string, listener: (...args: unknown[]) => void): Socket;
    close(): void;
    connected: boolean;
  }

  export function io(
    uri: string,
    opts?: Partial<ManagerOptions & SocketOptions>
  ): Socket;
}

