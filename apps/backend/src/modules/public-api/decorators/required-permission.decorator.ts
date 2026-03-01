import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION_METADATA_KEY = 'public_api_required_permission';

export const RequiredPermission = (permission: string) =>
  SetMetadata(REQUIRED_PERMISSION_METADATA_KEY, permission);
