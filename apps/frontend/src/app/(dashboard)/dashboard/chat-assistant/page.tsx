'use client';

/**
 * ★★★ PAGE - CHAT ASSISTANT AVEC FICHIERS CONTEXTUELS ★★★
 * Page dédiée pour le chat/agent avec support des fichiers contextuels
 */

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ContextFilesChat } from '@/components/chat/ContextFilesChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  FileText,
  Upload,
  Settings,
  HelpCircle,
  BookOpen,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  uploadContextFile,
  getContextFiles,
  deleteContextFile,
  getFileIcon,
  formatFileSize,
  type ContextFile,
} from '@/lib/utils/context-files';

export default function ChatAssistantPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'settings'>('chat');
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File, description?: string) => {
    setIsUploading(true);
    try {
      const result = await uploadContextFile(file, undefined, description);
      const newFile: ContextFile = {
        id: result.file.id || `file-${Date.now()}`,
        fileName: result.file.fileName,
        url: result.file.url,
        size: result.file.size,
        type: result.file.type,
        uploadedAt: result.file.uploadedAt,
        description,
      };
      setContextFiles((prev) => [...prev, newFile]);
      toast({
        title: 'Fichier uploadé',
        description: 'Le fichier contextuel a été ajouté avec succès',
      });
      setShowUploadDialog(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ErrorBoundary level="page" componentName="ChatAssistantPage">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Bot className="w-8 h-8 text-cyan-400" />
              Assistant Contextuel
            </h1>
            <p className="text-gray-400 mt-2">
              Chat intelligent avec support des fichiers contextuels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan-600 text-cyan-400">
              {contextFiles.length} fichier(s) contextuel(s)
            </Badge>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader un fichier
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle>Uploader un fichier contextuel</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Ajoutez un fichier pour fournir du contexte à l'assistant
                  </DialogDescription>
                </DialogHeader>
                <FileUploadForm
                  onUpload={handleFileUpload}
                  isUploading={isUploading}
                  onCancel={() => setShowUploadDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)} className="space-y-4">
          <TabsList className="bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="chat" className="data-[state=active]:bg-cyan-600">
              <Bot className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-cyan-600">
              <FileText className="w-4 h-4 mr-2" />
              Fichiers ({contextFiles.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-600">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-0">
                <ContextFilesChat
                  onContextFilesChange={setContextFiles}
                  className="h-[600px]"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <ContextFilesManager
              files={contextFiles}
              onFilesChange={setContextFiles}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Paramètres de l'assistant</CardTitle>
                <CardDescription className="text-gray-400">
                  Configurez le comportement de l'assistant contextuel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mode de réponse</Label>
                  <p className="text-sm text-gray-400">
                    L'assistant utilise automatiquement les fichiers contextuels pour fournir des réponses précises
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Utilisation des fichiers</Label>
                  <p className="text-sm text-gray-400">
                    Par défaut, tous les fichiers sont utilisés. Vous pouvez sélectionner des fichiers spécifiques dans le chat.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Comment utiliser l'assistant contextuel ?</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Uploadez des fichiers contextuels (PDF, DOCX, TXT, etc.) pour fournir du contexte à l'assistant</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Posez des questions et l'assistant utilisera automatiquement les fichiers pour répondre</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Sélectionnez des fichiers spécifiques dans le panneau latéral pour cibler votre recherche</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>Les réponses sont basées sur le contenu réel de vos fichiers</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

// Composant pour uploader un fichier
function FileUploadForm({
  onUpload,
  isUploading,
  onCancel,
}: {
  onUpload: (file: File, description?: string) => void;
  isUploading: boolean;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onUpload(file, description || undefined);
      setFile(null);
      setDescription('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="file">Fichier</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.csv,.json,.html,.xml"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="bg-gray-900 border-gray-600 text-white mt-2"
          required
          disabled={isUploading}
        />
        <p className="text-xs text-gray-400 mt-1">
          Formats acceptés: PDF, TXT, DOCX, XLSX, CSV, JSON, HTML, XML (max 20MB)
        </p>
      </div>
      <div>
        <Label htmlFor="description">Description (optionnel)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez le contenu de ce fichier..."
          className="bg-gray-900 border-gray-600 text-white mt-2"
          rows={3}
          disabled={isUploading}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
          className="border-gray-600"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={!file || isUploading}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          {isUploading ? 'Upload en cours...' : 'Uploader'}
        </Button>
      </div>
    </form>
  );
}

// Composant pour gérer les fichiers
function ContextFilesManager({
  files,
  onFilesChange,
}: {
  files: ContextFile[];
  onFilesChange: (files: ContextFile[]) => void;
}) {
  const { toast } = useToast();

  const handleDelete = async (fileId: string, fileUrl: string) => {
    try {
      await deleteContextFile(fileId, fileUrl);
      onFilesChange(files.filter((f) => f.id !== fileId));
      toast({
        title: 'Fichier supprimé',
        description: 'Le fichier a été supprimé avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    }
  };

  if (files.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Aucun fichier contextuel</p>
          <p className="text-sm text-gray-500">
            Uploadez des fichiers pour fournir du contexte à l'assistant
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <Card key={file.id} className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{getFileIcon(file.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{file.fileName}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
                {file.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{file.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
                className="flex-1 border-gray-600"
              >
                Ouvrir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(file.id, file.url)}
                className="border-red-600 text-red-400 hover:text-red-300"
              >
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

