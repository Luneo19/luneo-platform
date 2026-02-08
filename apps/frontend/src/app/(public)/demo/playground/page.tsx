/** * Playground Interactif - Test toutes les features * Page pour tester le code en direct */ 'use client';
import React, { useState, memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import Link from 'next/link';
import {
  Code,
  Play,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Copy,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
const CODE_EXAMPLES = {
  virtualTryOn: `// Virtual Try-On avec Face Tracking
// import { VirtualTryOn } from '@luneo/virtual-try-on';
// Note: Package disponible dans le monorepo packages/virtual-try-on const tryOn = new VirtualTryOn({ container: document.getElementById('try-on'), category: 'glasses', model3dUrl: '/models/sunglasses.glb', debug: true
}); // Events
tryOn.on('face:detected', (result) => { logger.info(\`Landmarks: \${result.landmarks.length}\`); // 468
}); // Init & Start
await tryOn.init();
await tryOn.start();`,
  arExport: `// AR Multi-Plateforme
// import { launchAR, checkARSupport } from '@luneo/ar-export';
// Note: Package disponible dans le monorepo packages/ar-export // Check support
const support = checkARSupport(); // { platform: 'ios', arSupported: true, arType: 'ar-quick-look' } // Launch AR
await launchAR({ glbUrl: '/models/product.glb', usdzUrl: '/models/product.usdz', productName: 'Sunglasses Pro'
});
// → AR Quick Look sur iOS
// → Scene Viewer sur Android
// → WebXR sur Web`,
  bulkGeneration: `// Bulk Generation 1000/h
import { BulkProcessor } from '@luneo/bulk-generator'; const processor = new BulkProcessor({ redis: { host: 'localhost', port: 6379 }, concurrency: 10, rateLimitPerMinute: 100
import { logger } from '@/lib/logger';
}); const jobId = await processor.createBulkJob({ basePrompt: 'Modern t-shirt design', variations: [...Array(1000).keys()].map(i => ({ id: \`v\${i}\`, modifiers: [\`color \${i % 10}\`, \`style \${i % 5}\`] }))
}); processor.on('job:progress', (id, progress) => { logger.info(\`\${progress.toFixed(1)}%\`);
});`,
  materials: `// Materials PBR
// import { MaterialsManager } from '@luneo/optimization';
// Note: Package disponible dans le monorepo packages/optimization const manager = new MaterialsManager(); // Load material (avec textures complètes)
const leather = await manager.loadMaterial('leather_black');
// Textures: Diffuse, Normal, Roughness, AO mesh.material = leather; // Change color
manager.setColor(leather, '#8B4513');`,
  textEngraving: `// Text 3D Engraving
// import { TextEngraver } from '@luneo/optimization';
// Note: Package disponible dans le monorepo packages/optimization const engraver = new TextEngraver();
await engraver.loadFont('helvetiker_bold'); const textMesh = await engraver.create3DText({ text: 'LUNEO', size: 0.5, depth: 0.1, color: '#FFD700', bevel: true
}); scene.add(textMesh);`,
  printExport: `// Print Export 300 DPI
// import { PrintExporter } from '@luneo/optimization';
// Note: Package disponible dans le monorepo packages/optimization const exporter = new PrintExporter(scene, camera, renderer); const pdf = await exporter.export({ resolution: [3840, 2160], // 4K dpi: 300, format: 'pdf', multiView: true, bleedMM: 3
}); const blob = new Blob([pdf.data]);
saveAs(blob, 'product.pdf');`,
};
function PlaygroundPageContent() {
  const [selectedExample, setSelectedExample] =
    useState<keyof typeof CODE_EXAMPLES>('virtualTryOn');
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[selectedExample]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {' '}
      {/* Hero */}{' '}
      <section className="border-b border-gray-800 py-8 min-[480px]:px-4 min-[480px]:py-6 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-12 lg:py-16">
        {' '}
        <div className="mx-auto max-w-7xl px-4 text-center min-[480px]:px-4 sm:px-6 md:px-8 lg:px-4">
          {' '}
          <motion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {' '}
            <span className="mb-6 inline-block rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white">
              {' '}
              🎮 Playground{' '}
            </span>{' '}
            <h1 className="mb-6 text-5xl font-bold min-[480px]:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl">
              {' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {' '}
                Testez le Code{' '}
              </span>{' '}
              <br />{' '}
              <span className="text-white">Exemples Interactifs</span>{' '}
            </h1>{' '}
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-300">
              {' '}
              Copiez-collez et testez les{' '}
              <strong className="text-white">6000+ lignes de code</strong>{' '}
              développées{' '}
            </p>{' '}
          </motion>{' '}
        </div>{' '}
      </section>{' '}
      {/* Playground */}{' '}
      <section className="mx-auto max-w-7xl px-4 py-6 min-[480px]:px-4 min-[480px]:py-6 sm:px-6 sm:py-8 md:px-8 md:py-12 lg:px-4 lg:py-12">
        {' '}
        <div className="grid gap-2 min-[480px]:grid-cols-2 min-[480px]:gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-3">
          {' '}
          {/* Sidebar - Sélection */}{' '}
          <div>
            {' '}
            <Card className="border-gray-700 bg-gray-800/50 p-6">
              {' '}
              <h3 className="mb-4 font-semibold text-white">Exemples</h3>{' '}
              <div className="space-y-2">
                {' '}
                {[
                  {
                    id: 'virtualTryOn',
                    label: 'Virtual Try-On',
                    lines: '3500+',
                  },
                  { id: 'arExport', label: 'AR Export', lines: '1000+' },
                  {
                    id: 'bulkGeneration',
                    label: 'Bulk Generation',
                    lines: '280',
                  },
                  { id: 'materials', label: 'Materials PBR', lines: '280' },
                  { id: 'textEngraving', label: 'Text 3D', lines: '310' },
                  { id: 'printExport', label: 'Print Export', lines: '340' },
                ].map(example => (
                  <button
                    key={example.id}
                    onClick={() => setSelectedExample(example.id as keyof typeof CODE_EXAMPLES)}
                    className={`w-full rounded-lg p-3 text-left transition-all ${selectedExample === example.id ? 'bg-purple-600 text-white' : 'bg-gray-900/50 text-gray-300 hover:bg-gray-900'}`}
                  >
                    {' '}
                    <div className="font-medium">{example.label}</div>{' '}
                    <div className="text-xs opacity-75">
                      {example.lines} lignes
                    </div>{' '}
                  </button>
                ))}{' '}
              </div>{' '}
            </Card>{' '}
            <Card className="mt-6 border-gray-700 bg-gray-800/50 p-6">
              {' '}
              <h3 className="mb-4 font-semibold text-white">
                Liens Utiles
              </h3>{' '}
              <div className="space-y-2 text-sm">
                {' '}
                <Link
                  href="/help/documentation"
                  className="block p-2 text-blue-400 hover:underline"
                >
                  {' '}
                  📖 Documentation complète{' '}
                </Link>{' '}
                <Link
                  href="/demo/virtual-try-on"
                  className="block p-2 text-purple-400 hover:underline"
                >
                  {' '}
                  🎬 Démo Virtual Try-On{' '}
                </Link>{' '}
                <Link
                  href="/demo/ar-export"
                  className="block p-2 text-green-400 hover:underline"
                >
                  {' '}
                  🌍 Démo AR Export{' '}
                </Link>{' '}
                <Link
                  href="/demo/bulk-generation"
                  className="block p-2 text-orange-400 hover:underline"
                >
                  {' '}
                  ⚡ Démo Bulk Generation{' '}
                </Link>{' '}
              </div>{' '}
            </Card>{' '}
          </div>{' '}
          {/* Main - Code */}{' '}
          <div className="lg:col-span-2">
            {' '}
            <Card className="border-gray-700 bg-gray-800/50 p-6">
              {' '}
              <div className="mb-4 flex flex-col items-center justify-start gap-3 sm:flex-row sm:justify-between sm:gap-0">
                {' '}
                <h3 className="text-xl font-bold text-white">
                  Code Example
                </h3>{' '}
                <div className="flex gap-2">
                  {' '}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className={`${copied ? 'bg-green-500 text-white' : ''}`}
                  >
                    {' '}
                    {copied ? (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}{' '}
                    {copied ? 'Copié !' : 'Copier'}{' '}
                  </Button>{' '}
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {' '}
                    <Play className="mr-2 h-4 w-4" /> Tester{' '}
                  </Button>{' '}
                </div>{' '}
              </div>{' '}
              <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 p-6">
                {' '}
                <pre className="overflow-x-auto text-sm text-gray-300">
                  {' '}
                  <code>{CODE_EXAMPLES[selectedExample]}</code>{' '}
                </pre>{' '}
              </div>{' '}
              {/* Info */}{' '}
              <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-900/20 p-4">
                {' '}
                <div className="flex items-start gap-3">
                  {' '}
                  <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />{' '}
                  <div className="text-sm text-blue-200">
                    {' '}
                    <p className="mb-1 font-semibold">
                      Code production-ready !
                    </p>{' '}
                    <p>
                      Ce code est utilisable tel quel dans votre projet.
                      Installez le package et commencez !
                    </p>{' '}
                  </div>{' '}
                </div>{' '}
              </div>{' '}
            </Card>{' '}
            {/* Installation */}{' '}
            <Card className="mt-6 border-gray-700 bg-gray-800/50 p-6">
              {' '}
              <h3 className="mb-4 text-xl font-bold text-white">
                Installation
              </h3>{' '}
              <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                {' '}
                <pre className="overflow-x-auto text-sm text-green-400">
                  {' '}
                  <code>{`npm install @luneo/virtual-try-on
# npm install @luneo/ar-export
# npm install @luneo/optimization
# Note: Packages disponibles dans le monorepo packages/*
npm install @luneo/bulk-generator`}</code>{' '}
                </pre>{' '}
              </div>{' '}
              <p className="mt-4 text-sm text-gray-400">
                {' '}
                Packages disponibles dans le monorepo{' '}
                <code className="text-purple-400">packages/*</code>{' '}
              </p>{' '}
            </Card>{' '}
          </div>{' '}
        </div>{' '}
      </section>{' '}
      {/* CTA */}{' '}
      <section className="bg-gradient-to-r from-purple-900 to-pink-900 py-8 min-[480px]:px-4 min-[480px]:py-6 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-12 lg:py-16">
        {' '}
        <div className="mx-auto max-w-4xl px-4 text-center">
          {' '}
          <h2 className="mb-6 text-2xl font-bold text-white min-[480px]:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-xl">
            {' '}
            Accédez au code complet{' '}
          </h2>{' '}
          <p className="mb-8 text-xl text-purple-200">
            {' '}
            6000+ lignes disponibles dans votre compte{' '}
          </p>{' '}
          <div className="flex flex-col justify-center gap-3 min-[480px]:gap-3 sm:flex-row sm:gap-4 md:gap-6 lg:gap-4">
            {' '}
            <Link href="/register">
              {' '}
              <Button
                size="lg"
                className="bg-white font-bold text-purple-900 hover:bg-gray-100"
              >
                {' '}
                Créer un compte <ArrowRight className="ml-2 h-5 w-5" />{' '}
              </Button>{' '}
            </Link>{' '}
            <Link href="/help/documentation">
              {' '}
              <Button
                size="lg"
                className="border-2 border-white/30 bg-white/10 font-semibold text-white hover:bg-white/20"
              >
                {' '}
                <Code className="mr-2 h-5 w-5" /> Documentation{' '}
              </Button>{' '}
            </Link>{' '}
          </div>{' '}
        </div>{' '}
      </section>{' '}
    </div>
  );
}

const MemoizedPlaygroundPageContent = memo(PlaygroundPageContent);

export default function PlaygroundPage() {
  return (
    <ErrorBoundary level="page" componentName="PlaygroundPage">
      <MemoizedPlaygroundPageContent />
    </ErrorBoundary>
  );
}
