'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/useI18n';
import dynamic from 'next/dynamic';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Palette,
  Type,
  Image as ImageIcon,
  Layers,
  Download,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Eye,
  Share2,
  Square,
  Circle,
  Star,
  Heart,
  Settings,
  RotateCw,
  Copy,
  Trash2,
  Play,
  FileText,
  Code,
  Webhook,
  Users,
  Building2,
  ShoppingCart,
  Shirt,
  Package,
  CreditCard,
  TrendingUp,
  Clock,
  Shield,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MousePointer,
  Minus,
  Plus,
  Undo2,
  Redo2,
  Grid3X3,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Move,
  Crop,
  Paintbrush,
  Wand2,
  Upload,
  FolderOpen,
  Save,
  Printer,
  Hexagon,
  Triangle,
  Pentagon,
  Octagon,
  MessageCircle,
  Calculator,
  BarChart3,
  Gift,
  Award,
  BadgeCheck,
  Headphones,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSolutionData } from '@/lib/hooks/useSolutionData';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

// Canonical URL for SEO/JSON-LD. Next.js metadata must be statically analyzable, so we use a constant instead of process.env here.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';

// ============================================
// TYPES
// ============================================

interface CanvasElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'clipart';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  shapeType?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface UseCase {
  icon: React.ReactNode;
  title: string;
  description: string;
  metrics: string;
  industry: string;
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

// ============================================
// CONSTANTS
// ============================================

const TOOL_CATEGORIES = [
  {
    id: 'select',
    name: 'Sélection',
    icon: <MousePointer className="w-5 h-5" />,
    color: 'gray',
    shortcut: 'V',
  },
  {
    id: 'text',
    name: 'Texte',
    icon: <Type className="w-5 h-5" />,
    color: 'blue',
    shortcut: 'T',
  },
  {
    id: 'image',
    name: 'Image',
    icon: <ImageIcon className="w-5 h-5" />,
    color: 'purple',
    shortcut: 'I',
  },
  {
    id: 'shapes',
    name: 'Formes',
    icon: <Square className="w-5 h-5" />,
    color: 'green',
    shortcut: 'S',
  },
  {
    id: 'clipart',
    name: 'Cliparts',
    icon: <Star className="w-5 h-5" />,
    color: 'orange',
    shortcut: 'C',
  },
  {
    id: 'brush',
    name: 'Pinceau',
    icon: <Paintbrush className="w-5 h-5" />,
    color: 'pink',
    shortcut: 'B',
  },
];

const SHAPES = [
  { id: 'rectangle', name: 'Rectangle', icon: <Square className="w-5 h-5" /> },
  { id: 'circle', name: 'Cercle', icon: <Circle className="w-5 h-5" /> },
  { id: 'triangle', name: 'Triangle', icon: <Triangle className="w-5 h-5" /> },
  { id: 'star', name: 'Étoile', icon: <Star className="w-5 h-5" /> },
  { id: 'heart', name: 'Cœur', icon: <Heart className="w-5 h-5" /> },
  { id: 'hexagon', name: 'Hexagone', icon: <Hexagon className="w-5 h-5" /> },
];

const CLIPARTS = ['🎨', '⭐', '💎', '🔥', '🚀', '💪', '👑', '🎯', '💡', '🎵', '🌟', '❤️'];

const FONTS = [
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Impact',
  'Comic Sans MS',
];

const COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308', 
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

const EXPORT_FORMATS = [
  { format: 'PNG', dpi: '300 DPI', description: 'Web & Print haute qualité', icon: <ImageIcon className="w-5 h-5" /> },
  { format: 'PDF', dpi: '300 DPI', description: 'Documents professionnels', icon: <FileText className="w-5 h-5" /> },
  { format: 'SVG', dpi: 'Vectoriel', description: 'Scalable à l\'infini', icon: <Wand2 className="w-5 h-5" /> },
  { format: 'PDF/X-4', dpi: 'CMYK', description: 'Standard imprimeurs', icon: <Printer className="w-5 h-5" /> },
];

const FEATURES = [
    {
      icon: <Palette className="w-6 h-6" />,
    title: 'Éditeur Canvas Professionnel',
    description: 'Interface Konva.js optimisée avec multi-layers, groupes, masques et blend modes. Performance 60 FPS garantie.',
    highlight: 'Konva.js',
    },
    {
      icon: <Type className="w-6 h-6" />,
      title: 'Texte Avancé',
    description: 'Google Fonts (1000+ polices), courbes de Bézier, effets outline/shadow/glow, déformation 3D, texte sur chemin.',
    highlight: '1000+ polices',
    },
    {
      icon: <ImageIcon className="w-6 h-6" />,
      title: 'Images & Cliparts',
    description: 'Upload drag & drop, bibliothèque 15,000+ cliparts, filtres Instagram-style, crop intelligent, remove background IA.',
    highlight: '15K+ cliparts',
    },
    {
      icon: <Square className="w-6 h-6" />,
      title: 'Formes Vectorielles',
    description: 'Rectangles, cercles, polygones, courbes Bézier personnalisées, import/export SVG avec édition point par point.',
    highlight: 'Import SVG',
    },
    {
      icon: <Layers className="w-6 h-6" />,
    title: 'Layers Pro',
    description: 'Gestion Photoshop-style avec groupes, verrouillage, visibilité, blend modes (multiply, screen, overlay...).',
    highlight: 'Blend modes',
    },
    {
      icon: <Eye className="w-6 h-6" />,
    title: 'Preview 3D Temps Réel',
    description: 'Visualisez votre design sur 75+ mockups 3D (t-shirts, mugs, affiches, packaging) avec rotation 360°.',
    highlight: '75+ mockups',
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Export Print-Ready',
    description: 'PNG/PDF/SVG 300 DPI, conversion CMYK automatique, bleed 3mm, crop marks, profils ICC (ISO Coated v2).',
    highlight: 'CMYK auto',
    },
    {
    icon: <Users className="w-6 h-6" />,
      title: 'Collaboration Temps Réel',
    description: 'Multi-utilisateurs simultanés via WebSocket, curseurs visibles, chat intégré, commentaires sur éléments.',
    highlight: 'WebSocket',
  },
];

const USE_CASES: UseCase[] = [
  {
    icon: <Shirt className="w-8 h-8" />,
    title: 'Print-on-Demand',
    description: 'Permettez à vos clients de personnaliser t-shirts, hoodies, mugs. Export auto vers Printful/Printify.',
    metrics: '+340% conversions',
    industry: 'E-commerce POD',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: 'Cartes de Visite',
    description: 'Éditeur de cartes professionnelles avec templates, bleed automatique et export PDF/X-4.',
    metrics: '2M+ cartes/mois',
    industry: 'Imprimerie',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: <Package className="w-8 h-8" />,
    title: 'Packaging Custom',
    description: 'Personnalisation de boîtes, étiquettes, emballages avec aperçu 3D du packaging final.',
    metrics: '-60% erreurs',
    industry: 'Packaging',
    gradient: 'from-green-500 to-teal-500',
  },
  {
    icon: <Gift className="w-8 h-8" />,
    title: 'Cadeaux Personnalisés',
    description: 'Gravure et impression sur bijoux, verres, plaques avec prévisualisation réaliste.',
    metrics: '+85% panier moyen',
    industry: 'Cadeaux',
    gradient: 'from-orange-500 to-red-500',
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Le customizer Luneo a transformé notre business. Nos clients adorent créer leurs propres designs et le taux de retour a chuté de 45%.",
    author: 'Marie Dupont',
    role: 'CEO',
    company: 'PrintShop Pro',
    avatar: 'MD',
    metric: '+340%',
    metricLabel: 'Conversions',
  },
  {
    quote: "L'intégration avec notre Shopify a pris 2 heures. Maintenant nos clients personnalisent 500+ produits par jour sans aucun souci.",
    author: 'Thomas Bernard',
    role: 'CTO',
    company: 'CustomTees France',
    avatar: 'TB',
    metric: '2h',
    metricLabel: 'Intégration',
  },
  {
    quote: "Le support technique est exceptionnel. Chaque fois que j'ai eu une question, j'ai eu une réponse en moins d'une heure.",
    author: 'Sophie Martin',
    role: 'E-commerce Manager',
    company: 'GiftBox',
    avatar: 'SM',
    metric: '<1h',
    metricLabel: 'Réponse support',
  },
];

const FAQS: FAQ[] = [
  {
    question: "Quels types de produits puis-je personnaliser ?",
    answer: "Notre customizer supporte 75+ types de produits : t-shirts, hoodies, mugs, affiches, cartes de visite, stickers, coques téléphone, tote bags, packaging, et bien plus. Vous pouvez aussi créer vos propres templates personnalisés avec notre éditeur de mockups.",
  },
  {
    question: "Mes clients peuvent-ils uploader leurs propres images ?",
    answer: "Absolument ! Upload illimité d'images via drag & drop avec validation automatique (format, taille min/max, résolution). Notre IA optimise automatiquement les images pour l'impression (upscaling 300 DPI) et peut même supprimer les arrière-plans.",
  },
  {
    question: "Comment fonctionne la collaboration temps réel ?",
    answer: "Grâce aux WebSockets, plusieurs utilisateurs peuvent éditer le même design simultanément. Vous voyez les curseurs des autres en temps réel, pouvez commenter des éléments spécifiques, et chatter. Parfait pour les équipes créatives et les revues client.",
  },
  {
    question: "L'export print est-il vraiment professionnel ?",
    answer: "Oui ! Nos exports respectent les standards de l'industrie : PDF/X-4 avec CMYK (profil ISO Coated v2), 300 DPI minimum, bleed 3mm automatique, crop marks et registration marks. Accepté par 99% des imprimeurs professionnels.",
  },
  {
    question: "Quelles intégrations e-commerce supportez-vous ?",
    answer: "Intégrations natives avec Shopify, WooCommerce, Magento 2, PrestaShop, BigCommerce. Pour les autres plateformes, notre API REST complète et nos webhooks permettent une intégration custom en quelques heures.",
  },
  {
    question: "Puis-je personnaliser l'interface pour ma marque ?",
    answer: "Avec le plan Business et Enterprise, vous avez accès au white-label complet : logo, couleurs, domaine personnalisé, suppression des mentions Luneo. L'éditeur s'intègre parfaitement à votre identité visuelle.",
  },
];

const COMPARISON_FEATURES = [
  { name: 'Canvas Engine', luneo: 'Konva.js Pro', zakeke: 'Non spécifié', canva: 'Propriétaire' },
  { name: 'Outils disponibles', luneo: '12+ outils', zakeke: '6 outils', canva: '20+ outils' },
  { name: 'Collaboration temps réel', luneo: true, zakeke: false, canva: true },
  { name: 'Versioning designs', luneo: true, zakeke: false, canva: 'Limité' },
  { name: 'Export PDF/X-4 CMYK', luneo: true, zakeke: 'Basique', canva: false },
  { name: 'Preview 3D Mockups', luneo: '75+ mockups', zakeke: 'Basique', canva: false },
  { name: 'API complète', luneo: true, zakeke: true, canva: 'Limité' },
  { name: 'White-label', luneo: true, zakeke: true, canva: false },
  { name: 'Intégration POD', luneo: 'Printful, Gelato, etc.', zakeke: 'Limité', canva: false },
  { name: 'Prix / mois', luneo: 'À partir de 29€', zakeke: 'À partir de 99€', canva: '12€ (pas POD)' },
];

// ============================================
// COMPONENTS
// ============================================

// Interactive Demo Canvas
function DemoCanvas() {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState('select');
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [elements, setElements] = useState<CanvasElement[]>([
    { id: '1', type: 'text', x: 200, y: 150, width: 200, height: 50, rotation: 0, content: 'Votre Texte', color: '#8B5CF6', fontSize: 32, fontFamily: 'Arial' },
  ]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState('#8B5CF6');
  const [fontSize, setFontSize] = useState(32);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const addElement = useCallback((type: string, options?: Partial<CanvasElement>) => {
    const newElement: CanvasElement = {
      id: `${type}-${Date.now()}`,
      type: type as CanvasElement['type'],
      x: 150 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      width: type === 'text' ? 200 : 100,
      height: type === 'text' ? 50 : 100,
      rotation: 0,
      color: currentColor,
      ...options,
    };

    if (type === 'text') {
      newElement.content = 'Nouveau Texte';
      newElement.fontSize = fontSize;
      newElement.fontFamily = 'Arial';
    } else if (type === 'shape') {
      newElement.shapeType = selectedShape;
    } else if (type === 'clipart') {
      newElement.content = options?.content || '⭐';
      newElement.fontSize = 48;
    }

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    setCanUndo(true);
  }, [currentColor, fontSize, selectedShape]);

  const deleteSelected = useCallback(() => {
    if (selectedElement) {
      setElements(prev => prev.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
      setCanUndo(true);
    }
  }, [selectedElement]);

  const duplicateSelected = useCallback(() => {
    const element = elements.find(el => el.id === selectedElement);
    if (element) {
      const newElement = {
        ...element,
        id: `${element.type}-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
      };
      setElements(prev => [...prev, newElement]);
      setSelectedElement(newElement.id);
      setCanUndo(true);
    }
  }, [elements, selectedElement]);

  return (
    <Card className="bg-gray-900/80 border-purple-500/30 backdrop-blur-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Left Toolbar */}
        <div className="lg:col-span-1 bg-gray-950 p-2 flex lg:flex-col gap-1 border-b lg:border-b-0 lg:border-r border-gray-800">
          {TOOL_CATEGORIES.map((tool) => (
                    <button
                      key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-2 lg:p-3 rounded-lg transition-all relative group ${
                        activeTool === tool.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title={`${tool.name} (${tool.shortcut})`}
            >
              {tool.icon}
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 hidden lg:block">
                {tool.name}
              </span>
                    </button>
                  ))}

          <div className="h-px lg:h-auto lg:w-px bg-gray-700 my-1 lg:my-2 lg:mx-auto" />

          {/* Quick Actions */}
          <button
            onClick={() => setCanUndo(false)}
            disabled={!canUndo}
            className="p-2 lg:p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title={t('common.undoCtrlZ')}
            aria-label="Undo"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            disabled={!canRedo}
            className="p-2 lg:p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Rétablir (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo2 className="w-5 h-5" />
          </button>
              </div>

              {/* Canvas Area */}
        <div className="lg:col-span-8 bg-gray-800/50 p-4 lg:p-6 flex flex-col">
          {/* Canvas Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white" aria-label="Zoom out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 px-2">100%</span>
              <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white" aria-label="Zoom in">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white" aria-label="Toggle grid">
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white" aria-label="Fullscreen">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="flex-1 bg-gray-800/50 rounded-lg relative overflow-hidden shadow-2xl border border-gray-700"
            style={{ minHeight: '400px' }}
            onClick={(e) => {
              if (e.target === canvasRef.current) {
                setSelectedElement(null);
              }
            }}
          >
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

            {/* Elements */}
            {elements.map((element) => (
                      <motion
                key={element.id}
                className={`absolute cursor-move ${
                  selectedElement === element.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
                style={{
                  left: element.x,
                  top: element.y,
                  transform: `rotate(${element.rotation}deg)`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElement(element.id);
                }}
                drag
                dragMomentum={false}
                onDragEnd={((_event: React.DragEvent<HTMLElement>, info: { offset: { x: number; y: number } }) => {
                  setElements(prev => prev.map(el =>
                    el.id === element.id
                      ? { ...el, x: el.x + info.offset.x, y: el.y + info.offset.y }
                      : el
                  ));
                }) as (e: React.DragEvent<HTMLElement>) => void}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {element.type === 'text' && (
                  <div
                    style={{
                      color: element.color,
                      fontSize: element.fontSize,
                      fontFamily: element.fontFamily,
                    }}
                    className="font-bold whitespace-nowrap select-none"
                  >
                    {element.content}
                  </div>
                )}
                {element.type === 'shape' && (
                  <div
                    style={{
                      width: element.width,
                      height: element.height,
                      backgroundColor: element.color,
                      borderRadius: element.shapeType === 'circle' ? '50%' : element.shapeType === 'rectangle' ? '8px' : '0',
                      clipPath: element.shapeType === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 
                                element.shapeType === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' :
                                element.shapeType === 'heart' ? 'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")' :
                                undefined,
                    }}
                  />
                )}
                {element.type === 'clipart' && (
                  <div style={{ fontSize: element.fontSize }} className="select-none">
                    {element.content}
                  </div>
                )}
                      </motion>
            ))}

            {/* Empty State */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Cliquez sur un outil pour commencer</p>
                  <p className="text-sm mt-1">ou glissez une image ici</p>
                  </div>
              </div>
            )}
                </div>

          {/* Canvas Footer */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
            <span>Canvas: 800 × 600 px</span>
            <span>{elements.length} élément{elements.length > 1 ? 's' : ''}</span>
                </div>
              </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 bg-gray-900 p-4 border-t lg:border-t-0 lg:border-l border-gray-800 overflow-y-auto">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
                  Propriétés
                </h3>

          {/* Tool-specific options */}
                {activeTool === 'text' && (
                  <div className="space-y-4">
                    <div>
                <label className="text-xs text-gray-400 mb-2 block">Police</label>
                      <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                  {FONTS.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                      </select>
                    </div>
                    <div>
                <label className="text-xs text-gray-400 mb-2 block">Taille: {fontSize}px</label>
                      <input
                        type="range"
                        min="12"
                        max="120"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-purple-500"
                      />
                    </div>
              <Button
                onClick={() => addElement('text')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Texte
              </Button>
                  </div>
                )}

                {activeTool === 'shapes' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Type de forme</label>
                <div className="grid grid-cols-3 gap-2">
                  {SHAPES.map(shape => (
                      <button
                      key={shape.id}
                      onClick={() => setSelectedShape(shape.id)}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedShape === shape.id
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {shape.icon}
                      </button>
                    ))}
                </div>
              </div>
              <Button
                onClick={() => addElement('shape', { shapeType: selectedShape })}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Forme
              </Button>
                  </div>
                )}

          {activeTool === 'clipart' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Cliparts populaires</label>
                <div className="grid grid-cols-4 gap-2">
                  {CLIPARTS.map((emoji, i) => (
                    <button
                        key={i}
                      onClick={() => addElement('clipart', { content: emoji })}
                      className="p-3 text-2xl bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                      {emoji}
                          </button>
                  ))}
                        </div>
                      </div>
              <Button variant="outline" className="w-full border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                <FolderOpen className="w-4 h-4 mr-2" />
                Bibliothèque (15K+)
              </Button>
            </div>
          )}

          {activeTool === 'image' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-400">Glissez une image ou</p>
                <p className="text-purple-400 text-sm font-medium">parcourir</p>
              </div>
              <p className="text-xs text-gray-400 text-center">
                PNG, JPG, SVG jusqu'à 10MB
              </p>
            </div>
          )}

          {/* Color Picker - Always visible */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <label className="text-xs text-gray-400 mb-2 block">Couleur</label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  className={`aspect-square rounded-lg border-2 transition-all ${
                    currentColor === color
                      ? 'border-white scale-110'
                      : 'border-transparent hover:border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
                    ))}
                  </div>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Element Actions */}
          {selectedElement && (
            <div className="mt-6 pt-6 border-t border-gray-800 space-y-2">
              <p className="text-xs text-gray-400 mb-2">Actions élément</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={duplicateSelected} className="border-gray-700">
                  <Copy className="w-4 h-4 mr-1" />
                  Dupliquer
                </Button>
                <Button variant="outline" size="sm" onClick={deleteSelected} className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}

          {/* Export */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Download className="w-4 h-4 mr-2" />
              Exporter Design
            </Button>
              </div>
            </div>
      </div>
    </Card>
  );
}

// ROI Calculator Component
function ROICalculator() {
  const [ordersPerMonth, setOrdersPerMonth] = useState(500);
  const [avgOrderValue, setAvgOrderValue] = useState(45);
  const [conversionIncrease, setConversionIncrease] = useState(15);

  const calculations = useMemo(() => {
    // Customisation produit augmente les conversions de 10-20% (moyenne secteur)
    const additionalRevenue = ordersPerMonth * avgOrderValue * (conversionIncrease / 100);
    const planCost = 49; // Plan Professional
    const roi = ((additionalRevenue - planCost) / planCost) * 100;
    const yearlyRevenue = additionalRevenue * 12;

    return {
      additionalRevenue: Math.round(additionalRevenue),
      roi: Math.round(roi),
      yearlyRevenue: Math.round(yearlyRevenue),
    };
  }, [ordersPerMonth, avgOrderValue, conversionIncrease]);

  return (
    <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/20 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Calculateur de ROI</h3>
          <p className="text-sm text-gray-400">Estimez l'impact du customizer sur votre business</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Commandes/mois actuelles
          </label>
          <input
            type="number"
            value={ordersPerMonth}
            onChange={(e) => setOrdersPerMonth(Number(e.target.value))}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Panier moyen (€)
          </label>
          <input
            type="number"
            value={avgOrderValue}
            onChange={(e) => setAvgOrderValue(Number(e.target.value))}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Augmentation conversions (%)
          </label>
          <input
            type="number"
            value={conversionIncrease}
            onChange={(e) => setConversionIncrease(Number(e.target.value))}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            min="1"
            max="100"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">+{calculations.additionalRevenue}€</div>
          <div className="text-xs text-gray-400">revenu additionnel/mois</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <BarChart3 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{calculations.roi}%</div>
          <div className="text-xs text-gray-400">ROI mensuel</div>
        </div>
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 text-center border border-green-500/30">
          <Gift className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-400">+{calculations.yearlyRevenue.toLocaleString('fr-FR')}€</div>
          <div className="text-xs text-green-300">revenu additionnel/an</div>
        </div>
      </div>
    </Card>
  );
}

// FAQ Item Component
function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-700/50 rounded-xl overflow-hidden bg-gray-800/30 backdrop-blur-sm">
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
      >
        <span className="font-semibold text-white text-sm sm:text-base pr-4">{faq.question}</span>
        <motion animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-purple-400 flex-shrink-0" />
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

function CustomizerPageContent() {
  const { t } = useI18n();
  const [showFullDemo, setShowFullDemo] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Récupérer les données dynamiques depuis l'API
  const { data: solutionData, loading: solutionLoading } = useSolutionData('customizer');

  // Fusionner les témoignages dynamiques avec les statiques
  const testimonials = useMemo(() => {
    if (solutionData?.testimonials?.length) {
      return solutionData.testimonials.map((t, i) => ({
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
      { value: '+340%', label: 'Conversions' },
      { value: '-45%', label: 'Retours' },
      { value: '2.5x', label: 'Temps sur page' },
    ];
  }, [solutionData]);

  const toggleFAQ = useCallback((index: number) => {
    setOpenFaqIndex(prev => prev === index ? null : index);
  }, []);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Luneo Product Customizer',
            description: 'Embeddable product customization platform for e-commerce stores',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: `${APP_URL}/solutions/customizer`,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
              description: 'Free tier available',
            },
            provider: {
              '@type': 'Organization',
              name: 'Luneo',
              url: APP_URL,
            },
          }),
        }}
      />
      <PageHero
        title="Personnalisation Produits"
        description="Éditeur canvas professionnel avec texte, images, formes, cliparts. Layers illimités, export PNG/SVG haute qualité, et intégration e-commerce native."
        badge="Visual Customizer"
        gradient="from-purple-600 via-pink-600 to-blue-600"
        cta={{
          label: 'Essayer la démo',
          href: '#demo'
        }}
      />

    <div className="min-h-screen dark-section relative noise-overlay">
      <div className="absolute inset-0 gradient-mesh-purple" />
      <section id="demo" className="dark-section relative noise-overlay overflow-hidden py-16 sm:py-20 lg:py-28">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Éditeur canvas professionnel avec texte, images, formes, cliparts.{' '}
              <span className="text-purple-400 font-semibold">Export print 300 DPI</span> et{' '}
              <span className="text-pink-400 font-semibold">collaboration temps réel</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-purple-500/25">
                  Essai gratuit 14 jours
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowFullDemo(true)}
                className="w-full sm:w-auto border-purple-500/50 hover:bg-purple-500/10 px-8 py-6 text-lg"
              >
                <Play className="mr-2 w-5 h-5" />
                Voir la démo live
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { stat: 'x5', label: 'Engagement', description: 'temps sur site' },
                { stat: '+45%', label: 'Conversions', description: 'taux d\'achat' },
                { stat: '+32%', label: 'Panier', description: 'valeur moyenne' },
                { stat: '-48%', label: 'Retours', description: 'moins d\'erreurs' },
              ].map((item, i) => (
                <motion
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{item.stat}</div>
                  <div className="text-sm font-semibold text-purple-400">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </motion>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* INTERACTIVE DEMO */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
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
              Testez l'Éditeur en{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Action
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Utilisez les outils pour créer votre design. Tout fonctionne en temps réel !
            </p>
          </motion>

          <motion
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <DemoCanvas />
          </motion>

            {/* Export Formats */}
          <motion
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 justify-center">
                <Download className="w-5 h-5 text-green-400" />
              Formats d'Export Professionnels
              </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {EXPORT_FORMATS.map((format, i) => (
                <Card key={i} className="bg-gray-800/50 border-gray-700/50 p-4 text-center hover:border-purple-500/50 transition-colors">
                  <div className="text-purple-400 mb-2 flex justify-center">{format.icon}</div>
                    <p className="font-semibold text-white">{format.format}</p>
                  <p className="text-xs text-gray-400">{format.dpi}</p>
                  <p className="text-xs text-purple-400 mt-1">{format.description}</p>
                  </Card>
                ))}
              </div>
          </motion>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES GRID */}
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
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Complètes
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour offrir une expérience de personnalisation professionnelle
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
                <Card className="h-full bg-gray-800/30 border-gray-700/50 p-6 hover:border-purple-500/50 hover:bg-gray-800/50 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <div className="inline-block px-2 py-0.5 bg-purple-500/20 rounded text-xs text-purple-300 font-medium mb-2">
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
              <span className="text-sm font-medium text-green-400">Cas d'Usage</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Adapté à{' '}
              <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                Votre Business
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Notre customizer s'adapte à tous les secteurs d'activité
            </p>
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
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white">{useCase.title}</h3>
                        <span className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400">{useCase.industry}</span>
                  </div>
                      <p className="text-gray-400 text-sm mb-4">{useCase.description}</p>
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
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ROI
              </span>
            </h2>
            <p className="text-gray-400">
              Estimez l'impact du customizer sur vos ventes
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
              Ils Utilisent Notre Customizer
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
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.author}</p>
                      <p className="text-sm text-gray-400">{testimonial.role}, {testimonial.company}</p>
                  </div>
                  </div>
                  <p className="text-gray-300 text-sm italic mb-4">"{testimonial.quote}"</p>
                  <div className="pt-4 border-t border-gray-700/50">
                    <div className="text-2xl font-bold text-purple-400">{testimonial.metric}</div>
                    <div className="text-xs text-gray-400">{testimonial.metricLabel}</div>
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
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
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
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
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
                  <th className="py-4 px-4 text-center text-sm font-semibold text-purple-400 bg-purple-500/10 rounded-t-lg">Luneo</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-400">Zakeke</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-400">Canva</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, i) => (
                  <tr key={i} className="border-b border-gray-700/50">
                    <td className="py-3 px-4 text-sm text-gray-300">{feature.name}</td>
                    <td className="py-3 px-4 text-center bg-purple-500/5">
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
                      {typeof feature.canva === 'boolean' ? (
                        feature.canva ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <X className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : (
                        <span className="text-gray-400 text-sm">{feature.canva}</span>
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
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
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
            <p className="text-gray-400 max-w-2xl mx-auto">
              Intégrez le customizer sur votre site en quelques minutes avec notre SDK
            </p>
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
                <span className="ml-4 text-xs text-gray-400 font-mono">integration.js</span>
              </div>
              <pre className="p-6 text-sm text-gray-300 overflow-x-auto font-mono">
{`// Option 1: SDK JavaScript
import { LuneoCustomizer } from '@luneo/customizer';

  const customizer = new LuneoCustomizer({
    container: '#customizer',
    productType: 'tshirt',
    tools: ['text', 'image', 'shapes', 'cliparts'],
    export: {
      format: 'pdf',
      dpi: 300,
    colorSpace: 'cmyk',
      bleed: 3 // mm
    },
    onSave: async (design) => {
    // Envoi automatique vers votre backend
    await saveDesign(design);
  }
});

// Option 2: Iframe simple
<iframe
  src="${APP_URL}/embed/customizer?product=tshirt"
  width="100%"
  height="800"
/>`}
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
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
              <MessageCircle className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">FAQ</span>
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

      <CTASectionNew />
    </div>
    </>
  );
}

const MemoizedCustomizerPageContent = memo(CustomizerPageContent);

export default function CustomizerPage() {
  return (
    <ErrorBoundary level="page" componentName="CustomizerPage">
      <MemoizedCustomizerPageContent />
    </ErrorBoundary>
  );
}
