'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MATERIALS, CONFIG_OPTIONS, COLORS } from './data';
import type { Material } from './data';

interface ConfigPanelProps {
  selectedMaterial: Material;
  setSelectedMaterial: (m: Material) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
  engravingText: string;
  setEngravingText: (t: string) => void;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  dimensions: { width: number; height: number; depth: number };
  setDimensions: (d: { width: number; height: number; depth: number }) => void;
  price: number;
}

export function ConfigPanel({
  selectedMaterial,
  setSelectedMaterial,
  activeTab,
  setActiveTab,
  engravingText,
  setEngravingText,
  selectedColor,
  setSelectedColor,
  dimensions,
  setDimensions,
  price,
}: ConfigPanelProps) {
  return (
    <div className="lg:col-span-5 bg-gray-900 p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-gray-800 overflow-y-auto">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-blue-400" />
        Configuration
      </h3>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {CONFIG_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setActiveTab(option.id)}
            className={`p-3 rounded-lg border transition-all text-left ${activeTab === option.id ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={activeTab === option.id ? 'text-blue-400' : 'text-gray-400'}>{option.icon}</span>
              <span className="text-sm font-semibold">{option.name}</span>
            </div>
            <span className="text-xs opacity-70">{option.count}</span>
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {activeTab === 'material' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <label className="text-xs text-gray-400 block">Choisissez un matériau :</label>
            <div className="grid grid-cols-3 gap-2">
              {MATERIALS.map((material) => (
                <button
                  key={material.id}
                  onClick={() => setSelectedMaterial(material)}
                  className={`p-2 rounded-lg border transition-all ${selectedMaterial.id === material.id ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500' : 'border-gray-700 hover:border-gray-600'}`}
                >
                  <div className="w-full aspect-square rounded-md mb-1" style={{ backgroundColor: material.color, boxShadow: material.metalness > 0.5 ? 'inset 0 0 20px rgba(255,255,255,0.2)' : undefined }} />
                  <p className="text-xs text-white truncate">{material.name}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
        {activeTab === 'color' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <label className="text-xs text-gray-400 block">Couleur d&apos;accent :</label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((color) => (
                <button key={color} onClick={() => setSelectedColor(color)} className={`aspect-square rounded-lg border-2 transition-all ${selectedColor === color ? 'border-white scale-110' : 'border-transparent hover:border-gray-600'}`} style={{ backgroundColor: color }} />
              ))}
            </div>
            <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
          </motion.div>
        )}
        {activeTab === 'engraving' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-2">Texte à graver :</label>
              <input type="text" value={engravingText} onChange={(e) => setEngravingText(e.target.value.slice(0, 20))} placeholder="Ex: John Doe, 2024..." className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" maxLength={20} />
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
          </motion.div>
        )}
        {activeTab === 'dimensions' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 flex justify-between"><span>Largeur</span><span className="text-white font-mono">{dimensions.width}mm</span></label>
              <input type="range" min="50" max="200" value={dimensions.width} onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 flex justify-between"><span>Hauteur</span><span className="text-white font-mono">{dimensions.height}mm</span></label>
              <input type="range" min="30" max="150" value={dimensions.height} onChange={(e) => setDimensions({ ...dimensions, height: Number(e.target.value) })} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 flex justify-between"><span>Profondeur</span><span className="text-white font-mono">{dimensions.depth}mm</span></label>
              <input type="range" min="20" max="100" value={dimensions.depth} onChange={(e) => setDimensions({ ...dimensions, depth: Number(e.target.value) })} className="w-full accent-blue-500" />
            </div>
          </motion.div>
        )}
      </div>
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
  );
}
