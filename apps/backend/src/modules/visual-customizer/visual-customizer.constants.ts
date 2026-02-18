// Visual Customizer Module - Constants & Permissions

export const VISUAL_CUSTOMIZER_PERMISSIONS = {
  // Configuration CRUD
  CUSTOMIZER_CREATE: 'visual-customizer:customizer:create',
  CUSTOMIZER_READ: 'visual-customizer:customizer:read',
  CUSTOMIZER_UPDATE: 'visual-customizer:customizer:update',
  CUSTOMIZER_DELETE: 'visual-customizer:customizer:delete',
  CUSTOMIZER_PUBLISH: 'visual-customizer:customizer:publish',
  CUSTOMIZER_CLONE: 'visual-customizer:customizer:clone',

  // Zones
  ZONE_CREATE: 'visual-customizer:zone:create',
  ZONE_READ: 'visual-customizer:zone:read',
  ZONE_UPDATE: 'visual-customizer:zone:update',
  ZONE_DELETE: 'visual-customizer:zone:delete',

  // Layers
  LAYER_CREATE: 'visual-customizer:layer:create',
  LAYER_READ: 'visual-customizer:layer:read',
  LAYER_UPDATE: 'visual-customizer:layer:update',
  LAYER_DELETE: 'visual-customizer:layer:delete',
  LAYER_REORDER: 'visual-customizer:layer:reorder',

  // Assets
  ASSET_UPLOAD: 'visual-customizer:asset:upload',
  ASSET_READ: 'visual-customizer:asset:read',
  ASSET_DELETE: 'visual-customizer:asset:delete',
  ASSET_MANAGE_LIBRARY: 'visual-customizer:asset:manage-library',
  CLIPART_MANAGE: 'visual-customizer:clipart:manage',

  // Texts & Fonts
  TEXT_CREATE: 'visual-customizer:text:create',
  TEXT_READ: 'visual-customizer:text:read',
  TEXT_UPDATE: 'visual-customizer:text:update',
  FONT_MANAGE: 'visual-customizer:font:manage',

  // Presets
  PRESET_CREATE: 'visual-customizer:preset:create',
  PRESET_READ: 'visual-customizer:preset:read',
  PRESET_UPDATE: 'visual-customizer:preset:update',
  PRESET_DELETE: 'visual-customizer:preset:delete',
  PRESET_PUBLISH: 'visual-customizer:preset:publish',

  // Sessions
  SESSION_CREATE: 'visual-customizer:session:create',
  SESSION_READ: 'visual-customizer:session:read',
  SESSION_READ_ALL: 'visual-customizer:session:read-all',
  SESSION_DELETE: 'visual-customizer:session:delete',

  // Designs
  DESIGN_SAVE: 'visual-customizer:design:save',
  DESIGN_READ: 'visual-customizer:design:read',
  DESIGN_UPDATE: 'visual-customizer:design:update',
  DESIGN_DELETE: 'visual-customizer:design:delete',
  DESIGN_SHARE: 'visual-customizer:design:share',

  // Export
  EXPORT_IMAGE: 'visual-customizer:export:image',
  EXPORT_PDF: 'visual-customizer:export:pdf',
  EXPORT_PRINT: 'visual-customizer:export:print',
  EXPORT_VECTOR: 'visual-customizer:export:vector',

  // Moderation
  MODERATION_VIEW: 'visual-customizer:moderation:view',
  MODERATION_ACTION: 'visual-customizer:moderation:action',

  // Analytics
  ANALYTICS_READ: 'visual-customizer:analytics:read',
  ANALYTICS_EXPORT: 'visual-customizer:analytics:export',

  // Admin
  ADMIN_ALL: 'visual-customizer:admin:all',
} as const;

export type VisualCustomizerPermission =
  (typeof VISUAL_CUSTOMIZER_PERMISSIONS)[keyof typeof VISUAL_CUSTOMIZER_PERMISSIONS];

const P = VISUAL_CUSTOMIZER_PERMISSIONS;

export const VISUAL_CUSTOMIZER_ROLE_PERMISSIONS = {
  PUBLIC: [
    P.CUSTOMIZER_READ,
    P.ZONE_READ,
    P.LAYER_READ,
    P.ASSET_READ,
    P.TEXT_READ,
    P.PRESET_READ,
    P.SESSION_CREATE,
    P.SESSION_READ,
    P.DESIGN_SAVE,
    P.DESIGN_READ,
    P.EXPORT_IMAGE,
  ],

  VIEWER: [
    P.CUSTOMIZER_READ,
    P.ZONE_READ,
    P.LAYER_READ,
    P.ASSET_READ,
    P.TEXT_READ,
    P.PRESET_READ,
    P.SESSION_CREATE,
    P.SESSION_READ,
    P.DESIGN_SAVE,
    P.DESIGN_READ,
    P.EXPORT_IMAGE,
  ],

  EDITOR: [
    P.CUSTOMIZER_CREATE,
    P.CUSTOMIZER_READ,
    P.CUSTOMIZER_UPDATE,
    P.CUSTOMIZER_CLONE,
    P.ZONE_CREATE,
    P.ZONE_READ,
    P.ZONE_UPDATE,
    P.LAYER_CREATE,
    P.LAYER_READ,
    P.LAYER_UPDATE,
    P.LAYER_REORDER,
    P.ASSET_UPLOAD,
    P.ASSET_READ,
    P.TEXT_CREATE,
    P.TEXT_READ,
    P.TEXT_UPDATE,
    P.PRESET_CREATE,
    P.PRESET_READ,
    P.PRESET_UPDATE,
    P.SESSION_CREATE,
    P.SESSION_READ,
    P.DESIGN_SAVE,
    P.DESIGN_READ,
    P.DESIGN_UPDATE,
    P.DESIGN_SHARE,
    P.EXPORT_IMAGE,
    P.EXPORT_PDF,
  ],

  MANAGER: [
    P.CUSTOMIZER_CREATE,
    P.CUSTOMIZER_READ,
    P.CUSTOMIZER_UPDATE,
    P.CUSTOMIZER_DELETE,
    P.CUSTOMIZER_PUBLISH,
    P.CUSTOMIZER_CLONE,
    P.ZONE_CREATE,
    P.ZONE_READ,
    P.ZONE_UPDATE,
    P.ZONE_DELETE,
    P.LAYER_CREATE,
    P.LAYER_READ,
    P.LAYER_UPDATE,
    P.LAYER_DELETE,
    P.LAYER_REORDER,
    P.ASSET_UPLOAD,
    P.ASSET_READ,
    P.ASSET_DELETE,
    P.ASSET_MANAGE_LIBRARY,
    P.CLIPART_MANAGE,
    P.TEXT_CREATE,
    P.TEXT_READ,
    P.TEXT_UPDATE,
    P.FONT_MANAGE,
    P.PRESET_CREATE,
    P.PRESET_READ,
    P.PRESET_UPDATE,
    P.PRESET_DELETE,
    P.PRESET_PUBLISH,
    P.SESSION_CREATE,
    P.SESSION_READ,
    P.SESSION_READ_ALL,
    P.SESSION_DELETE,
    P.DESIGN_SAVE,
    P.DESIGN_READ,
    P.DESIGN_UPDATE,
    P.DESIGN_DELETE,
    P.DESIGN_SHARE,
    P.EXPORT_IMAGE,
    P.EXPORT_PDF,
    P.EXPORT_PRINT,
    P.EXPORT_VECTOR,
    P.MODERATION_VIEW,
    P.MODERATION_ACTION,
    P.ANALYTICS_READ,
  ],

  ADMIN: [P.ADMIN_ALL],
} as const;

// Rate limits per endpoint category
export const VISUAL_CUSTOMIZER_RATE_LIMITS = {
  PUBLIC_SESSION_CREATE: { ttl: 60, limit: 10 },
  PUBLIC_CUSTOMIZER_READ: { ttl: 60, limit: 100 },
  PUBLIC_DESIGN_SAVE: { ttl: 60, limit: 5 },
  PUBLIC_EXPORT_IMAGE: { ttl: 60, limit: 10 },

  CUSTOMIZER_CREATE: { ttl: 60, limit: 10 },
  CUSTOMIZER_UPDATE: { ttl: 60, limit: 30 },
  ASSET_UPLOAD: { ttl: 60, limit: 20 },
  EXPORT_PDF: { ttl: 60, limit: 10 },
  EXPORT_PRINT: { ttl: 60, limit: 5 },

  BULK_EXPORT: { ttl: 300, limit: 3 },
  RENDER_HIGHRES: { ttl: 60, limit: 5 },
} as const;

// Validation limits
export const VISUAL_CUSTOMIZER_LIMITS = {
  MAX_ZONES_PER_CUSTOMIZER: 20,
  MAX_LAYERS_PER_ZONE: 50,
  MAX_PRESETS_PER_CUSTOMIZER: 100,

  MAX_IMAGE_SIZE_MB: 10,
  MAX_FONT_SIZE_MB: 5,
  MAX_ASSETS_PER_DESIGN: 20,
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
  ],
  ALLOWED_FONT_TYPES: [
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'application/x-font-ttf',
    'application/x-font-otf',
    'application/font-woff',
    'application/font-woff2',
  ],
  MAX_IMAGE_DIMENSIONS: { width: 4096, height: 4096 },
  MIN_IMAGE_DIMENSIONS: { width: 50, height: 50 },

  MAX_TEXT_LENGTH: 500,
  MAX_TEXT_LAYERS: 10,
  MIN_FONT_SIZE: 8,
  MAX_FONT_SIZE: 200,

  MAX_DESIGN_COMPLEXITY: 100,
  MAX_SAVED_DESIGNS_PER_USER: 50,
  MAX_UNDO_HISTORY: 100,

  MAX_EXPORT_WIDTH: 8192,
  MAX_EXPORT_HEIGHT: 8192,
  MAX_PDF_PAGES: 10,

  MAX_SESSION_DURATION_HOURS: 24,

  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,

  MAX_CANVAS_DATA_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
} as const;

export const SUPPORTED_SYSTEM_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Inter',
  'Playfair Display',
  'Raleway',
  'Oswald',
  'Source Sans Pro',
  'Nunito',
] as const;

export const MODERATION_SETTINGS = {
  ENABLE_AUTO_MODERATION: true,
  NSFW_THRESHOLD: 0.7,
  PROFANITY_CHECK: true,
  TRADEMARK_CHECK: true,
  QUARANTINE_FLAGGED: true,
} as const;

export const CUSTOMIZER_ALLOWED_DOMAINS = [
  'cloudinary.com',
  'res.cloudinary.com',
  'luneo.io',
  'luneo.com',
] as const;

export const CUSTOMIZER_CANVAS_ALLOWED_OBJECT_TYPES = [
  'image',
  'text',
  'rect',
  'circle',
  'ellipse',
  'triangle',
  'polygon',
  'line',
  'path',
  'group',
  'star',
  'arrow',
] as const;

// BullMQ queue names
export const CUSTOMIZER_QUEUES = {
  RENDER: 'customizer-render',
  EXPORT: 'customizer-export',
  MODERATION: 'customizer-moderation',
  THUMBNAIL: 'customizer-thumbnail',
  ANALYTICS: 'customizer-analytics',
} as const;
