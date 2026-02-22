/**
 * External API base URLs for AR Studio.
 * Override via environment variables for staging/proxy.
 */
export const AR_STUDIO_CONFIG = {
  QR_CODE_API:
    process.env.QR_CODE_API_URL || 'https://api.qrserver.com/v1/create-qr-code/',
  MESHY_API_BASE:
    process.env.MESHY_API_URL || 'https://api.meshy.ai/v2',
  CLOUDCONVERT_API_BASE:
    process.env.CLOUDCONVERT_API_URL || 'https://api.cloudconvert.com/v2',
  USDZ_CONVERSION_API:
    process.env.USDZ_CONVERSION_API_URL ||
    `${process.env.BACKEND_URL || 'http://localhost:3001'}/ar/convert-usdz`,
} as const;
