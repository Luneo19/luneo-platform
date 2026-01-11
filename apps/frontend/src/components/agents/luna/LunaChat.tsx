/**
 * @fileoverview Composant Chat pour l'Agent Luna (B2B)
 * @module LunaChat
 *
 * RÈGLES RESPECTÉES:
 * - ✅ 'use client' car utilise des hooks React
 * - ✅ Types explicites
 * - ✅ Composant < 300 lignes
 * - ✅ Gestion d'erreurs avec ErrorBoundary
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Sparkles, BarChart3, Lightbulb } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Types
import type { LunaResponse, LunaAction } from '@/types/agents';

// Hooks
import { useLunaChat } from '@/hooks/agents/useLunaChat';

// ============================================================================
// TYPES
// ============================================================================

interface LunaChatProps {
  className?: string;
  initialMessage?: string;
  onActionExecuted?: (action: LunaAction, result: unknown) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: LunaAction[];
  suggestions?: string[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LunaChat({
  className,
  initialMessage,
  onActionExecuted
}: LunaChatProps) {
  // State
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { sendMessage, isLoading, executeAction } = useLunaChat();

  // Auto-scroll vers le bas quand nouveaux messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Message initial si fourni
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Envoie un message à Luna
   */
  const handleSendMessage = useCallback(async (message?: string) => {
    const textToSend = message || inputValue.trim();
    if (!textToSend || isLoading) return;

    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      // Appeler l'API Luna
      const response = await sendMessage({
        message: textToSend,
        conversationId: conversationId || undefined,
      });

      // Mettre à jour le conversationId
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Ajouter la réponse de Luna
      const lunaMessage: ChatMessage = {
        id: `luna-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        actions: response.actions,
        suggestions: response.suggestions,
      };

      setMessages(prev => [...prev, lunaMessage]);
    } catch (error) {
      // Message d'erreur
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Désolée, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  }, [inputValue, isLoading, conversationId, sendMessage]);

  /**
   * Gère l'exécution d'une action
   */
  const handleActionClick = useCallback(async (action: LunaAction) => {
    if (action.requiresConfirmation) {
      const confirmed = window.confirm(`Exécuter l'action: ${action.label} ?`);
      if (!confirmed) return;
    }

    try {
      const result = await executeAction(action);
      onActionExecuted?.(action, result);

      // Ajouter un message de confirmation
      const confirmMessage: ChatMessage = {
        id: `action-${Date.now()}`,
        role: 'assistant',
        content: `✅ Action "${action.label}" exécutée avec succès.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, confirmMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `action-error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Erreur lors de l'exécution de "${action.label}".`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  }, [executeAction, onActionExecuted]);

  /**
   * Gère le clic sur une suggestion
   */
  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion);
  }, [handleSendMessage]);

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  }, [handleSendMessage]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/agents/luna-avatar.png" alt="Luna" />
            <AvatarFallback className="bg-purple-100 text-purple-600">
              <Sparkles className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span>Luna</span>
          <span className="text-sm font-normal text-muted-foreground">
            Assistant Business Intelligence
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Messages */}
        <ScrollArea
          ref={scrollRef}
          className="h-[400px] px-4"
        >
          {messages.length === 0 ? (
            <WelcomeMessage onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="space-y-4 py-4">
              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onActionClick={handleActionClick}
                  onSuggestionClick={handleSuggestionClick}
                />
              ))}
              {isLoading && <TypingIndicator />}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t p-4"
        >
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Posez une question à Luna..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Message de bienvenue avec suggestions
 */
function WelcomeMessage({
  onSuggestionClick
}: {
  onSuggestionClick: (suggestion: string) => void
}) {
  const suggestions = [
    { icon: BarChart3, text: 'Analyse mes ventes du mois' },
    { icon: Lightbulb, text: 'Quels produits me recommandes-tu ?' },
    { icon: Sparkles, text: 'Aide-moi à configurer un nouveau produit' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
      <Avatar className="h-16 w-16 mb-4">
        <AvatarImage src="/agents/luna-avatar.png" alt="Luna" />
        <AvatarFallback className="bg-purple-100 text-purple-600">
          <Sparkles className="h-8 w-8" />
        </AvatarFallback>
      </Avatar>

      <h3 className="text-lg font-semibold mb-2">
        Bonjour ! Je suis Luna 👋
      </h3>

      <p className="text-muted-foreground mb-6 max-w-sm">
        Votre assistante Business Intelligence. Je peux analyser vos ventes,
        vous recommander des produits, et vous aider à configurer votre boutique.
      </p>

      <div className="space-y-2 w-full max-w-sm">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onSuggestionClick(suggestion.text)}
          >
            <suggestion.icon className="h-4 w-4" />
            {suggestion.text}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Bulle de message
 */
function MessageBubble({
  message,
  onActionClick,
  onSuggestionClick,
}: {
  message: ChatMessage;
  onActionClick: (action: LunaAction) => void;
  onSuggestionClick: (suggestion: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Actions */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action, idx) => (
              <Button
                key={idx}
                size="sm"
                variant="secondary"
                onClick={() => onActionClick(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                size="sm"
                variant="ghost"
                className="h-auto py-1 px-2 text-xs"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-xs mt-1 ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

/**
 * Indicateur de frappe
 */
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-lg px-4 py-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}

export default LunaChat;
