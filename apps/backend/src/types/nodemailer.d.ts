declare module 'nodemailer' {
  interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: { user: string; pass: string };
    [key: string]: unknown;
  }
  interface SendMailOptions {
    from?: string;
    to?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    replyTo?: string;
    [key: string]: unknown;
  }
  interface Transporter {
    sendMail(options: SendMailOptions, callback?: (err: Error | null, info: unknown) => void): Promise<unknown>;
    verify(): Promise<void>;
  }
  function createTransport(options: TransportOptions): Transporter;
}
