'use client';

/**
 * ★★★ COMPOSANT - CHAT AVEC FICHIERS CONTEXTUELS ★★★
 * Interface de chat/agent qui utilise les fichiers contextuels
 * pour fournir des réponses contextuelles
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  FileText,
  Loader2,
  Bot,
  User,
  Paperclip,
  X,
  Search,
  FileSearch,
} from 'lucide-react';
import {
  getContextFiles,
  getContextFileContent,
  getAllContextFilesContent,
  type ContextFile,
} from '@/lib/utils/context-files';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  contextFiles?: string[]; // IDs des fichiers utilisés
}

interface ContextFilesChatProps {
  contextId?: string;
  onContextFilesChange?: (files: ContextFile[]) => void;
  className?: string;
}

export function ContextFilesChat({
  contextId,
  onContextFilesChange,
  className,
}: ContextFilesChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Charger les fichiers contextuels
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoadingFiles(true);
      try {
        const files = await getContextFiles(contextId);
        setContextFiles(files);
        onContextFilesChange?.(files);
      } catch (error) {
        console.error('Error loading context files:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les fichiers contextuels',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadFiles();
  }, [contextId, onContextFilesChange, toast]);

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filtrer les fichiers selon la recherche
  const filteredFiles = contextFiles.filter((file) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      file.fileName.toLowerCase().includes(query) ||
      file.description?.toLowerCase().includes(query) ||
      file.type.toLowerCase().includes(query)
    );
  });

  // Envoyer un message avec contexte
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Récupérer le contenu des fichiers sélectionnés
      let contextContent = '';
      const filesToUse = selectedFiles.size > 0
        ? contextFiles.filter((f) => selectedFiles.has(f.id))
        : contextFiles;

      if (filesToUse.length > 0) {
        const contents = await Promise.allSettled(
          filesToUse.map((file) => getContextFileContent(file.id, file.url))
        );

        contextContent = contents
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map((result, index) => {
            const file = filesToUse[index];
            return `[Fichier: ${file.fileName}]\n${result.value.content}`;
          })
          .join('\n\n---\n\n');
      }

      // Simuler une réponse de l'agent (à remplacer par un vrai appel API)
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: await generateResponse(userMessage.content, contextContent),
        timestamp: Date.now() + 1,
        contextFiles: filesToUse.map((f) => f.id),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'envoi du message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Générer une réponse (simulation - à remplacer par un vrai appel API)
  const generateResponse = async (
    userMessage: string,
    contextContent: string
  ): Promise<string> => {
    // Simulation d'une réponse basée sur le contexte
    if (contextContent) {
      return `Basé sur les fichiers contextuels fournis, voici ma réponse à votre question : "${userMessage}"\n\nJ'ai analysé ${contextContent.split('---').length} fichier(s) pour vous fournir cette réponse contextuelle.`;
    }

    return `Je comprends votre question : "${userMessage}". Pour vous fournir une réponse plus précise, veuillez uploader des fichiers contextuels ou sélectionner des fichiers existants.`;
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  return (
    <div className={cn('flex flex-col h-full bg-gray-900', className)}>
      {/* Header */}
      <CardHeader className="border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            Assistant avec Contexte
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-gray-600">
              {contextFiles.length} fichier(s)
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilesPanel(!showFilesPanel)}
              className="text-cyan-400 hover:text-cyan-300"
            >
              <FileText className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">Bienvenue dans l'assistant contextuel</p>
                    <p className="text-sm text-gray-500">
                      Posez une question et l'assistant utilisera les fichiers contextuels pour vous répondre
                    </p>
                  </CardContent>
                </Card>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        message.role === 'user'
                          ? 'bg-cyan-500/20'
                          : 'bg-blue-500/20'
                      )}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Bot className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className={cn('flex-1', message.role === 'user' && 'text-right')}>
                      <div
                        className={cn(
                          'inline-block p-3 rounded-lg max-w-[80%]',
                          message.role === 'user'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-800 text-gray-100'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.contextFiles && message.contextFiles.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {message.contextFiles.map((fileId) => {
                              const file = contextFiles.find((f) => f.id === fileId);
                              return file ? (
                                <Badge
                                  key={fileId}
                                  variant="outline"
                                  className="text-xs border-gray-600 bg-gray-700/50"
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  {file.fileName}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-gray-700 p-4 bg-gray-800/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Posez une question..."
                className="flex-1 bg-gray-900 border-gray-600 text-white"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {selectedFiles.size > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-gray-400">Fichiers sélectionnés:</span>
                {Array.from(selectedFiles).map((fileId) => {
                  const file = contextFiles.find((f) => f.id === fileId);
                  return file ? (
                    <Badge
                      key={fileId}
                      variant="outline"
                      className="text-xs border-cyan-600 bg-cyan-600/20"
                    >
                      {file.fileName}
                      <button
                        onClick={() => toggleFileSelection(fileId)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Files Panel */}
        {showFilesPanel && (
          <div className="w-80 border-l border-gray-700 bg-gray-800/50 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-cyan-400" />
                  Fichiers contextuels
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilesPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-8 bg-gray-900 border-gray-600 text-white text-sm"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              {isLoadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun fichier trouvé</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <Card
                      key={file.id}
                      className={cn(
                        'bg-gray-900/50 border-gray-700 cursor-pointer transition-all hover:border-cyan-500/50',
                        selectedFiles.has(file.id) && 'border-cyan-500 bg-cyan-500/10'
                      )}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.id)}
                            onChange={() => toggleFileSelection(file.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {file.type} • {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                            {file.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {file.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t border-gray-700">
              <p className="text-xs text-gray-400 text-center">
                {selectedFiles.size > 0
                  ? `${selectedFiles.size} fichier(s) sélectionné(s)`
                  : 'Tous les fichiers seront utilisés par défaut'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}








