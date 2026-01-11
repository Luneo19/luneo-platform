/**
 * @fileoverview Widget Aria - Assistant Personnalisation B2C
 * @module AriaWidget
 *
 * Ce composant s'intègre dans le widget de personnalisation produit
 * pour aider les clients finaux à créer leurs personnalisations.
 *
 * RÈGLES RESPECTÉES:
 * - ✅ 'use client' car utilise des hooks React
 * - ✅ Composant < 300 lignes (découpage en sous-composants)
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Wand2, Type, Palette } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Hooks
import { useAriaChat } from '@/hooks/agents/useAriaChat';

// Types
import type { AriaSuggestion, AriaResponse } from '@/types/agents';

// ============================================================================
// TYPES
// ============================================================================

interface AriaWidgetProps {
  productId: string;
  sessionId: string;
  currentText?: string;
  currentStyle?: {
    font?: string;
    color?: string;
  };
  onSuggestionSelect?: (suggestion: AriaSuggestion) => void;
  onTextChange?: (text: string) => void;
  onStyleChange?: (style: { font: string; color: string }) => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: AriaSuggestion[];
  timestamp: Date;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AriaWidget({
  productId,
  sessionId,
  currentText,
  currentStyle,
  onSuggestionSelect,
  onTextChange,
  onStyleChange,
  className,
}: AriaWidgetProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'quick'>('quick');

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { sendMessage, quickSuggest, isLoading, suggestions } = useAriaChat({
    productId,
    sessionId,
  });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Charger les suggestions rapides au montage
  useEffect(() => {
    if (isOpen && activeTab === 'quick') {
      quickSuggest('général');
    }
  }, [isOpen, activeTab, quickSuggest]);

  /**
   * Envoie un message à Aria
   */
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      const response = await sendMessage({
        message: inputValue,
        context: {
          currentText,
          currentStyle,
        },
      });

      const ariaMessage: ChatMessage = {
        id: `aria-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        suggestions: response.suggestions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, ariaMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Désolée, je n'ai pas pu traiter votre demande. 😅",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [inputValue, isLoading, sendMessage, currentText, currentStyle]);

  /**
   * Gère la sélection d'une suggestion
   */
  const handleSuggestionClick = useCallback((suggestion: AriaSuggestion) => {
    if (suggestion.type === 'text') {
      onTextChange?.(suggestion.value);
    } else if (suggestion.type === 'style' && suggestion.metadata) {
      onStyleChange?.({
        font: suggestion.metadata.font as string,
        color: suggestion.metadata.color as string,
      });
    }
    onSuggestionSelect?.(suggestion);
  }, [onTextChange, onStyleChange, onSuggestionSelect]);

  /**
   * Suggestions rapides par occasion
   */
  const handleQuickOccasion = useCallback((occasion: string) => {
    quickSuggest(occasion);
  }, [quickSuggest]);

  if (!isOpen) {
    return (
      <AriaFloatingButton onClick={() => setIsOpen(true)} />
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-80 bg-background border rounded-xl shadow-2xl z-50 ${className}`}>
      {/* Header */}
      <AriaHeader onClose={() => setIsOpen(false)} />

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'quick' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('quick')}
        >
          ✨ Suggestions
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'chat' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
      </div>

      {/* Content */}
      <div className="h-72">
        {activeTab === 'quick' ? (
          <QuickSuggestionsPanel
            suggestions={suggestions}
            isLoading={isLoading}
            onSuggestionClick={handleSuggestionClick}
            onOccasionClick={handleQuickOccasion}
          />
        ) : (
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            scrollRef={scrollRef}
            onSuggestionClick={handleSuggestionClick}
          />
        )}
      </div>

      {/* Input (only for chat) */}
      {activeTab === 'chat' && (
        <div className="p-3 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Demandez à Aria..."
              disabled={isLoading}
              className="flex-1 text-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Bouton flottant pour ouvrir Aria
 */
function AriaFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-50"
      aria-label="Ouvrir Aria"
    >
      <Sparkles className="h-6 w-6" />
    </button>
  );
}

/**
 * Header du widget Aria
 */
function AriaHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-purple-500/10 to-pink-500/10">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Aria</h3>
          <p className="text-xs text-muted-foreground">Assistante créative</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Panel de suggestions rapides
 */
function QuickSuggestionsPanel({
  suggestions,
  isLoading,
  onSuggestionClick,
  onOccasionClick,
}: {
  suggestions: AriaSuggestion[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: AriaSuggestion) => void;
  onOccasionClick: (occasion: string) => void;
}) {
  const occasions = [
    { id: 'anniversaire', label: '🎂 Anniversaire', icon: '🎂' },
    { id: 'mariage', label: '💒 Mariage', icon: '💒' },
    { id: 'naissance', label: '👶 Naissance', icon: '👶' },
    { id: 'amour', label: '💕 Amour', icon: '💕' },
    { id: 'amitie', label: '🤝 Amitié', icon: '🤝' },
    { id: 'fete-meres', label: '👩 Fête des Mères', icon: '👩' },
  ];

  return (
    <ScrollArea className="h-full p-3">
      {/* Occasions */}
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Choisir une occasion
        </p>
        <div className="flex flex-wrap gap-1">
          {occasions.map(occasion => (
            <Badge
              key={occasion.id}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => onOccasionClick(occasion.id)}
            >
              {occasion.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Suggestions
        </p>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-12 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                className="w-full text-left p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <p className="text-sm font-medium group-hover:text-primary">
                  "{suggestion.value}"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {suggestion.label}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sélectionnez une occasion pour voir les suggestions
          </p>
        )}
      </div>
    </ScrollArea>
  );
}

/**
 * Panel de chat
 */
function ChatPanel({
  messages,
  isLoading,
  scrollRef,
  onSuggestionClick,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
  onSuggestionClick: (suggestion: AriaSuggestion) => void;
}) {
  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <Wand2 className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Comment puis-je vous aider ?</p>
        <p className="text-xs text-muted-foreground mt-1">
          Demandez-moi des idées de texte, des conseils de style...
        </p>
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollRef} className="h-full p-3">
      <div className="space-y-3">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSuggestionClick(suggestion)}
                      className="w-full text-left text-xs p-2 rounded bg-background/50 hover:bg-background transition-colors"
                    >
                      "{suggestion.value}"
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export default AriaWidget;
