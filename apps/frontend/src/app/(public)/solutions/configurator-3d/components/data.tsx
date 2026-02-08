import React from 'react';
import {
  Box,
  Layers,
  Palette,
  PenTool,
  Ruler,
  Camera,
  Download,
  Zap,
  Share2,
  Cpu,
  Sofa,
  Gem,
  Car,
  Cog,
} from 'lucide-react';

export interface Material {
  id: string;
  name: string;
  color: string;
  metalness: number;
  roughness: number;
  preview?: string;
}

export interface ConfigOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface UseCase {
  icon: React.ReactNode;
  title: string;
  description: string;
  examples: string;
  metrics: string;
  gradient: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  metric: string;
  metricLabel: string;
}

export interface TechSpec {
  category: string;
  icon: React.ReactNode;
  specs: { name: string; value: string }[];
}

export const MATERIALS: Material[] = [
  { id: 'metal', name: 'Métal Brossé', color: '#B8B8B8', metalness: 1.0, roughness: 0.3 },
  { id: 'gold', name: 'Or 18K', color: '#FFD700', metalness: 1.0, roughness: 0.2 },
  { id: 'rosegold', name: 'Or Rose', color: '#E8B4B8', metalness: 1.0, roughness: 0.25 },
  { id: 'silver', name: 'Argent 925', color: '#C0C0C0', metalness: 1.0, roughness: 0.15 },
  { id: 'wood', name: 'Bois Chêne', color: '#8B4513', metalness: 0.0, roughness: 0.8 },
  { id: 'walnut', name: 'Noyer', color: '#5D432C', metalness: 0.0, roughness: 0.75 },
  { id: 'leather', name: 'Cuir Naturel', color: '#8B6914', metalness: 0.0, roughness: 0.9 },
  { id: 'carbon', name: 'Carbone', color: '#1A1A1A', metalness: 0.8, roughness: 0.1 },
  { id: 'marble', name: 'Marbre Blanc', color: '#F5F5F5', metalness: 0.0, roughness: 0.3 },
  { id: 'ceramic', name: 'Céramique', color: '#FFFAF0', metalness: 0.0, roughness: 0.4 },
  { id: 'glass', name: 'Verre Crystal', color: '#E8F4F8', metalness: 0.0, roughness: 0.0 },
  { id: 'titanium', name: 'Titane', color: '#878787', metalness: 0.95, roughness: 0.35 },
];

export const CONFIG_OPTIONS: ConfigOption[] = [
  { id: 'material', name: 'Matériaux', icon: <Layers className="w-5 h-5" />, count: '25+ options' },
  { id: 'color', name: 'Couleurs', icon: <Palette className="w-5 h-5" />, count: '100+ nuances' },
  { id: 'engraving', name: 'Gravure 3D', icon: <PenTool className="w-5 h-5" />, count: 'Texte & motifs' },
  { id: 'dimensions', name: 'Dimensions', icon: <Ruler className="w-5 h-5" />, count: 'Sur mesure' },
];

export const COLORS = [
  '#000000', '#FFFFFF', '#1E40AF', '#7C3AED', '#DC2626', '#EA580C',
  '#CA8A04', '#16A34A', '#0891B2', '#DB2777', '#4B5563', '#78716C',
];

export const FEATURES = [
  { icon: <Box className="w-6 h-6" />, title: 'Rendu Photoréaliste', description: 'Three.js avec PBR materials, HDR environment maps, soft shadows.', highlight: 'PBR + HDR' },
  { icon: <Palette className="w-6 h-6" />, title: 'Options Illimitées', description: 'Couleurs, matériaux, textures. Règles CPQ avancées.', highlight: 'CPQ avancé' },
  { icon: <PenTool className="w-6 h-6" />, title: 'Gravure 3D', description: 'Texte et motifs gravés, profondeur variable, 50+ polices.', highlight: '50+ polices' },
  { icon: <Layers className="w-6 h-6" />, title: 'Vue Éclatée', description: 'Animations d\'éclatement pour voir chaque pièce.', highlight: 'Animations' },
  { icon: <Camera className="w-6 h-6" />, title: 'AR Native', description: 'Export USDZ (iOS) et GLB (Android) pour AR mobile.', highlight: 'iOS + Android' },
  { icon: <Download className="w-6 h-6" />, title: 'Export Production', description: 'GLB, USDZ, FBX, OBJ. PNG/PDF 4K-8K pour impression.', highlight: 'Multi-formats' },
  { icon: <Zap className="w-6 h-6" />, title: 'Tarification Dynamique', description: 'Prix en temps réel selon options.', highlight: 'Temps réel' },
  { icon: <Share2 className="w-6 h-6" />, title: 'Partage Config', description: 'URL unique, partage social, embed iframe, QR codes.', highlight: 'QR codes' },
];

export const USE_CASES: UseCase[] = [
  { icon: <Sofa className="w-8 h-8" />, title: 'Mobilier', description: 'Sofas, tables, chaises personnalisables. Tissus, bois, dimensions sur mesure.', examples: 'IKEA, Made.com, BoConcept', metrics: '+45% conversions', gradient: 'from-amber-500 to-orange-500' },
  { icon: <Gem className="w-8 h-8" />, title: 'Bijouterie', description: 'Bagues, colliers, montres. Gravure nom, choix pierres et métaux.', examples: 'Cartier, Pandora, Gemmyo', metrics: '+60% panier moyen', gradient: 'from-purple-500 to-pink-500' },
  { icon: <Car className="w-8 h-8" />, title: 'Automobile', description: 'Configurateur véhicule. Couleur, jantes, options intérieures.', examples: 'Tesla, BMW, Porsche', metrics: '-70% retours', gradient: 'from-blue-500 to-cyan-500' },
  { icon: <Cog className="w-8 h-8" />, title: 'Équipement Industriel', description: 'Machines, outils, modules. Règles de compatibilité.', examples: 'Siemens, Schneider, ABB', metrics: '+200% leads qualifiés', gradient: 'from-slate-500 to-zinc-500' },
];

export const TESTIMONIALS: Testimonial[] = [
  { quote: "Le configurateur 3D a révolutionné notre approche e-commerce. Les clients voient exactement ce qu'ils commandent.", author: 'Pierre Durand', role: 'Directeur Digital', company: 'Mobilier Design', avatar: 'PD', metric: '+45%', metricLabel: 'Conversions' },
  { quote: "La gravure 3D en temps réel est exactement ce dont nous avions besoin. Nos clients personnalisent et voient le résultat instantanément.", author: 'Marie Leblanc', role: 'CEO', company: 'Joaillerie Moderne', avatar: 'ML', metric: '+60%', metricLabel: 'Panier moyen' },
  { quote: "L'export AR a changé la donne. Nos clients visualisent les meubles dans leur salon. Le taux de retour a chuté de 55%.", author: 'Thomas Martin', role: 'E-commerce Manager', company: 'Home & Design', avatar: 'TM', metric: '-55%', metricLabel: 'Retours produits' },
];

export const TECH_SPECS: TechSpec[] = [
  { category: 'Rendering', icon: <Cpu className="w-5 h-5" />, specs: [{ name: 'Engine', value: 'Three.js r160+' }, { name: 'Materials', value: 'PBR (metalness/roughness)' }, { name: 'Lighting', value: 'IBL + HDR environment' }, { name: 'Shadows', value: 'PCF soft shadows' }, { name: 'Anti-aliasing', value: 'MSAA 4x / FXAA' }] },
  { category: 'Performance', icon: <Zap className="w-5 h-5" />, specs: [{ name: 'FPS Desktop', value: '60 FPS constant' }, { name: 'FPS Mobile', value: '30+ FPS garanti' }, { name: 'Load Time', value: '< 2s (10MB model)' }, { name: 'Polygons', value: 'Jusqu\'à 1M (LODs auto)' }, { name: 'Textures', value: '4K PBR (compressed)' }] },
  { category: 'Export', icon: <Download className="w-5 h-5" />, specs: [{ name: 'Web', value: 'GLB, GLTF optimisés' }, { name: 'AR iOS', value: 'USDZ (Reality Kit)' }, { name: 'AR Android', value: 'GLB (SceneViewer)' }, { name: 'CAO', value: 'FBX, OBJ, STEP' }, { name: 'Print', value: 'PNG/PDF 4K-8K 300 DPI' }] },
];

export const FAQS: FAQ[] = [
  { question: "Quelle est la différence avec un configurateur 2D ?", answer: "Le configurateur 3D permet de visualiser le produit sous tous les angles avec rotation 360°, zoom, et rendu photoréaliste PBR. +35% conversions en moyenne, -55% retours." },
  { question: "Comment fonctionne la gravure 3D ?", answer: "Le texte est gravé dans le mesh 3D avec extrusion et profondeur variable (0.5mm à 3mm). Visible en temps réel, exporté en GLB, USDZ, FBX. 50+ polices." },
  { question: "Puis-je exporter pour fabrication ?", answer: "Oui. Export print-ready 4K/8K 300 DPI (PNG/PDF) et export 3D (FBX, OBJ, STEP) pour CNC ou impression 3D." },
  { question: "Le configurateur fonctionne sur mobile ?", answer: "Oui. Engine optimisé mobile, LODs adaptatifs, 30+ FPS. Export AR natif USDZ (iOS) et GLB (Android)." },
  { question: "Comment intégrer le configurateur à mon site ?", answer: "Trois options : iframe (1 ligne), SDK JavaScript (contrôle total), ou API REST (headless). 5 minutes à quelques heures." },
  { question: "Quels types de produits sont supportés ?", answer: "Tout produit 3D : mobilier, bijoux, véhicules, équipement industriel, packaging... Jusqu'à 1 million de polygones avec LODs." },
];

export const COMPARISON_FEATURES = [
  { name: 'Rendu 3D', luneo: 'Three.js + PBR + HDR', zakeke: 'WebGL standard', threekit: 'Propriétaire' },
  { name: 'Gravure 3D texte', luneo: true, zakeke: false, threekit: true },
  { name: 'Vue éclatée', luneo: true, zakeke: false, threekit: true },
  { name: 'Export AR natif', luneo: 'USDZ + GLB', zakeke: 'GLB only', threekit: 'USDZ + GLB' },
  { name: 'Export production', luneo: 'GLB/USDZ/FBX/Print', zakeke: 'GLB', threekit: 'Limité' },
  { name: 'CPQ avancé', luneo: true, zakeke: 'Basique', threekit: true },
  { name: 'Performance mobile', luneo: '30+ FPS', zakeke: 'Variable', threekit: '30+ FPS' },
  { name: 'Prix entrée', luneo: '29€/mois', zakeke: '99€/mois', threekit: 'Sur devis' },
];
