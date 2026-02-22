'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import { api, endpoints } from '@/lib/api/client';
import { Check, Image as ImageIcon, Plus, Search, X } from 'lucide-react';
import Image from 'next/image';
import { memo, useEffect, useState, useMemo } from 'react';
import type { CollectionModalCollection } from './CollectionModal';

interface Design {
  id: string;
  name?: string;
  prompt?: string;
  preview_url?: string;
  created_at: string;
}

interface AddDesignsModalProps {
  open: boolean;
  onClose: () => void;
  collection: CollectionModalCollection & { id: string };
  onSuccess?: () => void;
}

function AddDesignsModalContent({
  open,
  onClose,
  collection,
  onSuccess,
}: AddDesignsModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesigns, setSelectedDesigns] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) {
      loadDesigns();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadDesigns = async () => {
    setLoading(true);
    try {
      const result = await endpoints.designs.list({ limit: 100 });
      const list = Array.isArray(result) ? result : (result as unknown as { designs?: Design[] })?.designs ?? [];
      setDesigns(list as Design[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('collections.unknownError');
      logger.error('Error loading designs for collection', { error, collectionId: collection.id });
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDesign = (designId: string) => {
    setSelectedDesigns((prev) => {
      const next = new Set(prev);
      if (next.has(designId)) {
        next.delete(designId);
      } else {
        next.add(designId);
      }
      return next;
    });
  };

  const handleAddDesigns = async () => {
    if (selectedDesigns.size === 0) {
      toast({
        title: t('collections.noDesignSelected'),
        description: t('collections.selectOneDesign'),
        variant: 'destructive',
      });
      return;
    }

    setAdding(true);
    try {
      const promises = Array.from(selectedDesigns).map((designId) =>
        api.post(`/api/v1/collections/${collection.id}/items`, { design_id: designId })
      );

      const results = await Promise.allSettled(promises);

      const errors: string[] = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          errors.push(`Design ${index + 1}`);
        }
      });

      if (errors.length > 0) {
        toast({
          title: t('common.error'),
          description: t('collections.designsAddErrorCount', { count: errors.length }),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('collections.designsAdded'),
          description: t('collections.designsAddedCount', { count: selectedDesigns.size }),
        });
        setSelectedDesigns(new Set());
        onSuccess?.();
        onClose();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('collections.unknownError');
      logger.error('Error adding designs to collection', { error, collectionId: collection.id });
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  // Optimisé: useMemo pour filteredDesigns
  const filteredDesigns = useMemo(() => 
    designs.filter((design) =>
      (design.name || design.prompt || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [designs, searchTerm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="bg-gray-800 border-gray-700 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Ajouter des designs à "{collection.name}"
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {selectedDesigns.size > 0
                  ? `${selectedDesigns.size} design(s) sélectionné(s)`
                  : 'Sélectionnez les designs à ajouter'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0" aria-label="Close">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.searchDesign')}
              className="pl-10 bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredDesigns.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm ? 'Aucun design trouvé' : 'Aucun design disponible'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDesigns.map((design) => {
                const isSelected = selectedDesigns.has(design.id);
                return (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => handleToggleDesign(design.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/50'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {design.preview_url ? (
                      <Image
                        src={design.preview_url}
                        alt={design.name || design.prompt || 'Design'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white truncate">
                        {design.name || design.prompt || 'Sans titre'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {selectedDesigns.size > 0
              ? `${selectedDesigns.size} design(s) sélectionné(s)`
              : 'Sélectionnez au moins un design'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="border-gray-700">
              Annuler
            </Button>
            <Button
              onClick={handleAddDesigns}
              disabled={selectedDesigns.size === 0 || adding}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {adding ? (
                'Ajout...'
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter {selectedDesigns.size > 0 && `(${selectedDesigns.size})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

const AddDesignsModalMemo = memo(AddDesignsModalContent);

// Named export for direct imports
export const AddDesignsModal = AddDesignsModalMemo;

// Default export with error boundary
export default function AddDesignsModalWithErrorBoundary(props: AddDesignsModalProps) {
  return (
    <ErrorBoundary componentName="AddDesignsModal">
      <AddDesignsModalMemo {...props} />
    </ErrorBoundary>
  );
}
