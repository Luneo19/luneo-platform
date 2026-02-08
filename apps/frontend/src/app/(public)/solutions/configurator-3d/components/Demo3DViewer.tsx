'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Rotate3D, ZoomIn, ZoomOut, Camera, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MATERIALS } from './data';
import type { Material } from './data';
import { ConfigPanel } from './ConfigPanel';

export function Demo3DViewer() {
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(MATERIALS[0]);
  const [activeTab, setActiveTab] = useState('material');
  const [isRotating, setIsRotating] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotationY, setRotationY] = useState(0);
  const [engravingText, setEngravingText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#1E40AF');
  const [lightMode, setLightMode] = useState<'day' | 'studio'>('studio');
  const [dimensions, setDimensions] = useState({ width: 100, height: 80, depth: 40 });

  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => setRotationY((prev) => (prev + 1) % 360), 50);
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
        <div className="lg:col-span-7 bg-gradient-to-br from-gray-800 to-gray-900 p-4 lg:p-6 relative">
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <button onClick={() => setLightMode(lightMode === 'day' ? 'studio' : 'day')} className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-gray-400 hover:text-white transition-colors" title="Changer l'éclairage">
              {lightMode === 'day' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsRotating(!isRotating)} className={`p-2 rounded-lg transition-colors ${isRotating ? 'bg-blue-500/30 text-blue-400' : 'bg-black/50 text-gray-400 hover:text-white'}`} title="Auto-rotation">
              <Rotate3D className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-gray-400 hover:text-white transition-colors" title="Zoom -">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-xs text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.25))} className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-gray-400 hover:text-white transition-colors" title="Zoom +">
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
          <div className="aspect-square max-h-[400px] mx-auto flex items-center justify-center relative" style={{ perspective: '1000px' }}>
            <div className={`absolute inset-0 rounded-full opacity-20 blur-3xl ${lightMode === 'day' ? 'bg-sky-400' : 'bg-purple-500'}`} />
            <motion.div
              className="relative"
              style={{ transform: `scale(${zoom}) rotateY(${rotationY}deg)`, transformStyle: 'preserve-3d' }}
              animate={{ rotateY: isRotating ? undefined : rotationY }}
            >
              <div
                className="w-48 h-48 rounded-2xl shadow-2xl relative overflow-hidden"
                style={{
                  backgroundColor: selectedMaterial.color,
                  background: `linear-gradient(135deg, ${selectedMaterial.color} 0%, ${selectedMaterial.color}99 50%, ${selectedMaterial.color}66 100%)`,
                  boxShadow: selectedMaterial.metalness > 0.5 ? '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 0 80px rgba(255,255,255,0.1)' : '0 25px 50px -12px rgba(0,0,0,0.4)',
                }}
              >
                {selectedMaterial.metalness > 0.5 && <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(135deg, transparent 40%, white 50%, transparent 60%)' }} />}
                {engravingText && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold tracking-wider" style={{ color: selectedMaterial.metalness > 0.5 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{engravingText}</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 h-2 rounded-full" style={{ backgroundColor: selectedColor }} />
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/30 rounded-full blur-xl" style={{ transform: `translateX(-50%) scale(${zoom})` }} />
            </motion.div>
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
              <p className="text-xs text-gray-400">Matériau</p>
              <p className="text-sm font-semibold text-white">{selectedMaterial.name}</p>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
              <p className="text-xs text-gray-400">Dimensions</p>
              <p className="text-sm font-semibold text-white">{dimensions.width}×{dimensions.height}×{dimensions.depth}mm</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <Button variant="outline" size="sm" className="border-blue-500/50 hover:bg-blue-500/10"><Camera className="w-4 h-4 mr-2" />Voir en AR</Button>
            <Button variant="outline" size="sm" className="border-purple-500/50 hover:bg-purple-500/10"><Download className="w-4 h-4 mr-2" />Exporter</Button>
            <Button variant="outline" size="sm" className="border-green-500/50 hover:bg-green-500/10"><Share2 className="w-4 h-4 mr-2" />Partager</Button>
          </div>
        </div>
        <ConfigPanel
          selectedMaterial={selectedMaterial}
          setSelectedMaterial={setSelectedMaterial}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          engravingText={engravingText}
          setEngravingText={setEngravingText}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          dimensions={dimensions}
          setDimensions={setDimensions}
          price={price}
        />
      </div>
    </Card>
  );
}
