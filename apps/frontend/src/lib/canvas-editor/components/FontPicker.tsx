'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';

interface FontPickerProps {
  selectedFont?: string;
  onFontSelect: (fontFamily: string) => void;
  previewText?: string;
  className?: string;
}

// Popular Google Fonts (subset for performance)
const POPULAR_FONTS = [
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Raleway',
  'PT Sans',
  'Lora',
  'Nunito',
  'Playfair Display',
  'Merriweather',
  'Poppins',
  'Ubuntu',
  'Crimson Text',
  'Libre Baskerville',
  'Dancing Script',
  'Pacifico',
  'Lobster',
  'Bebas Neue',
  'Oswald',
  'Anton',
  'Fjalla One',
  'Righteous',
  'Bangers',
  'Fredoka One',
  'Comfortaa',
  'Quicksand',
  'Work Sans',
  'Inter',
  'Fira Sans',
  'IBM Plex Sans',
  'Cabin',
  'Karla',
  'Muli',
  'Titillium Web',
  'Varela Round',
  'Rubik',
  'Exo 2',
  'Rajdhani',
  'Orbitron',
  'Abril Fatface',
  'Crete Round',
  'Patua One',
  'Fredoka',
  'Barlow',
  'Heebo',
  'Assistant',
  'Secular One',
  'Saira',
  'Chakra Petch',
  'Space Grotesk',
  'DM Sans',
  'Plus Jakarta Sans',
  'Manrope',
  'Sora',
  'Epilogue',
  'Outfit',
  'Lexend',
  'Red Hat Display',
  'Figtree',
  'Geist',
  'Cabinet Grotesk',
  'Satoshi',
  'Clash Display',
  'General Sans',
  'Switzer',
  'Neue Montreal',
  'Instrument Sans',
  'Fraunces',
  'Recoleta',
  'Chillax',
  'Cabinet Grotesk',
  'Satoshi',
  'Clash Display',
  'General Sans',
  'Switzer',
  'Neue Montreal',
  'Instrument Sans',
  'Fraunces',
  'Recoleta',
  'Chillax',
  'Cabinet Grotesk',
  'Satoshi',
  'Clash Display',
  'General Sans',
  'Switzer',
  'Neue Montreal',
  'Instrument Sans',
  'Fraunces',
  'Recoleta',
  'Chillax',
];

const FONT_CATEGORIES = {
  'Sans Serif': ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro', 'Raleway', 'PT Sans', 'Nunito', 'Poppins', 'Ubuntu', 'Inter', 'Fira Sans', 'IBM Plex Sans', 'Cabin', 'Karla', 'Muli', 'Titillium Web', 'Varela Round', 'Rubik', 'Exo 2', 'Rajdhani', 'Barlow', 'Heebo', 'Assistant', 'Secular One', 'Saira', 'Chakra Petch', 'Space Grotesk', 'DM Sans', 'Plus Jakarta Sans', 'Manrope', 'Sora', 'Epilogue', 'Outfit', 'Lexend', 'Red Hat Display', 'Figtree', 'Geist', 'Cabinet Grotesk', 'Satoshi', 'Clash Display', 'General Sans', 'Switzer', 'Neue Montreal', 'Instrument Sans'],
  'Serif': ['Lora', 'Playfair Display', 'Merriweather', 'Crimson Text', 'Libre Baskerville', 'Abril Fatface', 'Crete Round', 'Fraunces', 'Recoleta'],
  'Display': ['Bebas Neue', 'Oswald', 'Anton', 'Fjalla One', 'Righteous', 'Bangers', 'Fredoka One', 'Patua One', 'Fredoka', 'Orbitron'],
  'Handwriting': ['Dancing Script', 'Pacifico', 'Lobster', 'Comfortaa', 'Quicksand', 'Work Sans', 'Chillax'],
  'Monospace': ['Source Code Pro', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Monaco', 'Consolas', 'Courier New'],
};

export default function FontPicker({
  selectedFont = 'Roboto',
  onFontSelect,
  previewText = 'The quick brown fox jumps over the lazy dog',
  className = '',
}: FontPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loadingFonts, setLoadingFonts] = useState<Set<string>>(new Set());
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    let fonts = POPULAR_FONTS;

    // Filter by category
    if (selectedCategory !== 'All' && FONT_CATEGORIES[selectedCategory as keyof typeof FONT_CATEGORIES]) {
      fonts = FONT_CATEGORIES[selectedCategory as keyof typeof FONT_CATEGORIES];
    }

    // Filter by search term
    if (searchTerm) {
      fonts = fonts.filter(font =>
        font.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return fonts;
  }, [searchTerm, selectedCategory]);

  // Load Google Font
  const loadFont = useCallback(async (fontFamily: string) => {
    if (loadedFonts.has(fontFamily)) return;

    setLoadingFonts(prev => new Set(prev).add(fontFamily));

    try {
      // Create link element for Google Fonts
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Wait for font to load
      await document.fonts.load(`400 16px "${fontFamily}"`);
      
      setLoadedFonts(prev => new Set(prev).add(fontFamily));
    } catch (error) {
      logger.error('Failed to load font', {
        error,
        fontFamily,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoadingFonts(prev => {
        const newSet = new Set(prev);
        newSet.delete(fontFamily);
        return newSet;
      });
    }
  }, [loadedFonts]);

  // Load selected font on mount
  useEffect(() => {
    if (selectedFont) {
      loadFont(selectedFont);
    }
  }, [selectedFont, loadFont]);

  // Load fonts as they become visible
  const handleFontHover = (fontFamily: string) => {
    loadFont(fontFamily);
  };

  const handleFontSelect = (fontFamily: string) => {
    loadFont(fontFamily);
    onFontSelect(fontFamily);
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search fonts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['All', ...Object.keys(FONT_CATEGORIES)].map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Font List */}
      <ScrollArea className="h-96 border rounded-md">
        <div className="p-2 space-y-1">
          {filteredFonts.map((fontFamily) => {
            const isLoading = loadingFonts.has(fontFamily);
            const isLoaded = loadedFonts.has(fontFamily);
            const isSelected = selectedFont === fontFamily;

            return (
              <div
                key={fontFamily}
                className={`p-3 rounded-md cursor-pointer transition-colors hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50 border border-blue-200' : ''
                }`}
                onClick={() => handleFontSelect(fontFamily)}
                onMouseEnter={() => handleFontHover(fontFamily)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 mb-1">
                      {fontFamily}
                    </div>
                    <div
                      className="text-sm text-gray-600"
                      style={{
                        fontFamily: isLoaded ? `"${fontFamily}", sans-serif` : 'inherit',
                        fontWeight: 400,
                      }}
                    >
                      {previewText}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-3">
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Selected Font Preview */}
      {selectedFont && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-500 mb-2">Selected Font:</div>
          <div
            className="text-lg font-medium"
            style={{
              fontFamily: loadedFonts.has(selectedFont) ? `"${selectedFont}", sans-serif` : 'inherit',
            }}
          >
            {selectedFont}
          </div>
          <div
            className="text-sm text-gray-600 mt-1"
            style={{
              fontFamily: loadedFonts.has(selectedFont) ? `"${selectedFont}", sans-serif` : 'inherit',
            }}
          >
            {previewText}
          </div>
        </div>
      )}

      {/* Font Weights Preview */}
      {selectedFont && loadedFonts.has(selectedFont) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-500 mb-2">Font Weights:</div>
          <div className="space-y-1">
            {[300, 400, 500, 600, 700].map((weight) => (
              <div
                key={weight}
                className="text-sm"
                style={{
                  fontFamily: `"${selectedFont}", sans-serif`,
                  fontWeight: weight,
                }}
              >
                {weight} - {previewText}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
