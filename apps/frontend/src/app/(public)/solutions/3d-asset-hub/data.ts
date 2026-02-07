export const STATS = [
  { value: '15+', label: 'Formats Supportés' },
  { value: '1000+', label: 'Assets/Heure' },
  { value: '90%', label: 'Réduction Taille' },
  { value: '< 2s', label: 'Temps Traitement' },
] as const;

export const FORMATS = {
  input: ['GLB', 'FBX', 'OBJ', 'GLTF', 'USD', 'USDZ', 'STL', '3DS', 'COLLADA', 'PLY', 'X3D', 'DAE'],
  output: ['GLB', 'USDZ', 'FBX', 'OBJ', 'STL', 'GLTF', 'GLB Draco', 'GLTF Binary'],
} as const;

export const OPTIMIZATIONS = [
  { title: 'Mesh Optimization', description: 'Réduction intelligente des polygones', reduction: '50-90%' },
  { title: 'Texture Compression', description: 'WebP, AVIF, Basis Universal', reduction: '70-95%' },
  { title: 'LOD Generation', description: '4 niveaux de détail automatiques', reduction: 'Adaptive' },
  { title: 'Geometry Cleanup', description: 'Suppression doublons, normals, UVs', reduction: '10-30%' },
] as const;

export interface FeatureItem {
  title: string;
  description: string;
  iconKey: string;
}

export const FEATURES: FeatureItem[] = [
  { title: 'Upload Multi-Format', description: 'Importez GLB, FBX, OBJ, GLTF, USD, STL, 3DS, COLLADA, et plus. Support drag & drop.', iconKey: 'Upload' },
  { title: 'Optimisation Automatique', description: 'Compression textures, réduction polygones, génération LODs automatique.', iconKey: 'Zap' },
  { title: 'Conversion 15+ Formats', description: 'Convertissez entre USDZ, GLB, FBX, OBJ, STL, et tous les formats 3D majeurs.', iconKey: 'FileType' },
  { title: 'AI Mesh Simplification', description: 'Réduction intelligente des polygones avec préservation des détails visuels.', iconKey: 'Cpu' },
  { title: 'LOD Auto-Generation', description: 'Créez 4 niveaux de détail (LOD0-LOD3) automatiquement pour performance optimale.', iconKey: 'Layers' },
  { title: 'Deploy Universel', description: 'Exportez pour Web, AR (iOS/Android), VR, Unity, Unreal Engine en 1 clic.', iconKey: 'Globe' },
  { title: 'Batch Processing', description: 'Traitez 1000+ assets simultanément avec BullMQ et Redis pour scaling massif.', iconKey: 'Package' },
  { title: 'CDN Multi-Région', description: 'Distribution Cloudflare + Vercel avec edge caching pour latence ultra-faible.', iconKey: 'Cloud' },
];

export interface DeployTarget {
  name: string;
  iconKey: string;
}

export const DEPLOY_TARGETS: DeployTarget[] = [
  { name: 'Web (Three.js)', iconKey: 'Globe' },
  { name: 'iOS AR (USDZ)', iconKey: 'Sparkles' },
  { name: 'Android AR (GLB)', iconKey: 'Sparkles' },
  { name: 'Unity', iconKey: 'Package' },
  { name: 'Unreal Engine', iconKey: 'Package' },
  { name: 'WebXR', iconKey: 'Globe' },
];

export interface PricingPlan {
  name: string;
  price: string;
  assets: string;
  bandwidth: string;
  features: string[];
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  { name: 'Starter', price: '29', assets: '100', bandwidth: '10 GB', features: ['Upload illimité', 'Optimisation basique', '2 formats export', 'Support email'] },
  { name: 'Pro', price: '79', assets: '1000', bandwidth: '100 GB', features: ['Tout Starter +', 'AI Optimization', 'Tous formats export', 'Batch processing', 'Support prioritaire'], popular: true },
  { name: 'Enterprise', price: 'Custom', assets: 'Illimité', bandwidth: 'Illimité', features: ['Tout Pro +', 'White-label', 'CDN privé', 'SLA 99.99%', 'Support dédié 24/7'] },
];

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  { question: 'Quels formats 3D sont supportés ?', answer: 'Nous supportons 12+ formats: GLB, GLTF, FBX, OBJ, USDZ, USD, STL, 3DS, COLLADA, PLY, X3D, DAE. Import et export dans tous ces formats.' },
  { question: "Comment fonctionne l'optimisation AI ?", answer: "Notre algorithme analyse la géométrie et réduit intelligemment les polygones tout en préservant les détails visuels importants. Réduction moyenne de 50-90% sans perte de qualité perceptible." },
  { question: "Puis-je traiter des milliers d'assets ?", answer: "Oui ! Notre système de batch processing avec BullMQ et Redis peut traiter 1000+ assets par heure. Uploadez un CSV avec vos URLs et laissez notre pipeline automatisé gérer le reste." },
  { question: 'Où sont hébergés mes assets ?', answer: 'Vos assets sont stockés sur Cloudinary avec distribution via CDN multi-région (Cloudflare + Vercel Edge). Latence < 50ms worldwide avec 99.99% uptime SLA.' },
  { question: "Puis-je intégrer avec mon stack existant ?", answer: "Absolument ! API REST complète, SDK JavaScript, webhooks, et intégrations natives avec Shopify, WooCommerce, Unity, Unreal Engine. Ou utilisez notre package NPM @luneo/ar-export." },
];
