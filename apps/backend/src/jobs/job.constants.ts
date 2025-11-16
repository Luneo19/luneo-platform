export const JobNames = {
  AI_GENERATION: {
    GENERATE_DESIGN: 'generate-design',
    GENERATE_HIGH_RES: 'generate-high-res',
  },
  DESIGN_GENERATION: {
    GENERATE_DESIGN: 'generate-design',
    VALIDATE_DESIGN: 'validate-design',
    OPTIMIZE_DESIGN: 'optimize-design',
  },
  IMAGE_GENERATION: {
    GENERATE: 'generate-image',
  },
  IMAGE_UPSCALE: {
    UPSCALE: 'image-upscale',
  },
  TEXTURE_BLEND: {
    BLEND: 'blend-texture',
  },
  EXPORT_GLTF: {
    EXPORT: 'export',
  },
  AR_PREVIEW: {
    GENERATE: 'generate-preview',
  },
  RENDER: {
    RENDER_2D: 'render-2d',
    RENDER_3D: 'render-3d',
    RENDER_PREVIEW: 'render-preview',
    EXPORT_ASSETS: 'export-assets',
    BATCH_RENDER: 'batch-render',
  },
  PRODUCT_ENGINE: {
    PROCESS_RULES: 'process-product-rules',
  },
  ECOMMERCE: {
    SYNC_PRODUCTS: 'sync-products',
    SYNC_ORDERS: 'sync-orders',
    PROCESS_WEBHOOK: 'process-webhook',
  },
  ECOMMERCE_SYNC: {
    SYNC_PRODUCTS: 'sync-products',
  },
  ECOMMERCE_WEBHOOKS: {
    PROCESS_SHOPIFY: 'process-shopify-webhook',
    PROCESS_WOOCOMMERCE: 'process-woocommerce-webhook',
  },
  PRODUCTION: {
    CREATE_BUNDLE: 'create-production-bundle',
    QUALITY_CONTROL: 'quality-control',
    TRACK_PRODUCTION: 'track-production',
    GENERATE_INSTRUCTIONS: 'generate-manufacturing-instructions',
  },
  USAGE: {
    RECORD_METRIC: 'record-usage',
  },
  USAGE_METERING: {
    RECORD_USAGE: 'record-usage',
  },
} as const;

export type JobNameNamespace = keyof typeof JobNames;
export type JobNameValue = (typeof JobNames)[JobNameNamespace][keyof (typeof JobNames)[JobNameNamespace]];

