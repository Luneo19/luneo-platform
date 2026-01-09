'use client';

import { useState } from 'react';
import { AVAILABLE_FONTS } from '../../../constants/fonts';
import { FontSelector } from './FontSelector';

interface TextEditorProps {
  onAdd: (content: string, fontFamily: string, fontSize: number) => void;
}

export function TextEditor({ onAdd }: TextEditorProps) {
  const [content, setContent] = useState('Nouveau texte');
  const [fontFamily, setFontFamily] = useState<string>(AVAILABLE_FONTS[0]);
  const [fontSize, setFontSize] = useState(24);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onAdd(content, fontFamily, fontSize);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Texte
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Entrez votre texte..."
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Police
        </label>
        <FontSelector
          value={fontFamily}
          onChange={setFontFamily}
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Taille: {fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="72"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>
      
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        Ajouter
      </button>
    </form>
  );
}






