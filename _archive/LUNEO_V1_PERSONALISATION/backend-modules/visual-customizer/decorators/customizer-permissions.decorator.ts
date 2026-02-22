import { SetMetadata, applyDecorators } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { VisualCustomizerPermission } from '../visual-customizer.constants';

export const CUSTOMIZER_PERMISSION_KEY = 'customizer-permission';
export const IS_CUSTOMIZER_PUBLIC_KEY = 'is-customizer-public';

/**
 * Decorator to set customizer permission requirement
 * Usage: @CustomizerPermission(VISUAL_CUSTOMIZER_PERMISSIONS.CUSTOMIZER_UPDATE)
 */
export const CustomizerPermission = (permission: VisualCustomizerPermission) =>
  SetMetadata(CUSTOMIZER_PERMISSION_KEY, permission);

/**
 * Decorator to mark route as public customizer access
 * Combines @Public() with customizer public access metadata
 * Usage: @CustomizerPublicAccess()
 */
export const CustomizerPublicAccess = () => {
  return applyDecorators(
    Public(),
    SetMetadata(IS_CUSTOMIZER_PUBLIC_KEY, true),
  );
};
