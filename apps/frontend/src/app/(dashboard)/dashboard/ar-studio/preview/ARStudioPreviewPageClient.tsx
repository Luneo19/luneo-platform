/**
 * Client Component pour AR Studio Preview
 * Version professionnelle simplifiée
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ARPreviewHeader } from './components/ARPreviewHeader';
import { ARPreviewStats } from './components/ARPreviewStats';
import { ARModelsList } from './components/ARModelsList';
import { QRCodeModal } from './components/modals/QRCodeModal';
import { useARPreview } from './hooks/useARPreview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, QrCode } from 'lucide-react';
import type { ARMode } from './types';

export function ARStudioPreviewPageClient() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [previewMode, setPreviewMode] = useState<ARMode>('world');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<{ qrCode?: string; url?: string }>({});

  const {
    models,
    selectedModel,
    selectedModelData,
    isPreviewing,
    stats,
    isLoading,
    setSelectedModel,
    startPreview,
    stopPreview,
    generateQRCode,
  } = useARPreview(searchTerm, filterCategory);

  const handleStartPreview = async () => {
    if (!selectedModel) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un modèle',
        variant: 'destructive',
      });
      return;
    }

    await startPreview(selectedModel, previewMode);
  };

  const handleGenerateQR = async () => {
    if (!selectedModel) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un modèle',
        variant: 'destructive',
      });
      return;
    }

    const result = await generateQRCode(selectedModel);
    if (result.success) {
      setQrData({ qrCode: result.qrCode, url: result.url });
      setShowQRModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-16 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <ARPreviewHeader onStartPreview={handleStartPreview} isPreviewing={isPreviewing} />
      <ARPreviewStats stats={stats} />

      {selectedModelData && (
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">{selectedModelData.name}</h3>
              <p className="text-gray-400 text-sm">{selectedModelData.description}</p>
            </div>
            <div className="flex gap-2">
              <Select value={previewMode} onValueChange={(v) => setPreviewMode(v as ARMode)}>
                <SelectTrigger className="w-40 bg-gray-900 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="world">World Tracking</SelectItem>
                  <SelectItem value="face">Face Tracking</SelectItem>
                  <SelectItem value="image">Image Tracking</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleGenerateQR}
                className="border-gray-600"
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white pl-10"
              />
            </div>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48 bg-gray-900 border-gray-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="glasses">Lunettes</SelectItem>
              <SelectItem value="watch">Montres</SelectItem>
              <SelectItem value="jewelry">Bijoux</SelectItem>
              <SelectItem value="furniture">Mobilier</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 text-sm text-gray-400">
          {models.length} modèle{models.length > 1 ? 's' : ''} trouvé{models.length > 1 ? 's' : ''}
        </div>
      </Card>

      <ARModelsList
        models={models}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onStartPreview={handleStartPreview}
      />

      <QRCodeModal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrCodeUrl={qrData.qrCode}
        shareUrl={qrData.url}
        modelName={selectedModelData?.name}
      />
    </div>
  );
}



