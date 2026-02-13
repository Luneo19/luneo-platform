'use client';

import React, {
  useState,
  useRef,
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
  Video,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  Eye,
  Watch,
  Sparkles,
  Package,
  Image as ImageIcon,
  BarChart3,
  Play,
  Square,
  RefreshCw,
  AlertCircle,
  Loader2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PlanGate } from '@/lib/hooks/api/useFeatureGate';
import { UpgradePrompt } from '@/components/upgrade/UpgradePrompt';
import { logger } from '@/lib/logger';
import { drawGlassesOverlay, drawWatchOverlay, clearCanvas } from '@/lib/utils/overlay-renderer';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Hands } from '@mediapipe/hands';
import { Camera as CameraUtils } from '@mediapipe/camera_utils';
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

type ProductCategory = 'glasses' | 'watch' | 'jewelry';

interface Model {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
}

interface ArProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  image_url?: string;
  imageUrl?: string;
  arEnabled?: boolean;
  model3dUrl?: string;
}

interface TryOnScreenshot {
  id: string;
  dataUrl: string;
  timestamp: number;
  productName?: string;
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

const AVAILABLE_MODELS: Record<ProductCategory, Model[]> = {
  glasses: [
    { id: 'aviator', name: 'Lunettes Aviator', url: '/models/glasses/aviator.glb', thumbnail: '' },
    { id: 'wayfarer', name: 'Lunettes Wayfarer', url: '/models/glasses/wayfarer.glb', thumbnail: '' },
    { id: 'round', name: 'Lunettes Rondes', url: '/models/glasses/round.glb', thumbnail: '' },
  ],
  watch: [
    { id: 'classic', name: 'Montre Classique', url: '/models/watches/classic.glb', thumbnail: '' },
    { id: 'sport', name: 'Montre Sport', url: '/models/watches/sport.glb', thumbnail: '' },
    { id: 'luxury', name: 'Montre Luxe', url: '/models/watches/luxury.glb', thumbnail: '' },
  ],
  jewelry: [
    { id: 'hoop', name: 'Créoles', url: '/models/jewelry/hoop.glb', thumbnail: '' },
    { id: 'pendant', name: 'Collier Pendentif', url: '/models/jewelry/pendant.glb', thumbnail: '' },
  ],
};

function TryOnTab({
  selectedCategory,
  selectedModel,
  onCategoryChange,
  onModelChange,
  preselectedProduct,
  onScreenshotTaken,
}: {
  selectedCategory: ProductCategory;
  selectedModel: Model;
  onCategoryChange: (c: ProductCategory) => void;
  onModelChange: (m: Model) => void;
  preselectedProduct: ArProduct | null;
  onScreenshotTaken?: (blob: Blob) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<CameraUtils | null>(null);
  const fpsLastRef = useRef(0);
  const fpsCountRef = useRef<number[]>([]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsLoading(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Votre navigateur ne supporte pas l\'accès caméra.');
      }
      if (!faceMeshRef.current) {
        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.3, minTrackingConfidence: 0.3 });
        faceMesh.onResults((results) => {
          if (!canvasRef.current || !videoRef.current) return;
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;
          const w = videoRef.current.videoWidth || 640;
          const h = videoRef.current.videoHeight || 480;
          if (canvasRef.current.width !== w || canvasRef.current.height !== h) {
            canvasRef.current.width = w;
            canvasRef.current.height = h;
          }
          clearCanvas(ctx, w, h);
          if (results.multiFaceLandmarks?.[0] && selectedCategory === 'glasses') {
            const pts = results.multiFaceLandmarks[0].map((l: { x: number; y: number }) => ({ x: l.x * w, y: l.y * h }));
            if (pts.length >= 468) drawGlassesOverlay(ctx, pts, { color: '#06b6d4', lineWidth: 6, fill: true, fillOpacity: 0.25 });
            setIsTracking(true);
          } else if ((results as unknown as { multiHandLandmarks?: { x: number; y: number }[][] }).multiHandLandmarks?.[0] && (selectedCategory === 'watch' || selectedCategory === 'jewelry')) {
            const landmarks = (results as unknown as { multiHandLandmarks: { x: number; y: number }[][] }).multiHandLandmarks[0];
            const wristPoints = [{ x: landmarks[0].x * w, y: landmarks[0].y * h }];
            drawWatchOverlay(ctx, wristPoints, { color: '#3B82F6', lineWidth: 4, fill: true, fillOpacity: 0.2 });
            setIsTracking(true);
          } else {
            setIsTracking(false);
          }
        });
        faceMeshRef.current = faceMesh;
      }
      if (!handsRef.current) {
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({ maxNumHands: 2, minDetectionConfidence: 0.3, minTrackingConfidence: 0.3 });
        handsRef.current = hands;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (!videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error('Élément vidéo indisponible.');
      }
      videoRef.current.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) return reject(new Error('Video element missing'));
        videoRef.current.onloadedmetadata = () => resolve();
        videoRef.current.onerror = () => reject(new Error('Video load failed'));
        videoRef.current.play().catch(reject);
      });
      if (videoRef.current && faceMeshRef.current) {
        const cam = new CameraUtils(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && faceMeshRef.current) await faceMeshRef.current.send({ image: videoRef.current });
            if (videoRef.current && handsRef.current) await handsRef.current.send({ image: videoRef.current });
            const now = performance.now();
            if (now - fpsLastRef.current > 0) {
              fpsCountRef.current.push(1000 / (now - fpsLastRef.current));
              if (fpsCountRef.current.length > 30) fpsCountRef.current.shift();
              setFps(Math.round(fpsCountRef.current.reduce((a, b) => a + b, 0) / fpsCountRef.current.length));
            }
            fpsLastRef.current = now;
          },
          width: 1280,
          height: 720,
        });
        cam.start();
        cameraRef.current = cam;
      }
      setIsCameraActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Accès caméra refusé.';
      setCameraError(msg);
      logger.error('Try-on camera error', { error: err });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch (_) {}
      cameraRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTracking(false);
    setFps(0);
  }, []);

  const takeScreenshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const c = document.createElement('canvas');
    c.width = videoRef.current.videoWidth;
    c.height = videoRef.current.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    ctx.drawImage(canvasRef.current, 0, 0);
    c.toBlob((blob) => {
      if (blob) {
        onScreenshotTaken?.(blob);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `luneo-tryon-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  }, [onScreenshotTaken]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  useEffect(() => {
    if (!preselectedProduct?.category) return;
    const cat = (preselectedProduct.category.toLowerCase() === 'eyewear' ? 'glasses' : preselectedProduct.category.toLowerCase()) as ProductCategory;
    if (['glasses', 'watch', 'jewelry'].includes(cat)) {
      onCategoryChange(cat);
      const first = AVAILABLE_MODELS[cat]?.[0];
      if (first) onModelChange(first);
    }
  }, [preselectedProduct?.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-1 space-y-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h3 className="font-semibold text-white mb-3">Catégorie</h3>
          <div className="space-y-2">
            {(['glasses', 'watch', 'jewelry'] as ProductCategory[]).map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => { onCategoryChange(cat); onModelChange(AVAILABLE_MODELS[cat][0]); }}
              >
                {cat === 'glasses' && <Eye className="w-4 h-4 mr-2" />}
                {cat === 'watch' && <Watch className="w-4 h-4 mr-2" />}
                {cat === 'jewelry' && <Sparkles className="w-4 h-4 mr-2" />}
                {cat === 'glasses' ? 'Lunettes' : cat === 'watch' ? 'Montres' : 'Bijoux'}
              </Button>
            ))}
          </div>
        </Card>
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h3 className="font-semibold text-white mb-3">Modèle</h3>
          <div className="space-y-2">
            {AVAILABLE_MODELS[selectedCategory].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onModelChange(m)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedModel.id === m.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </Card>
        {isCameraActive && (
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold text-white mb-3">Performance</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">FPS</span>
              <span className={fps >= 24 ? 'text-green-400' : 'text-yellow-400'}>{fps}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Tracking</span>
              <span className={isTracking ? 'text-green-400' : 'text-gray-500'}>{isTracking ? 'Actif' : '—'}</span>
            </div>
          </Card>
        )}
      </div>
      <div className="lg:col-span-3">
        <Card className="p-4 bg-gray-800/50 border-gray-700" ref={containerRef}>
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gray-900/90 z-10">
                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                <p className="text-white font-medium mb-1">Erreur caméra</p>
                <p className="text-sm text-gray-400 text-center">{cameraError}</p>
                <Button variant="outline" className="mt-4" onClick={() => { setCameraError(null); startCamera(); }}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
                </Button>
              </div>
            )}
            {!isCameraActive && !isLoading && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <Camera className="w-16 h-16 text-gray-500 mb-4" />
                <p className="text-white mb-2">Lancer la caméra pour l'essayage</p>
                <p className="text-sm text-gray-400 text-center mb-6">Positionnez votre {selectedCategory === 'watch' ? 'main' : 'visage'} face à la caméra.</p>
                <Button onClick={startCamera} className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" /> Démarrer
                </Button>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-10">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-3" />
                <p className="text-white">Initialisation caméra...</p>
              </div>
            )}
            {isCameraActive && (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-1 rounded bg-black/60 text-xs text-green-400">{fps} FPS</span>
                  {isTracking && <span className="px-2 py-1 rounded bg-black/60 text-xs text-green-400">Tracking actif</span>}
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <Button onClick={isCameraActive ? stopCamera : startCamera} variant={isCameraActive ? 'outline' : 'default'} size="sm">
              {isCameraActive ? <><Square className="w-4 h-4 mr-2" /> Arrêter</> : <><Play className="w-4 h-4 mr-2" /> Démarrer</>}
            </Button>
            <Button onClick={takeScreenshot} disabled={!isCameraActive} size="sm">
              <Camera className="w-4 h-4 mr-2" /> Screenshot
            </Button>
            <Button onClick={toggleFullscreen} variant="outline" size="sm">
              {isFullscreen ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
              {isFullscreen ? 'Quitter' : 'Plein écran'}
            </Button>
            <Button variant="outline" size="sm" disabled={!isCameraActive}>
              <Video className="w-4 h-4 mr-2" /> Changer caméra
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

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
        const withAr = Array.isArray(list) ? list.filter((p: ArProduct) => p.arEnabled !== false) : [];
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
        <p className="text-gray-400 text-sm">Activez l'AR sur vos produits pour les afficher ici.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((p) => (
        <Card key={p.id} className="p-4 bg-gray-800/50 border-gray-700 overflow-hidden">
          <div className="aspect-square bg-gray-700 rounded-lg mb-3 relative overflow-hidden">
            {(p.image_url || p.imageUrl) ? (
              <img src={p.image_url || p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-green-500/80 text-xs text-white">
              {p.arEnabled !== false ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
              AR {p.arEnabled !== false ? 'activé' : 'désactivé'}
            </div>
          </div>
          <h4 className="font-medium text-white truncate">{p.name}</h4>
          <p className="text-xs text-gray-400 mb-3">{p.category ?? '—'}</p>
          <Button size="sm" className="w-full" onClick={() => onTryProduct(p)}>
            <ExternalLink className="w-4 h-4 mr-2" /> Essayer ce produit
          </Button>
        </Card>
      ))}
    </div>
  );
}

function CapturesTab({ screenshots, onRemove }: { screenshots: TryOnScreenshot[]; onRemove: (id: string) => void }) {
  const { t } = useI18n();
  const [preview, setPreview] = useState<string | null>(null);

  if (screenshots.length === 0) {
    return (
      <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
        <ImageIcon className="w-14 h-14 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Aucune capture</h3>
        <p className="text-gray-400 text-sm">Prenez des screenshots depuis l'onglet Essayage pour les retrouver ici.</p>
      </Card>
    );
  }

  const handleDownload = (s: TryOnScreenshot) => {
    const a = document.createElement('a');
    a.href = s.dataUrl;
    a.download = `luneo-capture-${s.timestamp}.png`;
    a.click();
  };

  const handleShare = async (s: TryOnScreenshot) => {
    try {
      if (navigator.share) {
        const res = await fetch(s.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `capture-${s.timestamp}.png`, { type: 'image/png' });
        await navigator.share({ title: t('virtualTryOn.shareTitle'), files: [file] });
      } else {
        handleDownload(s);
      }
    } catch (err) {
      logger.error('Try-on share failed', { error: err });
      handleDownload(s);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {screenshots.map((s) => (
          <Card key={s.id} className="p-2 bg-gray-800/50 border-gray-700 overflow-hidden">
            <button type="button" className="w-full aspect-square rounded-lg overflow-hidden block" onClick={() => setPreview(s.dataUrl)}>
              <img src={s.dataUrl} alt="Capture" className="w-full h-full object-cover" />
            </button>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(s)}>
                <Download className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleShare(s)}>
                <Share2 className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function AnalyticsTab() {
  const { t } = useI18n();
  const [data, setData] = useState<TryOnAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/try-on/analytics', { credentials: 'include' }).catch(() => null);
        if (cancelled) return;
        if (res?.ok) {
          const raw = await res.json();
          // Map backend field names to frontend expectations
          setData({
            totalSessions: raw.totalSessions ?? 0,
            productsTried: raw.totalProductsTried ?? raw.productsTried ?? 0,
            screenshotsTaken: raw.totalScreenshots ?? raw.screenshotsTaken ?? 0,
            avgSessionDurationSeconds: raw.avgSessionDuration ?? raw.avgSessionDurationSeconds ?? 0,
            sessionsOverTime: raw.sessionsOverTime ?? [],
            topProducts: (raw.topProducts ?? []).map((p: { productName?: string; name?: string; tryCount?: number; count?: number }) => ({
              name: p.productName ?? p.name ?? 'Unknown',
              count: p.tryCount ?? p.count ?? 0,
            })),
            conversionRate: raw.conversionRate ?? 0,
            categoryBreakdown: raw.categoryBreakdown ?? [],
          });
          setError(null);
        } else {
          setData({
            totalSessions: 0,
            productsTried: 0,
            screenshotsTaken: 0,
            avgSessionDurationSeconds: 0,
            sessionsOverTime: [],
            topProducts: [],
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('common.error'));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
        <Card className="p-6 bg-gray-800/50 border-gray-700 animate-pulse">
          <div className="h-64 bg-gray-700 rounded" />
        </Card>
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
          <p className="text-2xl font-bold text-white">{stats.avgSessionDurationSeconds ? `${Math.round(stats.avgSessionDurationSeconds)}s` : '—'}</p>
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

function VirtualTryOnPageContent() {
  const [activeTab, setActiveTab] = useState('essayage');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('glasses');
  const [selectedModel, setSelectedModel] = useState<Model>(AVAILABLE_MODELS.glasses[0]);
  const [preselectedProduct, setPreselectedProduct] = useState<ArProduct | null>(null);
  const [screenshots, setScreenshots] = useState<TryOnScreenshot[]>([]);

  const handleTryProduct = useCallback((p: ArProduct) => {
    setPreselectedProduct(p);
    setActiveTab('essayage');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Virtual Try-On</h1>
          <p className="text-base sm:text-lg text-gray-300">Essayez vos produits en réalité augmentée</p>
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
            <TryOnTab
              selectedCategory={selectedCategory}
              selectedModel={selectedModel}
              onCategoryChange={setSelectedCategory}
              onModelChange={setSelectedModel}
              preselectedProduct={preselectedProduct}
              onScreenshotTaken={(blob) => {
                const reader = new FileReader();
                reader.onload = () => {
                  setScreenshots((prev) => [
                    ...prev,
                    { id: `s-${Date.now()}`, dataUrl: reader.result as string, timestamp: Date.now() },
                  ]);
                };
                reader.readAsDataURL(blob);
              }}
            />
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <MyArProductsTab onTryProduct={handleTryProduct} />
          </TabsContent>

          <TabsContent value="captures" className="mt-4">
            <CapturesTab screenshots={screenshots} onRemove={(id) => setScreenshots((s) => s.filter((x) => x.id !== id))} />
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
              description="Le Virtual Try-On est disponible à partir du plan Professional."
            />
          </div>
        }
      >
        <MemoizedContent />
      </PlanGate>
    </ErrorBoundary>
  );
}
