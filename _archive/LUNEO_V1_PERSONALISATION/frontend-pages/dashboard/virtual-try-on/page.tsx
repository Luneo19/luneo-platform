'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Camera,
  Download,
  Share2,
  Eye,
  Watch,
  Sparkles,
  Package,
  Image as ImageIcon,
  BarChart3,
  AlertCircle,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Settings,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PlanGate } from '@/lib/hooks/api/useFeatureGate';
import { UpgradePrompt } from '@/components/upgrade/UpgradePrompt';
import { logger } from '@/lib/logger';
import TryOnView from '@/components/virtual-tryon/TryOnView';
import TryOnScreenshotGallery from '@/components/virtual-tryon/TryOnScreenshotGallery';
import { useTryOn } from '@/lib/hooks/useTryOn';
import type { TryOnCategory } from '@/lib/virtual-tryon/TryOnEngine';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { endpoints } from '@/lib/api/client';
import { useI18n } from '@/i18n/useI18n';
import Image from 'next/image';

// ========================================
// Types
// ========================================

interface ArProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  image_url?: string;
  imageUrl?: string;
  arEnabled?: boolean;
  model3dUrl?: string;
  modelUSDZUrl?: string;
}

interface TryOnAnalytics {
  totalSessions: number;
  productsTried: number;
  screenshotsTaken: number;
  avgSessionDurationSeconds: number;
  sessionsOverTime: { date: string; count: number }[];
  topProducts: { name: string; count: number }[];
  conversionRate?: number;
  categoryBreakdown?: unknown[];
}

type DashboardCategory = 'eyewear' | 'watch' | 'ring' | 'earring' | 'necklace';

const CATEGORY_OPTIONS: {
  value: DashboardCategory;
  label: string;
  icon: React.ReactNode;
  tryOnCategory: TryOnCategory;
}[] = [
  { value: 'eyewear', label: 'Lunettes', icon: <Eye className="w-4 h-4 mr-2" />, tryOnCategory: 'eyewear' },
  { value: 'watch', label: 'Montres', icon: <Watch className="w-4 h-4 mr-2" />, tryOnCategory: 'watch' },
  { value: 'ring', label: 'Bagues', icon: <Sparkles className="w-4 h-4 mr-2" />, tryOnCategory: 'ring' },
  { value: 'earring', label: 'Boucles d\'oreilles', icon: <Sparkles className="w-4 h-4 mr-2" />, tryOnCategory: 'earring' },
  { value: 'necklace', label: 'Colliers', icon: <Sparkles className="w-4 h-4 mr-2" />, tryOnCategory: 'necklace' },
];

// ========================================
// TryOn Tab (Refactored with new TryOnView)
// ========================================

function TryOnTab({
  preselectedProduct,
}: {
  preselectedProduct: ArProduct | null;
}) {
  const [selectedCategory, setSelectedCategory] = useState<DashboardCategory>('eyewear');
  const tryOnHook = useTryOn();

  const categoryConfig = CATEGORY_OPTIONS.find((c) => c.value === selectedCategory)!;

  // Determine model URL from preselected product
  const modelUrl = preselectedProduct?.model3dUrl || undefined;
  const modelUSDZUrl = preselectedProduct?.modelUSDZUrl || undefined;
  const productName = preselectedProduct?.name || undefined;
  const fallbackImage = preselectedProduct?.image_url || preselectedProduct?.imageUrl || undefined;

  // Map product category to dashboard category
  useEffect(() => {
    if (!preselectedProduct?.category) return;
    const cat = preselectedProduct.category.toLowerCase();
    const mapped = CATEGORY_OPTIONS.find((c) =>
      c.value === cat || (cat === 'glasses' && c.value === 'eyewear'),
    );
    if (mapped) {
      setSelectedCategory(mapped.value);
    }
  }, [preselectedProduct?.id, preselectedProduct?.category]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Left sidebar - Category selection + screenshots */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h3 className="font-semibold text-white mb-3">Categorie</h3>
          <div className="space-y-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.icon}
                {cat.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Performance info */}
        {tryOnHook.fps > 0 && (
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold text-white mb-3">Performance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">FPS</span>
                <span className={tryOnHook.fps >= 24 ? 'text-green-400' : 'text-yellow-400'}>
                  {tryOnHook.fps}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Qualite</span>
                <span className="text-blue-400">{tryOnHook.quality.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tracking</span>
                <span className={tryOnHook.isTracking ? 'text-green-400' : 'text-gray-500'}>
                  {tryOnHook.isTracking ? 'Actif' : '--'}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Session screenshots */}
        {tryOnHook.screenshots.length > 0 && (
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold text-white mb-3">
              Captures ({tryOnHook.screenshots.length})
            </h3>
            <TryOnScreenshotGallery
              screenshots={tryOnHook.screenshots.map((s) => s.dataUrl)}
              onRemove={tryOnHook.removeScreenshot}
            />
          </Card>
        )}
      </div>

      {/* Main try-on area */}
      <div className="lg:col-span-3">
        <Card className="bg-gray-800/50 border-gray-700 overflow-hidden">
          <TryOnView
            category={categoryConfig.tryOnCategory}
            modelUrl={modelUrl}
            modelUSDZUrl={modelUSDZUrl}
            productName={productName}
            fallbackImage={fallbackImage}
            enableOcclusion={true}
            enableShadows={true}
            onScreenshot={(dataUrl) => {
              tryOnHook.captureScreenshot(
                dataUrl,
                preselectedProduct?.id || 'unknown',
              );
            }}
            onTrackingChange={tryOnHook.setIsTracking}
            onFPSChange={tryOnHook.setFps}
            onQualityChange={tryOnHook.setQuality}
            onPerformanceMetric={(metric) => {
              tryOnHook.recordPerformanceMetric({
                ...metric,
                deviceType: 'unknown',
              });
            }}
            onError={(err) => {
              logger.error('Try-on error', { error: err.message });
            }}
            className="aspect-video"
          />
        </Card>
      </div>
    </div>
  );
}

// ========================================
// My AR Products Tab (preserved)
// ========================================

function MyArProductsTab({ onTryProduct }: { onTryProduct: (p: ArProduct) => void }) {
  const [products, setProducts] = useState<ArProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await endpoints.products.list({ page: 1, limit: 100 }) as { products?: ArProduct[]; data?: { products?: ArProduct[] } };
        const list = res?.products ?? res?.data?.products ?? [];
        const withAr = Array.isArray(list) ? list.filter((p: ArProduct) => p?.arEnabled !== false) : [];
        if (!cancelled) {
          setProducts(withAr);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur chargement produits');
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4 bg-gray-800/50 border-gray-700 animate-pulse">
            <div className="aspect-square bg-gray-700 rounded-lg mb-3" />
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
        <p className="text-white font-medium mb-1">Erreur</p>
        <p className="text-sm text-gray-400">{error}</p>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
        <Package className="w-14 h-14 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Aucun produit AR</h3>
        <p className="text-gray-400 text-sm">Activez l&apos;AR sur vos produits pour les afficher ici.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((p) => (
        <Card key={p?.id || 'unknown'} className="p-4 bg-gray-800/50 border-gray-700 overflow-hidden">
          <div className="aspect-square bg-gray-700 rounded-lg mb-3 relative overflow-hidden">
            {(p?.image_url || p?.imageUrl) ? (
              <Image src={p?.image_url || p?.imageUrl || ''} alt={p?.name || 'Product'} className="w-full h-full object-cover" width={200} height={200} unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-green-500/80 text-xs text-white">
              {p?.arEnabled !== false ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
              AR {p?.arEnabled !== false ? 'active' : 'desactive'}
            </div>
          </div>
          <h4 className="font-medium text-white truncate">{p?.name || 'Unnamed Product'}</h4>
          <p className="text-xs text-gray-400 mb-3">{p?.category ?? '--'}</p>
          <Button size="sm" className="w-full" onClick={() => p && onTryProduct(p)}>
            <ExternalLink className="w-4 h-4 mr-2" /> Essayer ce produit
          </Button>
        </Card>
      ))}
    </div>
  );
}

// ========================================
// Captures Tab (uses new gallery component)
// ========================================

function CapturesTab({ screenshots, onRemove }: { screenshots: Array<{ dataUrl: string; productId: string }>; onRemove: (idx: number) => void }) {
  const { t } = useI18n();

  if (screenshots.length === 0) {
    return (
      <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
        <ImageIcon className="w-14 h-14 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Aucune capture</h3>
        <p className="text-gray-400 text-sm">Prenez des screenshots depuis l&apos;onglet Essayage pour les retrouver ici.</p>
      </Card>
    );
  }

  return (
    <TryOnScreenshotGallery
      screenshots={screenshots.map((s) => s.dataUrl)}
      onRemove={onRemove}
    />
  );
}

// ========================================
// Analytics Tab (preserved + enhanced)
// ========================================

function AnalyticsTab() {
  const { t } = useI18n();
  const [data, setData] = useState<TryOnAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await endpoints.tryOn.getAnalytics(30);
        if (cancelled) return;

        const resTyped = res as { data?: Record<string, unknown> };
        const rawData = resTyped.data && typeof resTyped.data === 'object' ? resTyped.data as Record<string, unknown> : {};
        setData({
          totalSessions: typeof rawData.totalSessions === 'number' ? rawData.totalSessions : 0,
          productsTried: typeof rawData.totalProductsTried === 'number' ? rawData.totalProductsTried : (typeof rawData.productsTried === 'number' ? rawData.productsTried : 0),
          screenshotsTaken: typeof rawData.totalScreenshots === 'number' ? rawData.totalScreenshots : (typeof rawData.screenshotsTaken === 'number' ? rawData.screenshotsTaken : 0),
          avgSessionDurationSeconds: typeof rawData.avgSessionDuration === 'number' ? rawData.avgSessionDuration : (typeof rawData.avgSessionDurationSeconds === 'number' ? rawData.avgSessionDurationSeconds : 0),
          sessionsOverTime: Array.isArray(rawData.sessionsOverTime) ? rawData.sessionsOverTime : [],
          topProducts: Array.isArray(rawData.topProducts) ? rawData.topProducts.map((p: unknown) => {
            const product = p && typeof p === 'object' ? p as Record<string, unknown> : {};
            return {
              name: typeof product.productName === 'string' ? product.productName : (typeof product.name === 'string' ? product.name : 'Unknown'),
              count: typeof product.tryCount === 'number' ? product.tryCount : (typeof product.count === 'number' ? product.count : 0),
            };
          }) : [],
          conversionRate: typeof rawData.conversionRate === 'number' ? rawData.conversionRate : 0,
          categoryBreakdown: Array.isArray(rawData.categoryBreakdown) ? rawData.categoryBreakdown : [],
        });
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('common.error'));
          setData({
            totalSessions: 0,
            productsTried: 0,
            screenshotsTaken: 0,
            avgSessionDurationSeconds: 0,
            sessionsOverTime: [],
            topProducts: [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t]);

  const chartData = useMemo(() => {
    if (!data?.sessionsOverTime?.length) {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { date: d.toISOString().slice(0, 10), count: 0 };
      });
    }
    return data.sessionsOverTime;
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 bg-gray-800/50 border-gray-700 animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-6 bg-gray-700 rounded w-1/3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
        <p className="text-white font-medium mb-1">{t('common.error')}</p>
        <p className="text-sm text-gray-400">{error}</p>
      </Card>
    );
  }

  const stats = data ?? {
    totalSessions: 0,
    productsTried: 0,
    screenshotsTaken: 0,
    avgSessionDurationSeconds: 0,
    sessionsOverTime: [],
    topProducts: [],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-sm text-gray-400 mb-1">{t('virtualTryOn.totalSessions')}</p>
          <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
        </Card>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-sm text-gray-400 mb-1">{t('virtualTryOn.productsTried')}</p>
          <p className="text-2xl font-bold text-white">{stats.productsTried}</p>
        </Card>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-sm text-gray-400 mb-1">{t('virtualTryOn.screenshots')}</p>
          <p className="text-2xl font-bold text-white">{stats.screenshotsTaken}</p>
        </Card>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <p className="text-sm text-gray-400 mb-1">{t('virtualTryOn.avgSessionDuration')}</p>
          <p className="text-2xl font-bold text-white">{stats.avgSessionDurationSeconds ? `${Math.round(stats.avgSessionDurationSeconds)}s` : '--'}</p>
        </Card>
      </div>
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="font-semibold text-white mb-4">{t('virtualTryOn.sessionsOverTime')}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="tryonArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
            <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#tryonArea)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      {stats.topProducts?.length > 0 && (
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="font-semibold text-white mb-4">{t('virtualTryOn.topProductsTried')}</h3>
          <ul className="space-y-2">
            {stats.topProducts.slice(0, 10).map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">{item.name}</span>
                <span className="text-white font-medium">{item.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ========================================
// Main Page Component
// ========================================

function VirtualTryOnPageContent() {
  const [activeTab, setActiveTab] = useState('essayage');
  const [preselectedProduct, setPreselectedProduct] = useState<ArProduct | null>(null);
  const tryOnHook = useTryOn();

  const handleTryProduct = useCallback((p: ArProduct) => {
    setPreselectedProduct(p);
    setActiveTab('essayage');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Virtual Try-On</h1>
          <p className="text-base sm:text-lg text-gray-300">Essayez vos produits en realite augmentee avec rendu 3D</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-800 border border-gray-700 p-1 mb-4">
            <TabsTrigger value="essayage" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Sparkles className="w-4 h-4 mr-2" /> Essayage
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" /> Mes Produits AR
            </TabsTrigger>
            <TabsTrigger value="captures" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <ImageIcon className="w-4 h-4 mr-2" /> Captures
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="essayage" className="mt-4">
            <TryOnTab preselectedProduct={preselectedProduct} />
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <MyArProductsTab onTryProduct={handleTryProduct} />
          </TabsContent>

          <TabsContent value="captures" className="mt-4">
            <CapturesTab
              screenshots={tryOnHook.screenshots}
              onRemove={tryOnHook.removeScreenshot}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const MemoizedContent = memo(VirtualTryOnPageContent);

export default function VirtualTryOnPage() {
  return (
    <ErrorBoundary level="page" componentName="VirtualTryOnPage">
      <PlanGate
        minimumPlan="professional"
        showUpgradePrompt
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <UpgradePrompt
              requiredPlan="professional"
              feature="Virtual Try-On"
              description="Le Virtual Try-On est disponible a partir du plan Professional."
            />
          </div>
        }
      >
        <MemoizedContent />
      </PlanGate>
    </ErrorBoundary>
  );
}
