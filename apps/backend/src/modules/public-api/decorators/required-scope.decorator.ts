import { SetMetadata } from '@nestjs/common';

export const REQUIRED_SCOPE_METADATA_KEY = 'public_api_required_scope';

export const RequiredScope = (scope: string) =>
  SetMetadata(REQUIRED_SCOPE_METADATA_KEY, scope);
