import React, { useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

function getProductSpecificSuggestions(placeholder?: string): string[] {
  const placeholderLower = (placeholder || '').toLowerCase();
  
  if (placeholderLower.includes('t-shirt') || placeholderLower.includes('tshirt')) {
    return ['Design minimaliste', 'Style vintage', 'Motif géométrique', 'Texte personnalisé'];
  }
  
  if (placeholderLower.includes('mug') || placeholderLower.includes('tasse')) {
    return ['Citation du jour', 'Design humoristique', 'Logo entreprise', 'Motif floral'];
  }
  
  if (placeholderLower.includes('poster') || placeholderLower.includes('affiche')) {
    return ['Affiche événement', 'Art mural', 'Design moderne', 'Style rétro'];
  }
  
  // Default suggestions
  return ['Design minimaliste', 'Style moderne', 'Motif coloré', 'Texte personnalisé'];
}

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "Décrivez votre design...",
  disabled = false,
  maxLength = 500,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (value.trim() && !isLoading && !disabled) {
      onSubmit();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className="luneo-prompt-input">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Ex: \"Un t-shirt bleu avec un logo minimaliste\""}
            disabled={disabled || isLoading}
            maxLength={maxLength}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />

          <button
            type="submit"
            disabled={!value.trim() || isLoading || disabled}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div className="flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            <span>💡 Astuce: Plus de détails = meilleur résultat</span>
          </div>
          {value.length > maxLength * 0.8 && (
            <span className={value.length >= maxLength ? 'text-red-600 font-medium' : ''}>
              {maxLength - value.length} caractères restants
            </span>
          )}
        </div>

        {!value && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Suggestions rapides :</p>
            <div className="flex flex-wrap gap-2">
              {getProductSpecificSuggestions(placeholder).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onChange(suggestion)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs transition-colors duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      <style>{`
        .luneo-prompt-input {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .luneo-prompt-input textarea {
          font-size: 14px;
          line-height: 1.5;
        }
        
        .luneo-prompt-input textarea::placeholder {
          color: #9CA3AF;
        }
        
        .luneo-prompt-input textarea:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};