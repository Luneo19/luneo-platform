import type { EditorTemplate } from '../types';

export const EDITOR_TEMPLATES: EditorTemplate[] = [
  // Jewelry
  {
    id: 'jewelry-product-card',
    name: 'Product card',
    sector: 'jewelry',
    objects: [
      { type: 'shape', x: 20, y: 20, width: 360, height: 200, rotation: 0, fill: '#1a1a2e', opacity: 1, name: 'Background', visible: true, locked: false },
      { type: 'text', x: 40, y: 100, width: 320, height: 40, rotation: 0, fill: '#e8d5b7', opacity: 1, text: 'Collection 2024', fontSize: 28, fontFamily: 'Georgia', name: 'Title', visible: true, locked: false },
      { type: 'text', x: 40, y: 150, width: 320, height: 24, rotation: 0, fill: '#a0a0a0', opacity: 1, text: 'Discover our latest pieces', fontSize: 14, fontFamily: 'Arial', name: 'Subtitle', visible: true, locked: false },
    ],
  },
  {
    id: 'jewelry-social',
    name: 'Social media post',
    sector: 'jewelry',
    objects: [
      { type: 'shape', x: 0, y: 0, width: 400, height: 400, rotation: 0, fill: '#0f0f0f', opacity: 1, name: 'Background', visible: true, locked: false },
      { type: 'text', x: 40, y: 340, width: 320, height: 40, rotation: 0, fill: '#ffffff', opacity: 1, text: '#LuxuryJewelry', fontSize: 18, fontFamily: 'Arial', name: 'Hashtag', visible: true, locked: false },
    ],
  },
  {
    id: 'jewelry-banner',
    name: 'Banner',
    sector: 'jewelry',
    objects: [
      { type: 'shape', x: 0, y: 0, width: 800, height: 200, rotation: 0, fill: '#1a1a2e', opacity: 1, name: 'Background', visible: true, locked: false },
      { type: 'text', x: 40, y: 70, width: 720, height: 50, rotation: 0, fill: '#e8d5b7', opacity: 1, text: 'Summer Collection', fontSize: 36, fontFamily: 'Georgia', align: 'center', name: 'Title', visible: true, locked: false },
    ],
  },
  // Watches
  {
    id: 'watches-catalog',
    name: 'Catalog page',
    sector: 'watches',
    objects: [
      { type: 'shape', x: 20, y: 20, width: 340, height: 420, rotation: 0, fill: '#0d0d0d', opacity: 1, name: 'Card', visible: true, locked: false },
      { type: 'text', x: 40, y: 360, width: 300, height: 28, rotation: 0, fill: '#ffffff', opacity: 1, text: 'Chronograph Pro', fontSize: 20, fontFamily: 'Arial', name: 'Title', visible: true, locked: false },
      { type: 'text', x: 40, y: 392, width: 300, height: 20, rotation: 0, fill: '#888', opacity: 1, text: 'Swiss automatic', fontSize: 12, fontFamily: 'Arial', name: 'Subtitle', visible: true, locked: false },
    ],
  },
  {
    id: 'watches-comparison',
    name: 'Comparison card',
    sector: 'watches',
    objects: [
      { type: 'shape', x: 20, y: 20, width: 360, height: 120, rotation: 0, fill: '#1a1a1a', opacity: 1, name: 'Card', visible: true, locked: false },
      { type: 'text', x: 40, y: 45, width: 320, height: 24, rotation: 0, fill: '#fff', opacity: 1, text: 'Model A vs Model B', fontSize: 18, fontFamily: 'Arial', name: 'Title', visible: true, locked: false },
      { type: 'text', x: 40, y: 80, width: 320, height: 36, rotation: 0, fill: '#aaa', opacity: 1, text: 'Compare features & pricing', fontSize: 12, fontFamily: 'Arial', name: 'Subtitle', visible: true, locked: false },
    ],
  },
  // Glasses
  {
    id: 'glasses-tryon',
    name: 'Try-on card',
    sector: 'glasses',
    objects: [
      { type: 'shape', x: 20, y: 20, width: 320, height: 380, rotation: 0, fill: '#111', opacity: 1, name: 'Card', visible: true, locked: false },
      { type: 'text', x: 40, y: 320, width: 280, height: 32, rotation: 0, fill: '#fff', opacity: 1, text: 'Try them on', fontSize: 22, fontFamily: 'Arial', name: 'Title', visible: true, locked: false },
      { type: 'text', x: 40, y: 358, width: 280, height: 20, rotation: 0, fill: '#888', opacity: 1, text: 'Virtual try-on available', fontSize: 12, fontFamily: 'Arial', name: 'Subtitle', visible: true, locked: false },
    ],
  },
  {
    id: 'glasses-promo',
    name: 'Promo banner',
    sector: 'glasses',
    objects: [
      { type: 'shape', x: 0, y: 0, width: 600, height: 120, rotation: 0, fill: '#0c0c0c', opacity: 1, name: 'Background', visible: true, locked: false },
      { type: 'text', x: 24, y: 40, width: 552, height: 36, rotation: 0, fill: '#ffffff', opacity: 1, text: '20% off — Limited time', fontSize: 28, fontFamily: 'Arial', name: 'Title', visible: true, locked: false },
    ],
  },
];
