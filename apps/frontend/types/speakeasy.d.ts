declare module 'speakeasy' {
  export interface GenerateSecretOptions {
    name: string;
    issuer?: string;
    length?: number;
  }

  export interface GenerateSecretResponse {
    base32: string;
    otpauth_url: string;
    qr_code?: string;
    secret?: string;
  }

  export interface VerifyOptions {
    secret: string;
    encoding?: 'ascii' | 'hex' | 'base32' | 'base64';
    token: string;
    window?: number;
  }

  export interface TotpVerifyOptions {
    secret: string;
    encoding?: 'ascii' | 'hex' | 'base32' | 'base64';
    token: string;
    window?: number;
  }

  export const totp: {
    verify(options: TotpVerifyOptions): boolean | null;
    generate(options: { secret: string; encoding?: string }): string;
  };

  export function generateSecret(options: GenerateSecretOptions): GenerateSecretResponse;
  export function verify(options: VerifyOptions): boolean | null;
  export function generateSecretASCII(options: GenerateSecretOptions): GenerateSecretResponse;
  export function otpauthURL(options: {
    secret: string;
    label: string;
    issuer?: string;
    algorithm?: string;
    digits?: number;
    period?: number;
  }): string;
}

