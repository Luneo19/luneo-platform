/** * Démo Interactive - 3D Configurator Pro * Materials PBR + Text 3D + Print Export */ 'use client';
import React, { useState, memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import Link from 'next/link';
import {
  Palette,
  Type,
  Printer,
  CheckCircle,
  ArrowRight,
  Box,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
function Configurator3DDemoPageContent() {
  const [activeTab, setActiveTab] = useState<'materials' | 'text' | 'export'>(
    'materials'
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-orange-900">
      {' '}
      {/* Hero */}{' '}
      <section className="relative overflow-x-auto overflow-y-hidden border-b border-gray-800 py-8 min-[480px]:px-4 min-[480px]:py-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:py-10 sm:py-12 sm:py-12 sm:py-12 sm:py-12 sm:py-8 sm:py-8 sm:py-8 sm:py-8 sm:py-8 sm:py-8 sm:py-8 md:px-12 md:px-3 md:px-4 md:px-4 md:px-4 md:px-4 md:px-4 md:px-8 md:py-12 md:py-12 md:py-12 md:py-16 md:py-16 md:py-20 md:py-4 md:py-6 md:py-6 md:py-6 lg:px-12 lg:py-12 lg:py-16 lg:py-16 lg:py-16 lg:py-6 lg:py-6 lg:py-8">
        {' '}
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center min-[480px]:px-4 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 md:px-3 md:px-4 md:px-4 md:px-4 md:px-8 md:px-8 md:px-8 lg:px-4 lg:px-4">
          {' '}
          <motion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {' '}
            <span className="mb-6 inline-block rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2 text-sm font-semibold text-white">
              {' '}
              🎨 3D Professionnel{' '}
            </span>{' '}
            <h1 className="mb-6 text-5xl font-bold min-[480px]:text-2xl min-[480px]:text-2xl min-[480px]:text-3xl min-[480px]:text-lg min-[480px]:text-lg min-[480px]:text-lg min-[480px]:text-lg min-[480px]:text-xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-3xl sm:text-3xl sm:text-3xl sm:text-4xl sm:text-4xl sm:text-4xl sm:text-4xl sm:text-lg sm:text-lg sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-3xl md:text-3xl md:text-3xl md:text-3xl md:text-3xl md:text-3xl md:text-4xl md:text-4xl md:text-4xl md:text-4xl md:text-5xl md:text-5xl md:text-base md:text-lg md:text-lg md:text-lg md:text-xl md:text-xl md:text-xl lg:text-2xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-4xl lg:text-4xl lg:text-4xl lg:text-5xl lg:text-5xl lg:text-6xl lg:text-base lg:text-base lg:text-lg lg:text-xl lg:text-xl xl:text-3xl xl:text-5xl xl:text-base xl:text-xl">
              {' '}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {' '}
                Configurator 3D Pro{' '}
              </span>{' '}
              <br />{' '}
              <span className="text-white">Materials • Text • Print</span>{' '}
            </h1>{' '}
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-300">
              {' '}
              <strong className="text-white">1500+ lignes</strong> pour
              materials PBR, text 3D & export 300 DPI{' '}
            </p>{' '}
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[480px]:gap-3 sm:grid-cols-2 sm:grid-cols-2 sm:grid-cols-2 sm:gap-3 sm:gap-4 sm:gap-4 sm:gap-4 sm:gap-4 sm:gap-4 sm:gap-4 md:grid-cols-2 md:grid-cols-2 md:gap-2 md:gap-3 md:gap-3 md:gap-4 md:gap-6 md:gap-6 md:gap-6 lg:grid-cols-1 lg:grid-cols-1 lg:grid-cols-1 lg:grid-cols-1 lg:grid-cols-3 lg:gap-2 lg:gap-3 lg:gap-3">
              {' '}
              {[
                {
                  value: '5',
                  label: 'Materials PBR',
                  sublabel: 'Leather, Fabric, Metal...',
                },
                {
                  value: '8',
                  label: 'Fonts 3D',
                  sublabel: 'Helvetiker, Optimer...',
                },
                { value: '300', label: 'DPI Print', sublabel: '4K/8K Ready' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  {' '}
                  <div className="mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-2xl font-bold text-transparent min-[480px]:text-lg min-[480px]:text-lg min-[480px]:text-lg sm:text-2xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-lg sm:text-lg sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-3xl md:text-3xl md:text-base md:text-base md:text-lg md:text-lg md:text-lg md:text-xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-4xl lg:text-base lg:text-xl lg:text-xl xl:text-xl">
                    {' '}
                    {stat.value}{' '}
                  </div>{' '}
                  <div className="text-sm text-gray-300">{stat.label}</div>{' '}
                  <div className="text-xs text-gray-400">
                    {stat.sublabel}
                  </div>{' '}
                </div>
              ))}{' '}
            </div>{' '}
          </motion>{' '}
        </div>{' '}
      </section>{' '}
      {/* Tabs */}{' '}
      <section className="mx-auto max-w-7xl px-4 py-6 min-[480px]:px-4 min-[480px]:py-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:py-8 sm:py-8 md:px-3 md:px-4 md:px-4 md:px-4 md:px-8 md:px-8 md:px-8 md:py-12 md:py-4 lg:px-4 lg:px-4 lg:py-12">
        {' '}
        <div className="mb-8 flex flex-col gap-3 border-b border-gray-700 min-[480px]:gap-3 sm:flex-row sm:gap-2 sm:gap-4 sm:gap-4 sm:gap-4 md:gap-3 md:gap-3 md:gap-6 lg:gap-4">
          {' '}
          {[
            { id: 'materials' as const, label: 'Materials PBR', icon: Palette },
            { id: 'text' as const, label: 'Text 3D', icon: Type },
            { id: 'export' as const, label: 'Print Export', icon: Printer },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-6 py-3 font-semibold transition-all ${activeTab === tab.id ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
              >
                {' '}
                <Icon className="h-5 w-5" /> {tab.label}{' '}
              </button>
            );
          })}{' '}
        </div>{' '}
        {/* Materials Tab */}{' '}
        {activeTab === 'materials' && (
          <Card className="border-gray-700 bg-gray-800/50 p-4 sm:p-6 sm:p-6 md:p-4 md:p-8">
            {' '}
            <h2 className="mb-6 text-xl font-bold text-white min-[480px]:text-lg min-[480px]:text-lg sm:text-2xl sm:text-lg sm:text-lg sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-base md:text-base md:text-lg md:text-xl lg:text-3xl lg:text-lg lg:text-lg lg:text-xl">
              Materials PBR (MaterialsManager.ts - 280 lignes)
            </h2>{' '}
            {/* Code Example */}{' '}
            <div className="mb-8 overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 p-6">
              {' '}
              <pre className="text-gray-300overflow-x-autooverflow-x-auto text-sm">
                {' '}
                <code>{`// import { MaterialsManager } from '@luneo/optimization';
// Note: Package disponible dans le monorepo packages/optimization const manager = new MaterialsManager(); // 5 presets disponibles:
// - leather_black
// - fabric_cotton
// - metal_brushed
// - wood_oak
// - plastic_matte // Charger material avec textures PBR complètes
const leather = await manager.loadMaterial('leather_black'); // PBR Texture Set:
// ✅ Diffuse/Albedo map
// ✅ Normal map
// ✅ Roughness map
// ✅ Metalness map (pour metal)
// ✅ AO (Ambient Occlusion) map
// ✅ Displacement map (optionnel) // Appliquer au mesh
mesh.material = leather; // Changer couleur (garde les textures)
manager.setColor(leather, '#8B4513'); // Brown leather // Appliquer à tous les meshes d'un objet
manager.applyToObject(productModel, leather);`}</code>{' '}
              </pre>{' '}
            </div>{' '}
            {/* Material Previews */}{' '}
            <div className="grid gap-2 min-[480px]:gap-3 sm:grid-cols-1 sm:grid-cols-2 sm:grid-cols-2 sm:grid-cols-3 sm:gap-4 sm:gap-4 sm:gap-4 md:grid-cols-1 md:grid-cols-2 md:grid-cols-3 md:grid-cols-4 md:gap-3 md:gap-3 md:gap-6 lg:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4 lg:grid-cols-5 lg:gap-4">
              {' '}
              {[
                {
                  name: 'Leather',
                  color: 'from-amber-800 to-amber-900',
                  textures: 'Diffuse, Normal, Roughness, AO',
                },
                {
                  name: 'Fabric',
                  color: 'from-blue-700 to-blue-800',
                  textures: 'Diffuse, Normal, Roughness',
                },
                {
                  name: 'Metal',
                  color: 'from-gray-400 to-gray-600',
                  textures: 'Diffuse, Normal, Roughness, Metalness',
                },
                {
                  name: 'Wood',
                  color: 'from-orange-800 to-orange-900',
                  textures: 'Diffuse, Normal, Roughness, AO',
                },
                {
                  name: 'Plastic',
                  color: 'from-red-600 to-red-700',
                  textures: 'Diffuse, Roughness',
                },
              ].map((mat, i) => (
                <div key={i} className="text-center">
                  {' '}
                  <div
                    className={`h-32 w-full bg-gradient-to-br ${mat.color} mb-3 rounded-lg border-2 border-gray-700`}
                  />{' '}
                  <h4 className="mb-1 font-semibold text-white">{mat.name}</h4>{' '}
                  <p className="text-xs text-gray-400">{mat.textures}</p>{' '}
                </div>
              ))}{' '}
            </div>{' '}
          </Card>
        )}{' '}
        {/* Text Tab */}{' '}
        {activeTab === 'text' && (
          <Card className="border-gray-700 bg-gray-800/50 p-4 sm:p-6 sm:p-6 md:p-4 md:p-8">
            {' '}
            <h2 className="mb-6 text-xl font-bold text-white min-[480px]:text-lg min-[480px]:text-lg sm:text-2xl sm:text-lg sm:text-lg sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-base md:text-base md:text-lg md:text-xl lg:text-3xl lg:text-lg lg:text-lg lg:text-xl">
              Text 3D Engraving (TextEngraver.ts - 310 lignes)
            </h2>{' '}
            <div className="mb-8 overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 p-6">
              {' '}
              <pre className="text-gray-300overflow-x-autooverflow-x-auto text-sm">
                {' '}
                <code>{`// import { TextEngraver } from '@luneo/optimization';
// Note: Package disponible dans le monorepo packages/optimization const engraver = new TextEngraver(); // Charger font
await engraver.loadFont('helvetiker_bold'); // 8 fonts disponibles:
// - helvetiker, helvetiker_bold
// - optimer, optimer_bold
// - gentilis, gentilis_bold
// - droid_sans, droid_sans_bold // Créer texte 3D avec options avancées
const textMesh = await engraver.create3DText({ text: 'LUNEO', fontName: 'helvetiker_bold', size: 0.5, // Taille depth: 0.1, // Profondeur (extrusion) color: '#FFD700', // Or bevel: true, // Bevel activé bevelThickness: 0.02, // Épaisseur bevel bevelSize: 0.01, // Taille bevel curveSegments: 12 // Qualité courbes
}); scene.add(textMesh); // Placer sur une surface
engraver.placeOnSurface( textMesh, productSurface, new THREE.Vector2(0.5, 0.5), // Position 2D camera
); // Curved text (follow curve)
const curvedText = engraver.createCurvedText( { text: 'FOLLOW THE CURVE', size: 0.3 }, curvePath
);`}</code>{' '}
              </pre>{' '}
            </div>{' '}
            <div className="grid gap-2 min-[480px]:grid-cols-2 min-[480px]:gap-3 sm:gap-3 sm:gap-4 sm:gap-4 sm:gap-4 sm:gap-4 md:grid-cols-1 md:grid-cols-1 md:grid-cols-1 md:gap-3 md:gap-4 md:gap-6 md:gap-6 md:gap-6 lg:gap-2 lg:gap-3 lg:gap-3">
              {' '}
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-6">
                {' '}
                <Type className="mb-4 h-10 w-10 text-orange-500 sm:h-12 sm:w-12" />{' '}
                <h4 className="mb-2 text-lg font-bold text-white">
                  3D Geometry
                </h4>{' '}
                <div className="space-y-2 text-sm text-gray-300">
                  {' '}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    {' '}
                    <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                    <span>TextGeometry Three.js</span>{' '}
                  </div>{' '}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    {' '}
                    <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                    <span>Bevel & extrude</span>{' '}
                  </div>{' '}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    {' '}
                    <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                    <span>Auto-centering</span>{' '}
                  </div>{' '}
                </div>{' '}
              </div>{' '}
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-6">
                {' '}
                <Box className="mb-4 h-10 w-10 text-blue-500 sm:h-12 sm:w-12" />{' '}
                <h4 className="mb-2 text-lg font-bold text-white">
                  Surface Placement
                </h4>{' '}
                <div className="space-y-2 text-sm text-gray-300">
                  {' '}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    {' '}
                    <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                    <span>Raycasting précis</span>{' '}
                  </div>{' '}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    {' '}
                    <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                    <span>Normal orientation</span>{' '}
                  </div>{' '}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    {' '}
                    <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                    <span>Curved text support</span>{' '}
                  </div>{' '}
                </div>{' '}
              </div>{' '}
            </div>{' '}
          </Card>
        )}{' '}
        {/* Export Tab */}{' '}
        {activeTab === 'export' && (
          <Card className="border-gray-700 bg-gray-800/50 p-4 sm:p-6 sm:p-6 md:p-4 md:p-8">
            {' '}
            <h2 className="mb-6 text-xl font-bold text-white min-[480px]:text-lg min-[480px]:text-lg sm:text-2xl sm:text-lg sm:text-lg sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-base md:text-base md:text-lg md:text-xl lg:text-3xl lg:text-lg lg:text-lg lg:text-xl">
              Print Export Pro (PrintExporter.ts - 340 lignes)
            </h2>{' '}
            <div className="mb-8 overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 p-6">
              {' '}
              <pre className="text-gray-300overflow-x-autooverflow-x-auto text-sm">
                {' '}
                <code>{`// import { PrintExporter } from '@luneo/optimization';
// Note: Package disponible dans le monorepo packages/optimization const exporter = new PrintExporter(scene, camera, renderer); // Export en 4K @ 300 DPI
const result = await exporter.export({ resolution: [3840, 2160], // 4K dpi: 300, // Print quality format: 'pdf', // PDF multi-vues quality: 1.0, // Max quality multiView: true, // 6 vues (front, back, left, right, top, bottom) bleedMM: 3, // Bleed zone 3mm colorProfile: 'sRGB' // ou 'CMYK' pour print
}); // Résultat:
// {
// format: 'pdf',
// data: Uint8Array (PDF bytes),
// resolution: [3840, 2160],
// dpi: 300,
// fileSize: 2457600, // bytes
// views: {
// front: 'data:image/png;base64,...',
// back: 'data:image/png;base64,...',
// left: 'data:image/png;base64,...',
// right: 'data:image/png;base64,...',
// top: 'data:image/png;base64,...',
// bottom: 'data:image/png;base64,...'
// }
// } // Download PDF
const blob = new Blob([result.data], { type: 'application/pdf' });
saveAs(blob, 'product-print-ready.pdf'); // Features avancées:
// ✅ Multiple résolutions: HD, 4K, 8K
// ✅ Multiple DPI: 72, 150, 300
// ✅ Formats: PNG, JPEG, PDF
// ✅ PDF multi-pages (1 vue par page)
// ✅ Bleed zones configurables
// ✅ Color profiles (sRGB, CMYK)`}</code>{' '}
              </pre>{' '}
            </div>{' '}
            <div className="grid gap-2 min-[480px]:grid-cols-2 min-[480px]:gap-3 sm:grid-cols-2 sm:grid-cols-2 sm:grid-cols-2 sm:gap-3 sm:gap-4 sm:gap-4 sm:gap-4 sm:gap-4 md:grid-cols-1 md:grid-cols-2 md:grid-cols-2 md:gap-3 md:gap-4 md:gap-6 md:gap-6 md:gap-6 lg:grid-cols-1 lg:grid-cols-1 lg:grid-cols-1 lg:grid-cols-1 lg:grid-cols-3 lg:gap-2 lg:gap-3 lg:gap-3">
              {' '}
              {[
                {
                  title: 'Résolutions',
                  icon: Box,
                  color: 'blue',
                  items: [
                    'HD: 1920x1080',
                    '4K: 3840x2160',
                    '8K: 7680x4320',
                    'Custom sizes',
                  ],
                },
                {
                  title: 'DPI Quality',
                  icon: Printer,
                  color: 'purple',
                  items: [
                    '72 DPI (web)',
                    '150 DPI (offset)',
                    '300 DPI (print pro)',
                    'Custom DPI',
                  ],
                },
                {
                  title: 'Formats',
                  icon: Sparkles,
                  color: 'orange',
                  items: [
                    'PNG (lossless)',
                    'JPEG (quality 0-1)',
                    'PDF (multi-pages)',
                    'Bleed zones',
                  ],
                },
              ].map((group, i) => {
                const Icon = group.icon;
                return (
                  <div
                    key={i}
                    className={`bg-gradient-to-br p-6 from-${group.color}-900/20 to-${group.color}-900/5 border border-${group.color}-500/30 rounded-lg`}
                  >
                    {' '}
                    <Icon
                      className={`h-12 w-12 text-${group.color}-500 mb-4`}
                    />{' '}
                    <h4 className="mb-4 text-lg font-bold text-white">
                      {group.title}
                    </h4>{' '}
                    <div className="space-y-2 text-sm">
                      {' '}
                      {group.items.map((item, j) => (
                        <div
                          key={j}
                          className="flex flex-col gap-2 text-gray-300 sm:flex-row sm:items-center sm:gap-2"
                        >
                          {' '}
                          <CheckCircle className="h-4 w-4 text-green-500" />{' '}
                          <span>{item}</span>{' '}
                        </div>
                      ))}{' '}
                    </div>{' '}
                  </div>
                );
              })}{' '}
            </div>{' '}
          </Card>
        )}{' '}
      </section>{' '}
      {/* CTA */}{' '}
      <section className="bg-gradient-to-r from-orange-900 to-red-900 py-8 min-[480px]:px-4 min-[480px]:py-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:px-6 sm:py-10 sm:py-12 sm:py-12 sm:py-12 sm:py-12 sm:py-8 sm:py-8 sm:py-8 sm:py-8 sm:py-8 sm:py-8 sm:py-8 md:px-12 md:px-3 md:px-4 md:px-4 md:px-4 md:px-4 md:px-4 md:px-8 md:py-12 md:py-12 md:py-12 md:py-16 md:py-16 md:py-20 md:py-4 md:py-6 md:py-6 md:py-6 lg:px-12 lg:py-12 lg:py-16 lg:py-16 lg:py-16 lg:py-6 lg:py-6 lg:py-8">
        {' '}
        <div className="mx-auto max-w-4xl px-4 text-center">
          {' '}
          <h2 className="mb-6 text-2xl font-bold text-white min-[480px]:text-lg min-[480px]:text-lg min-[480px]:text-lg sm:text-2xl sm:text-2xl sm:text-2xl sm:text-2xl sm:text-lg sm:text-lg sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl sm:text-xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-2xl md:text-3xl md:text-3xl md:text-base md:text-base md:text-lg md:text-lg md:text-lg md:text-xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-3xl lg:text-4xl lg:text-base lg:text-xl lg:text-xl xl:text-xl">
            {' '}
            Export print-ready professionnel{' '}
          </h2>{' '}
          <p className="mb-8 text-xl text-orange-200">
            {' '}
            300 DPI, PDF multi-vues, bleed zones{' '}
          </p>{' '}
          <div className="flex flex-col justify-center gap-3 min-[480px]:gap-3 sm:flex-row sm:gap-2 sm:gap-4 sm:gap-4 sm:gap-4 md:gap-3 md:gap-3 md:gap-6 lg:gap-4">
            {' '}
            <Link href="/register">
              {' '}
              <Button
                size="lg"
                className="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 font-bold"
              >
                {' '}
                Essayer gratuitement{' '}
                <ArrowRight className="ml-2 h-5 w-5" />{' '}
              </Button>{' '}
            </Link>{' '}
            <Link href="/pricing">
              {' '}
              <Button
                size="lg"
                className="border-2 border-white/30 bg-white/10 font-semibold text-white hover:bg-white/20"
              >
                {' '}
                Voir les tarifs{' '}
              </Button>{' '}
            </Link>{' '}
          </div>{' '}
        </div>{' '}
      </section>{' '}
    </div>
  );
}

const MemoizedConfigurator3DDemoPageContent = memo(
  Configurator3DDemoPageContent
);

export default function Configurator3DDemoPage() {
  return (
    <ErrorBoundary level="page" componentName="Configurator3DDemoPage">
      <MemoizedConfigurator3DDemoPageContent />
    </ErrorBoundary>
  );
}
