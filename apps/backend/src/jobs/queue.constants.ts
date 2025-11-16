export const QueueNames = {
  AI_GENERATION: 'ai-generation',
  IMAGE_GENERATION: 'image-generation',
  IMAGE_UPSCALE: 'image-upscale',
  TEXTURE_BLEND: 'texture-blend',
  EXPORT_GLTF: 'export-gltf',
  AR_PREVIEW: 'ar-preview',
  DESIGN_GENERATION: 'design-generation',
  RENDER_2D: 'render-2d',
  RENDER_3D: 'render-3d',
  RENDER_PROCESSING: 'render-processing',
  PRODUCTION_PROCESSING: 'production-processing',
  USAGE_METERING: 'usage-metering',
  ECOMMERCE_SYNC: 'ecommerce-sync',
  ECOMMERCE_WEBHOOKS: 'ecommerce-webhooks',
  PRODUCT_ENGINE: 'product-engine',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

