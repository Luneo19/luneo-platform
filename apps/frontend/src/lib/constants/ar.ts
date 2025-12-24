/**
 * ★★★ CONSTANTES - AR ★★★
 * Constantes pour la réalité augmentée
 * - Support devices
 * - Configurations
 * - Messages
 * - Placements par défaut
 */

// ========================================
// SUPPORT DEVICES
// ========================================

export const AR_SUPPORTED_DEVICES = {
  IOS: {
    minVersion: '12.0',
    browsers: ['Safari'],
    features: ['face-tracking', 'hand-tracking', 'world-tracking'],
  },
  ANDROID: {
    minVersion: '8.0',
    browsers: ['Chrome'],
    features: ['world-tracking', 'hand-tracking'],
  },
} as const;

// ========================================
// CONFIGURATIONS
// ========================================

export const AR_CONFIG = {
  SESSION_TIMEOUT: 300000, // 5 minutes
  POLL_INTERVAL: 2000, // ms
  MAX_SESSION_DURATION: 3600000, // 1 heure
  SCREENSHOT_QUALITY: 0.9, // 0-1
  MODEL_SCALE_DEFAULT: 1.0,
  MODEL_SCALE_MIN: 0.1,
  MODEL_SCALE_MAX: 2.0,
} as const;

// ========================================
// PLACEMENTS PAR DÉFAUT
// ========================================

export const AR_DEFAULT_PLACEMENTS = {
  glasses: {
    position: { x: 0, y: 0.1, z: -0.3 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.15, y: 0.15, z: 0.15 },
  },
  earrings: {
    position: { x: 0.08, y: 0, z: -0.2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.08, y: 0.08, z: 0.08 },
  },
  necklace: {
    position: { x: 0, y: -0.1, z: -0.2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.2, y: 0.2, z: 0.2 },
  },
  watch: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.1, y: 0.1, z: 0.1 },
  },
  ring: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.05, y: 0.05, z: 0.05 },
  },
  jewelry: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.1, y: 0.1, z: 0.1 },
  },
} as const;

// ========================================
// MESSAGES
// ========================================

export const AR_MESSAGES = {
  NOT_SUPPORTED: 'La réalité augmentée n\'est pas disponible sur cet appareil',
  NOT_SUPPORTED_DETAILS:
    'Utilisez un appareil iOS (Safari) ou Android (Chrome) pour essayer en réalité augmentée',
  INITIALIZING: 'Initialisation de l\'AR...',
  SESSION_STARTING: 'Démarrage de la session AR...',
  SESSION_ACTIVE: 'Session AR active',
  SESSION_ENDED: 'Session AR terminée',
  MODEL_LOADING: 'Chargement du modèle 3D...',
  MODEL_LOADED: 'Modèle chargé avec succès',
  MODEL_ERROR: 'Erreur lors du chargement du modèle',
  PLACEMENT_INSTRUCTIONS: 'Pointez votre appareil vers une surface plane pour placer le produit',
  SCREENSHOT_TAKEN: 'Capture d\'écran prise',
  SHARE_SUCCESS: 'Partage réussi',
} as const;

// ========================================
// RECOMMENDATIONS
// ========================================

export const AR_RECOMMENDATIONS = {
  IOS: [
    'Utilisez Safari sur iOS 12+',
    'Assurez-vous que WebXR est activé',
    'Autorisez l\'accès à la caméra',
  ],
  ANDROID: [
    'Utilisez Chrome sur Android 8+',
    'Activez WebXR dans les paramètres Chrome',
    'Autorisez l\'accès à la caméra',
  ],
  GENERAL: [
    'Utilisez un appareil avec caméra',
    'Assurez-vous d\'avoir une bonne luminosité',
    'Évitez les reflets sur l\'écran',
  ],
} as const;

// ========================================
// EXPORT
// ========================================

export const arConstants = {
  SUPPORTED_DEVICES: AR_SUPPORTED_DEVICES,
  CONFIG: AR_CONFIG,
  DEFAULT_PLACEMENTS: AR_DEFAULT_PLACEMENTS,
  MESSAGES: AR_MESSAGES,
  RECOMMENDATIONS: AR_RECOMMENDATIONS,
} as const;

