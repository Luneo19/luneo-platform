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
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
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
import { useI18n } from '@/i18n/useI18n';

export default function ChatAssistantPage() {
  const { t } = useI18n();
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
        title: t('chatAssistant.fileUploaded'),
        description: t('chatAssistant.fileUploadedDesc'),
      });
      setShowUploadDialog(false);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
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
              <Bot className="w-8 h-8 text-purple-400" />
              Assistant Contextuel
            </h1>
            <p className="text-white/60 mt-2">
              Chat intelligent avec support des fichiers contextuels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-purple-500/50 text-purple-400">
              {contextFiles.length} fichier(s) contextuel(s)
            </Badge>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader un fichier
                </Button>
              </DialogTrigger>
              <DialogContent className="dash-card border-white/[0.06] bg-[#12121a] text-white">
                <DialogHeader>
                  <DialogTitle>Uploader un fichier contextuel</DialogTitle>
                  <DialogDescription className="text-white/60">
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'files' | 'settings' | 'chat')} className="space-y-4">
          <TabsList className="dash-card border-white/[0.06] bg-white/[0.04] p-1">
            <TabsTrigger value="chat" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
              <Bot className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
              <FileText className="w-4 h-4 mr-2" />
              Fichiers ({contextFiles.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
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
            <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Paramètres de l'assistant</CardTitle>
                <CardDescription className="text-white/60">
                  Configurez le comportement de l'assistant contextuel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Mode de réponse</Label>
                  <p className="text-sm text-white/60">
                    L'assistant utilise automatiquement les fichiers contextuels pour fournir des réponses précises
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Utilisation des fichiers</Label>
                  <p className="text-sm text-white/60">
                    Par défaut, tous les fichiers sont utilisés. Vous pouvez sélectionner des fichiers spécifiques dans le chat.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="dash-card-glow border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Comment utiliser l'assistant contextuel ?</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Uploadez des fichiers contextuels (PDF, DOCX, TXT, etc.) pour fournir du contexte à l'assistant</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Posez des questions et l'assistant utilisera automatiquement les fichiers pour répondre</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Sélectionnez des fichiers spécifiques dans le panneau latéral pour cibler votre recherche</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
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
          className="bg-white/[0.04] border-white/[0.06] text-white mt-2"
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
          className="bg-white/[0.04] border-white/[0.06] text-white mt-2"
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
          className="border-white/[0.06] hover:bg-white/[0.04]"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={!file || isUploading}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
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
  const { t } = useI18n();
  const { toast } = useToast();

  const handleDelete = async (fileId: string, fileUrl: string) => {
    try {
      await deleteContextFile(fileId, fileUrl);
      onFilesChange(files.filter((f) => f.id !== fileId));
      toast({
        title: t('chatAssistant.fileDeleted'),
        description: t('chatAssistant.fileDeletedDesc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
    }
  };

  if (files.length === 0) {
    return (
      <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <p className="text-white/60 mb-2">{t('chatAssistant.noContextFiles')}</p>
          <p className="text-sm text-white/40">
            {t('chatAssistant.noContextFilesDesc')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <Card key={file.id} className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{getFileIcon(file.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{file.fileName}</p>
                <p className="text-xs text-white/60 mt-1">
                  {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
                {file.description && (
                  <p className="text-xs text-white/40 mt-2 line-clamp-2">{file.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
                className="flex-1 border-white/[0.06] hover:bg-white/[0.04]"
              >
                Ouvrir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(file.id, file.url)}
                className="border-red-600 text-red-400 hover:text-red-300"
              >
                {t('common.delete')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

