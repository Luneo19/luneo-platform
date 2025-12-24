/**
 * Démo Interactive - AR Export
 * Page publique pour démontrer AR iOS/Android/Web
 */
'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { demoButtonClasses, demoCardClasses, demoGridClasses, demoSectionClasses, demoTextClasses } from '@/lib/utils/demo-classes';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle,
    Code,
    Monitor,
    Smartphone,
    Tablet,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { memo, useState } from 'react';
function ARExportDemoPageContent() {
  const [activeTab, setActiveTab] = useState<'platforms' | 'code' | 'features'>(
    'platforms'
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {' '}
      {/* Hero */}{' '}
      <section className={demoSectionClasses.hero}>
        {' '}
        <div className="absolute inset-0 opacity-20">
          {' '}
          <div className="grid h-full w-full grid-cols-12 grid-rows-8">
            {' '}
            {Array.from({ length: 96 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse border border-purple-500/20"
                style={{
                  animationDelay: `${(i * 0.1) % 3}s`,
                  animationDuration: '3s',
                }}
              />
            ))}{' '}
          </div>{' '}
        </div>{' '}
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 md:px-8 lg:px-12">
          {' '}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {' '}
            <span className="mb-6 inline-block rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white">
              {' '}
              🌍 AR Multi-Plateforme{' '}
            </span>{' '}
            <h1 className="mb-6 text-5xl font-bold min-[480px]:text-2xl min-[480px]:text-2xl min-[480px]:text-3xl min-[480px]:text-lg min-[480px]:text-lg min-[480px]:text-lg min-[480px]:text-lg min-[480px]:text-xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-3xl sm:text-3xl sm:text-3xl sm:text-4xl sm:text-4xl sm:text-4xl sm:text-4xl sm:text-lg sm:text-lg sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-3xl md:text-3xl md:text-3xl md:text-3xl md:text-3xl md:text-3xl md:text-4xl md:text-4xl md:text-4xl md:text-4xl md:text-5xl md:text-5xl md:text-base md:text-lg md:text-lg md:text-lg md:text-xl md:text-xl md:text-xl lg:text-2xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-4xl lg:text-4xl lg:text-4xl lg:text-5xl lg:text-5xl lg:text-6xl lg:text-base lg:text-base lg:text-lg lg:text-xl lg:text-xl xl:text-3xl xl:text-5xl xl:text-base xl:text-xl">
              {' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {' '}
                AR Export Complet{' '}
              </span>{' '}
              <br />{' '}
              <span className="text-white">iOS • Android • Web</span>{' '}
            </h1>{' '}
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-300">
              {' '}
              <strong className="text-white">1000+ lignes de code</strong> pour
              AR Quick Look, Scene Viewer & WebXR{' '}
            </p>{' '}
            <div className="flex flex-wrap justify-center gap-2 min-[480px]:gap-3 sm:gap-4 sm:gap-4 sm:gap-4 md:gap-3 md:gap-3 md:gap-6 lg:gap-4">
              {' '}
              <div className="flex flex-col gap-2 rounded-lg border border-blue-500/30 bg-blue-500/20 px-4 py-2 sm:flex-row sm:items-center sm:gap-2">
                {' '}
                <Smartphone className="h-5 w-5 text-blue-400" />{' '}
                <span className="font-semibold text-blue-400">
                  iOS USDZ
                </span>{' '}
              </div>{' '}
              <div className="flex flex-col gap-2 rounded-lg border border-green-500/30 bg-green-500/20 px-4 py-2 sm:flex-row sm:items-center sm:gap-2">
                {' '}
                <Tablet className="h-5 w-5 text-green-400" />{' '}
                <span className="font-semibold text-green-400">
                  Android GLB
                </span>{' '}
              </div>{' '}
              <div className="flex flex-col gap-2 rounded-lg border border-purple-500/30 bg-purple-500/20 px-4 py-2 sm:flex-row sm:items-center sm:gap-2">
                {' '}
                <Monitor className="h-5 w-5 text-purple-400" />{' '}
                <span className="font-semibold text-purple-400">
                  Web XR
                </span>{' '}
              </div>{' '}
            </div>{' '}
          </motion.div>{' '}
        </div>{' '}
      </section>{' '}
      {/* Tabs */}{' '}
      <section className={demoSectionClasses.content}>
        {' '}
        <div className="mb-8 flex flex-col gap-3 border-b border-gray-700 min-[480px]:gap-3 sm:flex-row sm:gap-2 sm:gap-4 sm:gap-4 sm:gap-4 md:gap-3 md:gap-3 md:gap-6 lg:gap-4">
          {' '}
          {[
            {
              id: 'platforms' as const,
              label: 'Plateformes',
              icon: Smartphone,
            },
            { id: 'code' as const, label: 'Code', icon: Code },
            { id: 'features' as const, label: 'Features', icon: Zap },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-6 py-3 font-semibold transition-all ${activeTab === tab.id ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
              >
                {' '}
                <Icon className="h-5 w-5" /> {tab.label}{' '}
              </button>
            );
          })}{' '}
        </div>{' '}
        {/* Platforms Tab */}{' '}
        {activeTab === 'platforms' && (
          <div className="grid gap-2 min-[480px]:grid-cols-2 min-[480px]:gap-3 sm:grid-cols-2 sm:grid-cols-2 sm:grid-cols-2 sm:gap-3 sm:gap-4 sm:gap-4 sm:gap-4 sm:gap-4 md:grid-cols-1 md:grid-cols-2 md:grid-cols-2 md:gap-3 md:gap-4 md:gap-6 md:gap-6 md:gap-6 lg:grid-cols-1 lg:grid-cols-1 lg:grid-cols-1 lg:grid-cols-1 lg:grid-cols-3 lg:gap-2 lg:gap-3 lg:gap-3">
            {' '}
            {/* iOS */}{' '}
            <Card className={`${demoCardClasses.gradient} border-blue-500/30`}>
              {' '}
              <Smartphone className="mb-4 h-10 w-10 text-blue-500 sm:h-12 sm:w-12" />{' '}
              <h3 className="mb-3 text-lg font-bold text-white min-[480px]:text-lg sm:text-xl sm:text-xl sm:text-xl md:text-2xl md:text-base md:text-lg">
                iOS AR Quick Look
              </h3>{' '}
              <p className="mb-6 text-gray-400">
                {' '}
                USDZ natif avec conversion automatique GLB→USDZ{' '}
              </p>{' '}
              <div className="space-y-3 text-sm">
                {' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>Format USDZ optimisé</span>{' '}
                </div>{' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>AR Quick Look lanceur</span>{' '}
                </div>{' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>Shadows temps réel</span>{' '}
                </div>{' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>Surface detection</span>{' '}
                </div>{' '}
              </div>{' '}
              <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                {' '}
                <p className="font-mono text-xs text-gray-400">
                  ARQuickLook.ts (250 lignes)
                </p>{' '}
              </div>{' '}
            </Card>{' '}
            {/* Android */}{' '}
            <Card className="border-green-500/30 bg-gradient-to-br from-green-900/20 to-green-900/5 p-6">
              {' '}
              <Tablet className="mb-4 h-10 w-10 text-green-500 sm:h-12 sm:w-12" />{' '}
              <h3 className="mb-3 text-lg font-bold text-white min-[480px]:text-lg sm:text-xl sm:text-xl sm:text-xl md:text-2xl md:text-base md:text-lg">
                Android Scene Viewer
              </h3>{' '}
              <p className="mb-6 text-gray-400">
                {' '}
                Intent URL pour Scene Viewer Google avec GLB natif{' '}
              </p>{' '}
              <div className="space-y-3 text-sm">
                {' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>Format GLB optimisé</span>{' '}
                </div>{' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>Deep link configuré</span>{' '}
                </div>{' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>Lighting estimation</span>{' '}
                </div>{' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>Placement AR</span>{' '}
                </div>{' '}
              </div>{' '}
              <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                {' '}
                <p className="font-mono text-xs text-gray-400">
                  SceneViewer.ts (230 lignes)
                </p>{' '}
              </div>{' '}
            </Card>{' '}
            {/* Web */}{' '}
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-purple-900/5 p-6">
              {' '}
              <Monitor className="mb-4 h-10 w-10 text-purple-500 sm:h-12 sm:w-12" />{' '}
              <h3 className="mb-3 text-lg font-bold text-white min-[480px]:text-lg sm:text-xl sm:text-xl sm:text-xl md:text-2xl md:text-base md:text-lg">
                WebXR Browser
              </h3>{' '}
              <p className="mb-6 text-gray-400">
                {' '}
                AR dans le navigateur avec WebXR API (Chrome/Edge){' '}
              </p>{' '}
              <div className="space-y-3 text-sm">
                {' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>WebXR API implementation</span>{' '}
                </div>{' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>Hit test (surface detect)</span>{' '}
                </div>{' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>Reticle placement</span>{' '}
                </div>{' '}
                <div className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2">
                  {' '}
                  <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                  <span>Tap to place</span>{' '}
                </div>{' '}
              </div>{' '}
              <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                {' '}
                <p className="font-mono text-xs text-gray-400">
                  WebXRViewer.ts (230 lignes)
                </p>{' '}
              </div>{' '}
            </Card>{' '}
          </div>
        )}{' '}
        {/* Code Tab */}{' '}
        {activeTab === 'code' && (
          <Card className={demoCardClasses.default}>
            {' '}
            <h2 className={demoTextClasses.h2}>
              Code Réel
            </h2>{' '}
            {/* Auto platform detection */}{' '}
            <div className="mb-8">
              {' '}
              <h3 className="mb-4 text-xl font-semibold text-white">
                Auto Platform Detection
              </h3>{' '}
              <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 p-6">
                {' '}
                <pre className="text-gray-300overflow-x-autooverflow-x-auto text-sm">
                  {' '}
                  <code>{`// import { launchAR, checkARSupport } from '@luneo/ar-export';
// Note: Package disponible dans le monorepo packages/ar-export // Check support
const support = checkARSupport();
// {
// platform: 'ios',
// arSupported: true,
// arType: 'ar-quick-look'
// } // Launch AR (auto iOS/Android/Web)
await launchAR({ glbUrl: '/models/product.glb', usdzUrl: '/models/product.usdz', productName: 'Sunglasses Pro', fallbackUrl: '/products/sunglasses'
}); // → Lance AR Quick Look sur iOS
// → Lance Scene Viewer sur Android // → Lance WebXR sur Chrome desktop
// → Fallback vers URL si pas supporté`}</code>{' '}
                </pre>{' '}
              </div>{' '}
            </div>{' '}
            {/* USDZ Conversion */}{' '}
            <div>
              {' '}
              <h3 className="mb-4 text-xl font-semibold text-white">
                GLB → USDZ Conversion Automatique
              </h3>{' '}
              <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 p-6">
                {' '}
                <pre className="text-gray-300overflow-x-autooverflow-x-auto text-sm">
                  {' '}
                  <code>{`// Frontend call
const response = await fetch('/api/ar/convert-usdz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ glb_url: '/models/product.glb', product_name: 'Watch Classic', scale: 1.0, ar_model_id: 'model-123' })
}); const { usdz_url } = await response.json();
// → 'https://storage.luneo.app/models/product.usdz' // Backend API (route.ts - 180 lignes)
export async function POST(request: NextRequest) { // Check cache first const existing = await checkCache(ar_model_id); if (existing?.usdz_url) return existing; // Convert via external API const conversionResponse = await fetch(CONVERSION_API, { method: 'POST', body: JSON.stringify({ glb_url, scale, ... }) }); const { usdz_url } = await conversionResponse.json(); // Save to database await supabase.from('ar_models').update({ usdz_url }); return { success: true, usdz_url };
}`}</code>{' '}
                </pre>{' '}
              </div>{' '}
            </div>{' '}
          </Card>
        )}{' '}
        {/* Features Tab */}{' '}
        {activeTab === 'features' && (
          <Card className={demoCardClasses.default}>
            {' '}
            <h2 className={demoTextClasses.h2}>
              Features Complètes
            </h2>{' '}
            <div className={demoGridClasses.twoCols}>
              {' '}
              {[
                {
                  title: 'Auto Platform Detection',
                  description:
                    "Détecte iOS/Android/Desktop et lance l'AR approprié",
                  items: [
                    'iOS Safari → AR Quick Look',
                    'Android Chrome → Scene Viewer',
                    'Desktop Chrome → WebXR',
                  ],
                },
                {
                  title: 'GLB→USDZ Conversion',
                  description: 'Conversion automatique pour support iOS',
                  items: [
                    'API backend',
                    'Cache intelligent',
                    'Batch conversion',
                  ],
                },
                {
                  title: 'Analytics Tracking',
                  description: 'Track AR launches pour analytics',
                  items: [
                    'Platform detection',
                    'Launch success rate',
                    'User behavior',
                  ],
                },
                {
                  title: 'Fallback Gracieux',
                  description: 'Si AR pas supporté, fallback intelligent',
                  items: [
                    'Redirect vers page produit',
                    'Message user-friendly',
                    'Alternative 3D viewer',
                  ],
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-700 bg-gray-900/50 p-6"
                >
                  {' '}
                  <h4 className="mb-2 text-lg font-bold text-white">
                    {feature.title}
                  </h4>{' '}
                  <p className="mb-4 text-sm text-gray-400">
                    {feature.description}
                  </p>{' '}
                  <div className="space-y-2">
                    {' '}
                    {feature.items.map((item, j) => (
                      <div
                        key={j}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        {' '}
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />{' '}
                        <span>{item}</span>{' '}
                      </div>
                    ))}{' '}
                  </div>{' '}
                </div>
              ))}{' '}
            </div>{' '}
          </Card>
        )}{' '}
      </section>{' '}
      {/* CTA */}{' '}
      <section className={demoSectionClasses.cta}>
        {' '}
        <div className="mx-auto max-w-4xl px-4 text-center">
          {' '}
          <h2 className="mb-6 text-2xl font-bold text-white min-[480px]:text-lg min-[480px]:text-lg min-[480px]:text-lg sm:text-2xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-lg sm:text-lg sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-3xl md:text-3xl md:text-base md:text-base md:text-lg md:text-lg md:text-lg md:text-xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-4xl lg:text-base lg:text-xl lg:text-xl xl:text-xl">
            {' '}
            Testez AR sur votre appareil{' '}
          </h2>{' '}
          <p className="mb-8 text-xl text-purple-200">
            {' '}
            Compatible iOS, Android & Web{' '}
          </p>{' '}
          <div className="flex flex-col justify-center gap-3 min-[480px]:gap-3 sm:flex-row sm:gap-2 sm:gap-4 sm:gap-4 sm:gap-4 md:gap-3 md:gap-3 md:gap-6 lg:gap-4">
            {' '}
            <Link href="/register">
              {' '}
              <Button
                size="lg"
                className="bg-white font-bold text-purple-900 hover:bg-gray-100"
              >
                {' '}
                Commencer gratuitement{' '}
                <ArrowRight className="ml-2 h-5 w-5" />{' '}
              </Button>{' '}
            </Link>{' '}
            <Link href="/contact">
              {' '}
              <Button
                size="lg"
                className={demoButtonClasses.secondary}
              >
                {' '}
                Demander une démo{' '}
              </Button>{' '}
            </Link>{' '}
          </div>{' '}
        </div>{' '}
      </section>{' '}
    </div>
  );
}

const MemoizedARExportDemoPageContent = memo(ARExportDemoPageContent);

export default function ARExportDemoPage() {
  return (
    <ErrorBoundary level="page" componentName="ARExportDemoPage">
      <MemoizedARExportDemoPageContent />
    </ErrorBoundary>
  );
}
