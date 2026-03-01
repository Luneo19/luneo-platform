export interface PublicApiAuthContext {
  keyId: string;
  keyPrefix: string;
  organizationId: string;
  scopes: string[];
  permissions: string[];
  rateLimit: number;
  sandbox: boolean;
}
