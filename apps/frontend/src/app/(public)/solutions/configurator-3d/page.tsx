'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Box,
  Rotate3D,
  Download,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Camera,
  Share2,
  Layers,
  Palette,
  Type,
  Maximize,
  Play,
  Settings,
  ShoppingCart,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Image as ImageIcon,
  Ruler,
  PenTool,
  Grid3X3,
  Cpu,
  Globe,
  Shield,
  TrendingUp,
  Clock,
  Building2,
  Gem,
  Sofa,
  Car,
  Cog,
  Code,
  Webhook,
  MessageCircle,
  Calculator,
  BarChart3,
  Gift,
  Award,
  Star,
  Headphones,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSolutionData } from '@/lib/hooks/useSolutionData';

// ============================================
// TYPES
// ============================================

interface Material {
  id: string;
  name: string;
  color: string;
  metalness: number;
  roughness: number;
  preview?: string;
}

interface ConfigOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface UseCase {
  icon: React.ReactNode;
  title: string;
  description: string;
  examples: string;
  metrics: string;
  gradient: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  metric: string;
  metricLabel: string;
}

interface TechSpec {
  category: string;
  icon: React.ReactNode;
  specs: { name: string; value: string }[];
}

// ============================================
// CONSTANTS
// ============================================

const MATERIALS: Material[] = [
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

const CONFIG_OPTIONS: ConfigOption[] = [
  { id: 'material', name: 'Matériaux', icon: <Layers className="w-5 h-5" />, count: '25+ options' },
  { id: 'color', name: 'Couleurs', icon: <Palette className="w-5 h-5" />, count: '100+ nuances' },
  { id: 'engraving', name: 'Gravure 3D', icon: <PenTool className="w-5 h-5" />, count: 'Texte & motifs' },
  { id: 'dimensions', name: 'Dimensions', icon: <Ruler className="w-5 h-5" />, count: 'Sur mesure' },
];

const COLORS = [
  '#000000', '#FFFFFF', '#1E40AF', '#7C3AED', '#DC2626', '#EA580C',
  '#CA8A04', '#16A34A', '#0891B2', '#DB2777', '#4B5563', '#78716C',
  '#475569', '#0F766E', '#4338CA', '#9333EA', '#E11D48', '#F97316',
];

const FEATURES = [
  {
    icon: <Box className="w-6 h-6" />,
    title: 'Rendu Photoréaliste',
    description: 'Three.js avec PBR materials, HDR environment maps, soft shadows. Qualité studio photo.',
    highlight: 'PBR + HDR',
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: 'Options Illimitées',
    description: 'Couleurs, matériaux, textures, composants. Règles CPQ avancées pour configurations complexes.',
    highlight: 'CPQ avancé',
  },
  {
    icon: <PenTool className="w-6 h-6" />,
    title: 'Gravure 3D',
    description: 'Texte et motifs gravés avec extrusion 3D, profondeur variable, 50+ polices supportées.',
    highlight: '50+ polices',
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: 'Vue Éclatée',
    description: 'Animations d\'éclatement pour voir chaque pièce séparément avec labels interactifs.',
    highlight: 'Animations',
  },
  {
    icon: <Camera className="w-6 h-6" />,
    title: 'AR Native',
    description: 'Export USDZ (iOS) et GLB (Android) pour visualisation AR directe sur mobile.',
    highlight: 'iOS + Android',
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: 'Export Production',
    description: 'GLB, USDZ, FBX, OBJ pour gaming/CAO. PNG/PDF 4K-8K pour impression.',
    highlight: 'Multi-formats',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Tarification Dynamique',
    description: 'Prix calculé en temps réel selon options. Règles métier complexes supportées.',
    highlight: 'Temps réel',
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    title: 'Partage Config',
    description: 'URL unique par configuration, partage social, embed iframe, QR codes auto.',
    highlight: 'QR codes',
  },
];

const USE_CASES: UseCase[] = [
  {
    icon: <Sofa className="w-8 h-8" />,
    title: 'Mobilier',
    description: 'Sofas, tables, chaises personnalisables. Tissus, bois, dimensions sur mesure.',
    examples: 'IKEA, Made.com, BoConcept',
    metrics: '+45% conversions',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: <Gem className="w-8 h-8" />,
    title: 'Bijouterie',
    description: 'Bagues, colliers, montres. Gravure nom, choix pierres et métaux précieux.',
    examples: 'Cartier, Pandora, Gemmyo',
    metrics: '+60% panier moyen',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: <Car className="w-8 h-8" />,
    title: 'Automobile',
    description: 'Configurateur véhicule complet. Couleur carrosserie, jantes, options intérieures.',
    examples: 'Tesla, BMW, Porsche',
    metrics: '-70% retours',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <Cog className="w-8 h-8" />,
    title: 'Équipement Industriel',
    description: 'Machines, outils, modules. Configuration technique avec règles de compatibilité.',
    examples: 'Siemens, Schneider, ABB',
    metrics: '+200% leads qualifiés',
    gradient: 'from-slate-500 to-zinc-500',
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Le configurateur 3D a révolutionné notre approche e-commerce. Les clients peuvent enfin voir exactement ce qu'ils commandent avant l'achat.",
    author: 'Pierre Durand',
    role: 'Directeur Digital',
    company: 'Mobilier Design',
    avatar: 'PD',
    metric: '+45%',
    metricLabel: 'Conversions',
  },
  {
    quote: "La gravure 3D en temps réel est exactement ce dont nous avions besoin. Nos clients personnalisent leurs bijoux et voient le résultat instantanément.",
    author: 'Marie Leblanc',
    role: 'CEO',
    company: 'Joaillerie Moderne',
    avatar: 'ML',
    metric: '+60%',
    metricLabel: 'Panier moyen',
  },
  {
    quote: "L'export AR a changé la donne. Nos clients visualisent les meubles dans leur salon avant d'acheter. Le taux de retour a chuté de 55%.",
    author: 'Thomas Martin',
    role: 'E-commerce Manager',
    company: 'Home & Design',
    avatar: 'TM',
    metric: '-55%',
    metricLabel: 'Retours produits',
  },
];

const TECH_SPECS: TechSpec[] = [
  {
    category: 'Rendering',
    icon: <Cpu className="w-5 h-5" />,
    specs: [
      { name: 'Engine', value: 'Three.js r160+' },
      { name: 'Materials', value: 'PBR (metalness/roughness)' },
      { name: 'Lighting', value: 'IBL + HDR environment' },
      { name: 'Shadows', value: 'PCF soft shadows' },
      { name: 'Anti-aliasing', value: 'MSAA 4x / FXAA' },
    ],
  },
  {
    category: 'Performance',
    icon: <Zap className="w-5 h-5" />,
    specs: [
      { name: 'FPS Desktop', value: '60 FPS constant' },
      { name: 'FPS Mobile', value: '30+ FPS garanti' },
      { name: 'Load Time', value: '< 2s (10MB model)' },
      { name: 'Polygons', value: 'Jusqu\'à 1M (LODs auto)' },
      { name: 'Textures', value: '4K PBR (compressed)' },
    ],
  },
  {
    category: 'Export',
    icon: <Download className="w-5 h-5" />,
    specs: [
      { name: 'Web', value: 'GLB, GLTF optimisés' },
      { name: 'AR iOS', value: 'USDZ (Reality Kit)' },
      { name: 'AR Android', value: 'GLB (SceneViewer)' },
      { name: 'CAO', value: 'FBX, OBJ, STEP' },
      { name: 'Print', value: 'PNG/PDF 4K-8K 300 DPI' },
    ],
  },
];

const FAQS: FAQ[] = [
  {
    question: "Quelle est la différence avec un configurateur 2D ?",
    answer: "Le configurateur 3D permet de visualiser le produit sous tous les angles avec rotation 360°, zoom, et rendu photoréaliste PBR. Les clients comprennent exactement ce qu'ils achètent, ce qui augmente les conversions de +35% en moyenne et réduit les retours de -55%.",
  },
  {
    question: "Comment fonctionne la gravure 3D ?",
    answer: "Le texte est gravé directement dans le mesh 3D avec extrusion géométrique et profondeur variable (0.5mm à 3mm). Visible en temps réel dans le viewer, et exporté dans tous les formats (GLB, USDZ, FBX). Plus de 50 polices supportées, incluant des polices custom.",
  },
  {
    question: "Puis-je exporter pour fabrication ?",
    answer: "Oui ! Export print-ready 4K/8K à 300 DPI (PNG/PDF) pour impression, et export 3D professionnel (FBX, OBJ, STEP) pour CNC, impression 3D, ou envoi direct à vos fabricants. Les fichiers incluent les métadonnées de configuration.",
  },
  {
    question: "Le configurateur fonctionne sur mobile ?",
    answer: "Absolument. Notre engine est optimisé mobile avec LODs adaptatifs, textures compressées (KTX2), et rendu simplifié. 30+ FPS garanti sur smartphone moderne. Export AR natif pour visualisation in-situ via USDZ (iOS) et GLB (Android).",
  },
  {
    question: "Comment intégrer le configurateur à mon site ?",
    answer: "Trois options : iframe simple (1 ligne), SDK JavaScript (contrôle total), ou API REST (headless). L'intégration prend entre 5 minutes (iframe) et quelques heures (API custom). Documentation complète et support technique inclus.",
  },
  {
    question: "Quels types de produits sont supportés ?",
    answer: "Tout produit 3D : mobilier, bijoux, véhicules, équipement industriel, packaging, vêtements, chaussures, accessoires... Nous supportons jusqu'à 1 million de polygones avec notre système de LODs automatiques.",
  },
];

const COMPARISON_FEATURES = [
  { name: 'Rendu 3D', luneo: 'Three.js + PBR + HDR', zakeke: 'WebGL standard', threekit: 'Propriétaire' },
  { name: 'Gravure 3D texte', luneo: true, zakeke: false, threekit: true },
  { name: 'Vue éclatée', luneo: true, zakeke: false, threekit: true },
  { name: 'Export AR natif', luneo: 'USDZ + GLB', zakeke: 'GLB only', threekit: 'USDZ + GLB' },
  { name: 'Export production', luneo: 'GLB/USDZ/FBX/Print', zakeke: 'GLB', threekit: 'Limité' },
  { name: 'CPQ avancé', luneo: true, zakeke: 'Basique', threekit: true },
  { name: 'Performance mobile', luneo: '30+ FPS', zakeke: 'Variable', threekit: '30+ FPS' },
  { name: 'API complète', luneo: true, zakeke: true, threekit: true },
  { name: 'White-label', luneo: true, zakeke: true, threekit: true },
  { name: 'Prix entrée', luneo: '29€/mois', zakeke: '99€/mois', threekit: 'Sur devis' },
];

// ============================================
// COMPONENTS
// ============================================

// Interactive 3D Demo
function Demo3DViewer() {
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(MATERIALS[0]);
  const [activeTab, setActiveTab] = useState('material');
  const [isRotating, setIsRotating] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotationY, setRotationY] = useState(0);
  const [engravingText, setEngravingText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#1E40AF');
  const [lightMode, setLightMode] = useState<'day' | 'studio'>('studio');
  const [dimensions, setDimensions] = useState({ width: 100, height: 80, depth: 40 });

  // Auto rotation
  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setRotationY(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [isRotating]);

  const price = useMemo(() => {
    let base = 299;
    if (selectedMaterial.id.includes('gold')) base += 500;
    if (selectedMaterial.id === 'titanium') base += 200;
    if (selectedMaterial.id === 'carbon') base += 150;
    if (engravingText.length > 0) base += 50;
    base += (dimensions.width - 100) * 2;
    return Math.round(base);
  }, [selectedMaterial, engravingText, dimensions]);

  return (
    <Card className="bg-gray-900/80 border-blue-500/30 backdrop-blur-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[550px]">
        {/* 3D Viewer */}
        <div className="lg:col-span-7 bg-gradient-to-br from-gray-800 to-gray-900 p-4 lg:p-6 relative">
          {/* Viewer Controls */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <button
              onClick={() => setLightMode(lightMode === 'day' ? 'studio' : 'day')}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Changer l'éclairage"
            >
              {lightMode === 'day' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsRotating(!isRotating)}
              className={`p-2 rounded-lg transition-colors ${
                isRotating ? 'bg-blue-500/30 text-blue-400' : 'bg-black/50 text-gray-400 hover:text-white'
              }`}
              title="Auto-rotation"
            >
              <Rotate3D className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Zoom -"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-xs text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Zoom +"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          {/* 3D Object Simulation */}
          <div 
            className="aspect-square max-h-[400px] mx-auto flex items-center justify-center relative"
            style={{ perspective: '1000px' }}
          >
            {/* Environment reflection simulation */}
            <div 
              className={`absolute inset-0 rounded-full opacity-20 blur-3xl ${
                lightMode === 'day' ? 'bg-sky-400' : 'bg-purple-500'
              }`} 
            />

            {/* 3D Object */}
            <motion
              className="relative"
              style={{
                transform: `scale(${zoom}) rotateY(${rotationY}deg)`,
                transformStyle: 'preserve-3d',
              }}
              animate={{ rotateY: isRotating ? undefined : rotationY }}
            >
              {/* Main body */}
              <div 
                className="w-48 h-48 rounded-2xl shadow-2xl relative overflow-hidden"
                style={{
                  backgroundColor: selectedMaterial.color,
                  background: `linear-gradient(135deg, ${selectedMaterial.color} 0%, ${selectedMaterial.color}99 50%, ${selectedMaterial.color}66 100%)`,
                  boxShadow: selectedMaterial.metalness > 0.5 
                    ? `0 25px 50px -12px rgba(0,0,0,0.5), inset 0 0 80px rgba(255,255,255,0.1)` 
                    : `0 25px 50px -12px rgba(0,0,0,0.4)`,
                }}
              >
                {/* Material shine effect */}
                {selectedMaterial.metalness > 0.5 && (
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(135deg, transparent 40%, white 50%, transparent 60%)',
                    }}
                  />
                )}

                {/* Engraving text */}
                {engravingText && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span 
                      className="text-lg font-bold tracking-wider"
                      style={{
                        color: selectedMaterial.metalness > 0.5 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3), -1px -1px 2px rgba(255,255,255,0.1)',
                      }}
                    >
                      {engravingText}
                    </span>
                  </div>
                )}

                {/* Color accent */}
                <div 
                  className="absolute bottom-4 left-4 right-4 h-2 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
              </div>

              {/* Shadow */}
              <div 
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/30 rounded-full blur-xl"
                style={{ transform: `translateX(-50%) scale(${zoom})` }}
              />
            </motion>

            {/* Material info badge */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
              <p className="text-xs text-gray-400">Matériau</p>
              <p className="text-sm font-semibold text-white">{selectedMaterial.name}</p>
            </div>

            {/* Dimensions badge */}
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
              <p className="text-xs text-gray-400">Dimensions</p>
              <p className="text-sm font-semibold text-white">{dimensions.width}×{dimensions.height}×{dimensions.depth}mm</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <Button variant="outline" size="sm" className="border-blue-500/50 hover:bg-blue-500/10">
              <Camera className="w-4 h-4 mr-2" />
              Voir en AR
            </Button>
            <Button variant="outline" size="sm" className="border-purple-500/50 hover:bg-purple-500/10">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" size="sm" className="border-green-500/50 hover:bg-green-500/10">
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-5 bg-gray-900 p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-gray-800 overflow-y-auto">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Configuration
          </h3>

          {/* Config Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {CONFIG_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveTab(option.id)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  activeTab === option.id
                    ? 'bg-blue-500/20 border-blue-500 text-white'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={activeTab === option.id ? 'text-blue-400' : 'text-gray-400'}>{option.icon}</span>
                  <span className="text-sm font-semibold">{option.name}</span>
                </div>
                <span className="text-xs opacity-70">{option.count}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'material' && (
              <motion
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <label className="text-xs text-gray-400 block">Choisissez un matériau :</label>
                <div className="grid grid-cols-3 gap-2">
                  {MATERIALS.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => setSelectedMaterial(material)}
                      className={`p-2 rounded-lg border transition-all ${
                        selectedMaterial.id === material.id
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div 
                        className="w-full aspect-square rounded-md mb-1"
                        style={{ 
                          backgroundColor: material.color,
                          boxShadow: material.metalness > 0.5 ? 'inset 0 0 20px rgba(255,255,255,0.2)' : undefined
                        }}
                      />
                      <p className="text-xs text-white truncate">{material.name}</p>
                    </button>
                  ))}
                </div>
              </motion>
            )}

            {activeTab === 'color' && (
              <motion
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <label className="text-xs text-gray-400 block">Couleur d'accent :</label>
                <div className="grid grid-cols-6 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`aspect-square rounded-lg border-2 transition-all ${
                        selectedColor === color
                          ? 'border-white scale-110'
                          : 'border-transparent hover:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </motion>
            )}

            {activeTab === 'engraving' && (
              <motion
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs text-gray-400 block mb-2">Texte à graver :</label>
                  <input
                    type="text"
                    value={engravingText}
                    onChange={(e) => setEngravingText(e.target.value.slice(0, 20))}
                    placeholder="Ex: John Doe, 2024..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-400 mt-1">{engravingText.length}/20 caractères</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">Police</label>
                    <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                      <option>Arial</option>
                      <option>Times New Roman</option>
                      <option>Script</option>
                      <option>Monospace</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">Profondeur</label>
                    <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                      <option>0.5mm (Légère)</option>
                      <option>1mm (Standard)</option>
                      <option>2mm (Profonde)</option>
                    </select>
                  </div>
                </div>
              </motion>
            )}

            {activeTab === 'dimensions' && (
              <motion
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs text-gray-400 mb-2 flex justify-between">
                    <span>Largeur</span>
                    <span className="text-white font-mono">{dimensions.width}mm</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-2 flex justify-between">
                    <span>Hauteur</span>
                    <span className="text-white font-mono">{dimensions.height}mm</span>
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="150"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-2 flex justify-between">
                    <span>Profondeur</span>
                    <span className="text-white font-mono">{dimensions.depth}mm</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={dimensions.depth}
                    onChange={(e) => setDimensions({ ...dimensions, depth: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>
              </motion>
            )}
          </div>

          {/* Price Display */}
          <Card className="mt-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Prix configuré</span>
              <span className="text-3xl font-bold text-green-400">{price}€</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">Prix calculé dynamiquement selon vos options</p>
            <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Ajouter au panier
            </Button>
          </Card>
        </div>
      </div>
    </Card>
  );
}

// ROI Calculator
function ROICalculator() {
  const [avgOrderValue, setAvgOrderValue] = useState(500);
  const [ordersPerMonth, setOrdersPerMonth] = useState(200);
  const [currentConversionRate, setCurrentConversionRate] = useState(2);

  const calculations = useMemo(() => {
    const conversionIncrease = 0.35; // +35%
    const returnReduction = 0.55; // -55%
    const avgReturnCost = avgOrderValue * 0.15; // 15% du prix
    const currentReturns = ordersPerMonth * 0.12; // 12% de retours

    const additionalOrders = ordersPerMonth * conversionIncrease;
    const additionalRevenue = additionalOrders * avgOrderValue;
    const savedReturns = currentReturns * returnReduction;
    const savedReturnCost = savedReturns * avgReturnCost;
    const totalBenefit = additionalRevenue + savedReturnCost;
    const planCost = 79; // Pro plan
    const roi = ((totalBenefit - planCost) / planCost) * 100;

    return {
      additionalRevenue: Math.round(additionalRevenue),
      savedReturnCost: Math.round(savedReturnCost),
      totalBenefit: Math.round(totalBenefit),
      roi: Math.round(roi),
      yearlyBenefit: Math.round(totalBenefit * 12),
    };
  }, [avgOrderValue, ordersPerMonth]);

  return (
    <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/20 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Calculateur de ROI</h3>
          <p className="text-sm text-gray-400">Estimez l'impact du configurateur 3D</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Panier moyen (€)</label>
          <input
            type="number"
            value={avgOrderValue}
            onChange={(e) => setAvgOrderValue(Number(e.target.value))}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Commandes/mois</label>
          <input
            type="number"
            value={ordersPerMonth}
            onChange={(e) => setOrdersPerMonth(Number(e.target.value))}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-white">+{calculations.additionalRevenue.toLocaleString('fr-FR')}€</div>
          <div className="text-xs text-gray-400">revenu additionnel</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <RotateCcw className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-white">+{calculations.savedReturnCost.toLocaleString('fr-FR')}€</div>
          <div className="text-xs text-gray-400">retours évités</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <BarChart3 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-white">{calculations.roi.toLocaleString('fr-FR')}%</div>
          <div className="text-xs text-gray-400">ROI mensuel</div>
        </div>
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 text-center border border-green-500/30">
          <Gift className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-green-400">+{calculations.yearlyBenefit.toLocaleString('fr-FR')}€</div>
          <div className="text-xs text-green-300">bénéfice annuel</div>
        </div>
      </div>
    </Card>
  );
}

// FAQ Item
function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-700/50 rounded-xl overflow-hidden bg-gray-800/30 backdrop-blur-sm">
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
      >
        <span className="font-semibold text-white text-sm sm:text-base pr-4">{faq.question}</span>
        <motion animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-blue-400 flex-shrink-0" />
        </motion>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-5 text-gray-300 text-sm leading-relaxed border-t border-gray-700/50 pt-4">
              {faq.answer}
            </div>
          </motion>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

function Configurator3DPageContent() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Récupérer les données dynamiques depuis l'API
  const { data: solutionData, loading: solutionLoading } = useSolutionData('configurator-3d');

  // Fusionner les témoignages dynamiques avec les statiques
  const testimonials = useMemo(() => {
    if (solutionData?.testimonials?.length) {
      return solutionData.testimonials.map((t) => ({
        quote: t.quote,
        author: t.author,
        role: t.role,
        company: t.company,
        avatar: t.avatar,
        metric: t.result.split(' ')[0] || '+100%',
        metricLabel: t.result.split(' ').slice(1).join(' ') || 'Amélioration',
      }));
    }
    return TESTIMONIALS;
  }, [solutionData]);

  // Fusionner les stats dynamiques avec les statiques
  const stats = useMemo(() => {
    if (solutionData?.stats?.length) {
      return solutionData.stats;
    }
    return [
      { value: '+45%', label: 'Conversions' },
      { value: '-50%', label: 'Retours' },
      { value: '3x', label: 'Temps sur page' },
    ];
  }, [solutionData]);

  const toggleFAQ = useCallback((index: number) => {
    setOpenFaqIndex(prev => prev === index ? null : index);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(59,130,246,0.15),transparent_50%)]" />
          <motion
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 70% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 70%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <Box className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">3D Product Configurator</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Configurateur 3D
              </span>
              <br />
              <span className="text-white">Nouvelle Génération</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Permettez à vos clients de configurer produits en 3D temps réel.{' '}
              <span className="text-blue-400 font-semibold">PBR materials</span>,{' '}
              <span className="text-purple-400 font-semibold">gravure 3D</span>, et{' '}
              <span className="text-pink-400 font-semibold">export AR natif</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-blue-500/25">
                  Essai gratuit 14 jours
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('demo-3d')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto border-blue-500/50 hover:bg-blue-500/10 px-8 py-6 text-lg"
              >
                <Play className="mr-2 w-5 h-5" />
                Tester la démo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { stat: '+35%', label: 'Conversions', description: 'augmentation achats' },
                { stat: 'x4', label: 'Engagement', description: 'temps sur produit' },
                { stat: '+28%', label: 'Panier', description: 'valeur moyenne' },
                { stat: '-55%', label: 'Retours', description: 'moins de retours' },
              ].map((item, i) => (
                <motion
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{item.stat}</div>
                  <div className="text-sm font-semibold text-blue-400">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </motion>
              ))}
            </div>
          </motion>
        </div>
      </section>

      {/* ============================================ */}
      {/* INTERACTIVE 3D DEMO */}
      {/* ============================================ */}
      <section id="demo-3d" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
        <div className="max-w-7xl mx-auto">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Démo Interactive</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Configurez en{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Temps Réel
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Testez notre configurateur 3D. Changez matériaux, couleurs, gravure et dimensions.
            </p>
          </motion>

          <motion
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Demo3DViewer />
          </motion>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Fonctionnalités{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Avancées
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              CPQ professionnel avec rendu 3D photoréaliste et export production
            </p>
          </motion>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <motion
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full bg-gray-800/30 border-gray-700/50 p-6 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <div className="inline-block px-2 py-0.5 bg-blue-500/20 rounded text-xs text-blue-300 font-medium mb-2">
                    {feature.highlight}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* USE CASES */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
        <div className="max-w-7xl mx-auto">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
              <Building2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Industries</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Adapté à{' '}
              <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                Votre Secteur
              </span>
            </h2>
          </motion>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {USE_CASES.map((useCase, i) => (
              <motion
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`h-full bg-gradient-to-br ${useCase.gradient.replace('from-', 'from-').replace('to-', 'to-')}/10 border-gray-700/50 p-6 hover:border-white/20 transition-all`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center text-white flex-shrink-0`}>
                      {useCase.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{useCase.title}</h3>
                      <p className="text-gray-400 text-sm mb-3">{useCase.description}</p>
                      <p className="text-xs text-gray-400 mb-3">Ex: {useCase.examples}</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r ${useCase.gradient} bg-opacity-20 rounded-full`}>
                        <TrendingUp className="w-4 h-4 text-white" />
                        <span className="text-sm font-semibold text-white">{useCase.metrics}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* ROI CALCULATOR */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Calculez votre{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ROI
              </span>
            </h2>
            <p className="text-gray-400">
              Estimez l'impact du configurateur 3D sur vos ventes
            </p>
          </motion>

          <motion
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ROICalculator />
          </motion>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
        <div className="max-w-7xl mx-auto">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-yellow-400">Témoignages</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ils Utilisent Notre Configurateur
            </h2>
          </motion>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-gray-800/30 border-gray-700/50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.author}</p>
                      <p className="text-sm text-gray-400">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm italic mb-4">"{testimonial.quote}"</p>
                  <div className="pt-4 border-t border-gray-700/50">
                    <div className="text-2xl font-bold text-blue-400">{testimonial.metric}</div>
                    <div className="text-xs text-gray-400">{testimonial.metricLabel}</div>
                  </div>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TECH SPECS */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Spécifications</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Performance{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Professionnelle
              </span>
            </h2>
          </motion>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TECH_SPECS.map((section, i) => (
              <motion
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-gray-800/30 border-gray-700/50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                      {section.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white">{section.category}</h3>
                  </div>
                  <div className="space-y-3">
                    {section.specs.map((spec, j) => (
                      <div key={j} className="flex justify-between items-start gap-2 text-sm">
                        <span className="text-gray-400">{spec.name}</span>
                        <span className="text-white font-medium text-right">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COMPARISON TABLE */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
        <div className="max-w-5xl mx-auto">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-6">
              <Award className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">Comparatif</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Pourquoi Choisir{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Luneo
              </span>
              ?
            </h2>
          </motion>

          <motion
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-4 px-4 text-left text-sm font-semibold text-gray-400">Feature</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-blue-400 bg-blue-500/10 rounded-t-lg">Luneo</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-400">Zakeke</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-400">Threekit</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, i) => (
                  <tr key={i} className="border-b border-gray-700/50">
                    <td className="py-3 px-4 text-sm text-gray-300">{feature.name}</td>
                    <td className="py-3 px-4 text-center bg-blue-500/5">
                      {typeof feature.luneo === 'boolean' ? (
                        feature.luneo ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />
                      ) : (
                        <span className="text-white font-medium">{feature.luneo}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof feature.zakeke === 'boolean' ? (
                        feature.zakeke ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <X className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : (
                        <span className="text-gray-400 text-sm">{feature.zakeke}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof feature.threekit === 'boolean' ? (
                        feature.threekit ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <X className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : (
                        <span className="text-gray-400 text-sm">{feature.threekit}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion>
        </div>
      </section>

      {/* ============================================ */}
      {/* API & SDK */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
              <Code className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Développeurs</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Intégration{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Simple
              </span>
            </h2>
          </motion>

          <motion
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gray-900/80 border-cyan-500/20 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-950 border-b border-gray-800">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-xs text-gray-400 font-mono">configurator-3d.js</span>
              </div>
              <pre className="p-6 text-sm text-gray-300 overflow-x-auto font-mono">
{`import { Configurator3D } from '@luneo/configurator';

// Initialize 3D configurator
const config = new Configurator3D({
  container: '#viewer',
  modelUrl: '/models/product.glb',
  materials: {
    gold: { color: '#FFD700', metalness: 1.0, roughness: 0.2 },
    silver: { color: '#C0C0C0', metalness: 1.0, roughness: 0.15 },
    wood: { color: '#8B4513', metalness: 0.0, roughness: 0.8 }
  },
  engraving: {
    enabled: true,
    fonts: ['Arial', 'Script', 'Serif'],
    maxDepth: 2.0
  }
});

// Configure product
config.setMaterial('gold');
config.engrave('John Doe', { font: 'Script', depth: 1.0 });
config.setDimensions({ width: 100, height: 80, depth: 40 });

// Export for production
const glb = await config.exportGLB();
const usdz = await config.exportUSDZ(); // iOS AR
const print = await config.exportPrint({ dpi: 300 });

// Get dynamic price
const price = config.calculatePrice(); // €1,299`}
              </pre>
            </Card>
          </motion>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <Card className="bg-gray-800/30 border-gray-700/50 p-4 text-center">
              <Code className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="font-semibold text-white">REST API</p>
              <p className="text-xs text-gray-400">Documentation complète</p>
            </Card>
            <Card className="bg-gray-800/30 border-gray-700/50 p-4 text-center">
              <Webhook className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="font-semibold text-white">Webhooks</p>
              <p className="text-xs text-gray-400">Events temps réel</p>
            </Card>
            <Card className="bg-gray-800/30 border-gray-700/50 p-4 text-center">
              <Globe className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="font-semibold text-white">CDN Global</p>
              <p className="text-xs text-gray-400">&lt;50ms latence</p>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
        <div className="max-w-3xl mx-auto">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Questions Fréquentes
            </h2>
          </motion>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <motion
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <FAQItem
                  faq={faq}
                  isOpen={openFaqIndex === index}
                  onToggle={() => toggleFAQ(index)}
                />
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              animate={{ y: [0, -600], opacity: [0, 1, 0] }}
              transition={{ 
                duration: 4 + Math.random() * 2, 
                repeat: Infinity, 
                delay: Math.random() * 4,
                ease: 'linear'
              }}
              style={{ left: `${Math.random() * 100}%`, top: '100%' }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Box className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Prêt à Configurer en 3D ?
            </h2>
            <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
              Offrez à vos clients une expérience de configuration unique avec notre configurateur 3D nouvelle génération.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 font-bold px-10 py-6 text-lg shadow-2xl">
                  Essai gratuit 14 jours
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 font-bold px-10 py-6 text-lg">
                  <Headphones className="mr-2 w-5 h-5" />
                  Parler à un expert
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-300" />
                <span>Sans carte bancaire</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-300" />
                <span>Installation en 5 min</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-300" />
                <span>Support français 24/7</span>
              </div>
            </div>
          </motion>
        </div>
      </section>
    </div>
  );
}

export default function Configurator3DPage() {
  return (
    <ErrorBoundary level="page" componentName="Configurator3DPage">
      <Configurator3DPageContent />
    </ErrorBoundary>
  );
}
