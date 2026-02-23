/**
 * @fileoverview Widget Nova - Assistant Support B2B/B2C
 * @module NovaSupport
 *
 * RÈGLES RESPECTÉES:
 * - ✅ 'use client' car utilise des hooks React
 * - ✅ Types explicites
 * - ✅ Composant < 300 lignes
 * - ✅ Gestion d'erreurs
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, LifeBuoy, FileQuestion, X, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useNovaChat } from '@/hooks/agents/useNovaChat';
import type { NovaResponse } from '@/types/agents';

// ============================================================================
// TYPES
// ============================================================================

interface NovaSupportProps {
  className?: string;
  initialMessage?: string;
}

interface NovaMessageBubble {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: NovaResponse;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NovaSupport({ className, initialMessage }: NovaSupportProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<NovaMessageBubble[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { sendMessage, isLoading } = useNovaChat();

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Message initial
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      handleSend(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  const handleSend = useCallback(
    async (message?: string) => {
      const textToSend = message || inputValue.trim();
      if (!textToSend || isLoading) return;

      const userMessage: NovaMessageBubble = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: textToSend,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');

      try {
        const response = await sendMessage({
          message: textToSend,
          // brandId / userId sont ajoutés côté backend via headers / auth
        });

        const novaMessage: NovaMessageBubble = {
          id: `nova-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          response,
        };
        setMessages((prev) => [...prev, novaMessage]);
      } catch {
        const errorMessage: NovaMessageBubble = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: "Désolé, une erreur est survenue. Merci de réessayer.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    [inputValue, isLoading, sendMessage],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSend();
    },
    [handleSend],
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/agents/nova-avatar.png" alt="Nova" />
            <AvatarFallback className="bg-sky-100 text-sky-600">
              <LifeBuoy className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span>Nova</span>
          <span className="text-sm font-normal text-muted-foreground">
            Assistant Support
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea ref={scrollRef} className="h-[320px] px-4">
          {messages.length === 0 ? (
            <NovaWelcome onQuickQuestion={handleSend} />
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((m) => (
                <NovaMessage key={m.id} message={m} />
              ))}
              {isLoading && <NovaTyping />}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Décrivez votre question ou votre problème..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={!inputValue.trim() || isLoading} size="icon">
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

function NovaWelcome({ onQuickQuestion }: { onQuickQuestion: (q: string) => void }) {
  const suggestions = [
    'Je ne comprends pas ma facture',
    'Comment connecter ma boutique Shopify ?',
    'J’ai un bug sur le widget de personnalisation',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
      <Avatar className="h-16 w-16 mb-4">
        <AvatarImage src="/agents/nova-avatar.png" alt="Nova" />
        <AvatarFallback className="bg-sky-100 text-sky-600">
          <LifeBuoy className="h-8 w-8" />
        </AvatarFallback>
      </Avatar>

      <h3 className="text-lg font-semibold mb-2">Besoin d’aide ?</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Nova vous aide sur la facturation, l’intégration, les bugs et l’utilisation de la
        plateforme.
      </p>

      <div className="space-y-2 w-full max-w-sm">
        {suggestions.map((s) => (
          <Button
            key={s}
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onQuickQuestion(s)}
          >
            <FileQuestion className="h-4 w-4" />
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}

function NovaMessage({ message }: { message: NovaMessageBubble }) {
  const isUser = message.role === 'user';
  const response = message.response;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {!isUser && response && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{response.intent}</Badge>
              {response.escalated && <Badge variant="destructive">Escaladé</Badge>}
              {!response.escalated && response.resolved && (
                <Badge variant="secondary">Résolu</Badge>
              )}
              {response.ticketId && (
                <Badge variant="outline">Ticket #{response.ticketId}</Badge>
              )}
            </div>

            {response.articles && response.articles.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Articles suggérés :
                </p>
                <ul className="space-y-1">
                  {response.articles.map((a) => (
                    <li key={a.id}>
                      <a
                        href={a.url}
                        className="text-xs text-primary hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {a.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p
          className={`text-xs mt-1 ${
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function NovaTyping() {
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

/**
 * Floating widget wrapper for NovaSupport
 */
export function NovaFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-sky-700"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground shadow hover:bg-muted/80"
            >
              <X className="h-3 w-3" />
            </button>
            <NovaSupport className="shadow-2xl border" />
          </div>
        </div>
      )}
    </>
  );
}

export default NovaSupport;

