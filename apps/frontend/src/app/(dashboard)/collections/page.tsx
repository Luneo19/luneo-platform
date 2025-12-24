'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import Image from 'next/image';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Grid,
  List,
  Star,
  Lock,
  Globe,
  Image as ImageIcon,
  Palette,
  Calendar,
  Users,
  Heart,
  Share2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCollections } from '@/lib/hooks/useCollections';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-states/EmptyState';
import { CollectionModal } from '@/components/collections/CollectionModal';
import { AddDesignsModal } from '@/components/collections/AddDesignsModal';
import { CollectionsSkeleton } from '@/components/ui/skeletons';

/**
 * Page Collections Dashboard
 * Gestion complète CRUD des collections
 */
function CollectionsPage() {
  const { toast } = useToast();
  const {
    collections,
    loading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    refresh,
  } = useCollections();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterPublic, setFilterPublic] = useState<'all' | 'public' | 'private'>('all');
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddDesignsModalOpen, setIsAddDesignsModalOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

  // Optimisé: useMemo pour filteredCollections
  const filteredCollections = useMemo(() => collections.filter((collection) => {
    const matchesSearch = collection.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.tags?.some((tag: string) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesFilter =
      filterPublic === 'all' ||
      (filterPublic === 'public' && collection.is_public) ||
      (filterPublic === 'private' && !collection.is_public);

    return matchesSearch && matchesFilter;
  }), [collections, searchTerm, filterPublic]);

  // Optimisé: useMemo pour stats
  const stats = useMemo(() => ({
    total: collections.length,
    public: collections.filter((c) => c.is_public).length,
    private: collections.filter((c) => !c.is_public).length,
    totalDesigns: collections.reduce((sum, c) => sum + (c.designs_count || 0), 0),
    totalViews: collections.reduce((sum, c) => sum + (c.views_count || 0), 0),
  }), [collections]);

  const handleCreateCollection = async (data: {
    name: string;
    description?: string;
    color?: string;
    is_public?: boolean;
    tags?: string[];
  }) => {
    try {
      await createCollection(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Collection créée',
        description: `La collection "${data.name}" a été créée avec succès`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la collection',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateCollection = async (data: {
    name: string;
    description?: string;
    color?: string;
    is_public?: boolean;
    tags?: string[];
  }) => {
    if (!selectedCollection) return;

    try {
      await updateCollection(selectedCollection.id, data);
      setIsEditModalOpen(false);
      setSelectedCollection(null);
      toast({
        title: 'Collection mise à jour',
        description: `La collection "${data.name}" a été mise à jour`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour la collection',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await deleteCollection(id);
      setCollectionToDelete(null);
      toast({
        title: 'Collection supprimée',
        description: 'La collection a été supprimée avec succès',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la collection',
        variant: 'destructive',
      });
    }
  };

  const handleOpenEdit = (collection: any) => {
    setSelectedCollection(collection);
    setIsEditModalOpen(true);
  };

  const handleOpenAddDesigns = (collection: any) => {
    setSelectedCollection(collection);
    setIsAddDesignsModalOpen(true);
  };

  if (loading) {
    return <CollectionsSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<FolderOpen className="w-16 h-16" />}
        title="Erreur de chargement"
        description={error}
        action={{
          label: 'Réessayer',
          onClick: refresh,
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Collections
          </h1>
          <p className="text-gray-400">
            Organisez vos designs en collections
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle collection
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Total',
            value: stats.total,
            icon: <FolderOpen className="w-5 h-5" />,
            color: 'blue',
          },
          {
            label: 'Publiques',
            value: stats.public,
            icon: <Globe className="w-5 h-5" />,
            color: 'green',
          },
          {
            label: 'Privées',
            value: stats.private,
            icon: <Lock className="w-5 h-5" />,
            color: 'yellow',
          },
          {
            label: 'Designs',
            value: stats.totalDesigns,
            icon: <ImageIcon className="w-5 h-5" />,
            color: 'purple',
          },
          {
            label: 'Vues',
            value: stats.totalViews,
            icon: <Eye className="w-5 h-5" />,
            color: 'pink',
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="p-4 bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  stat.color === 'blue'
                    ? 'bg-blue-500/10 text-blue-400'
                    : stat.color === 'green'
                    ? 'bg-green-500/10 text-green-400'
                    : stat.color === 'yellow'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : stat.color === 'purple'
                    ? 'bg-purple-500/10 text-purple-400'
                    : 'bg-pink-500/10 text-pink-400'
                }`}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une collection..."
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterPublic === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterPublic('all')}
            className="border-gray-700"
          >
            Toutes
          </Button>
          <Button
            variant={filterPublic === 'public' ? 'default' : 'outline'}
            onClick={() => setFilterPublic('public')}
            className="border-gray-700"
          >
            <Globe className="w-4 h-4 mr-2" />
            Publiques
          </Button>
          <Button
            variant={filterPublic === 'private' ? 'default' : 'outline'}
            onClick={() => setFilterPublic('private')}
            className="border-gray-700"
          >
            <Lock className="w-4 h-4 mr-2" />
            Privées
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
            className="border-gray-700"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            className="border-gray-700"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Collections Grid/List */}
      {filteredCollections.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-16 h-16" />}
          title={
            searchTerm
              ? 'Aucune collection trouvée'
              : 'Aucune collection'
          }
          description={
            searchTerm
              ? `Aucune collection ne correspond à "${searchTerm}"`
              : 'Créez votre première collection pour organiser vos designs'
          }
          action={
            !searchTerm
              ? {
                  label: 'Créer une collection',
                  onClick: () => setIsCreateModalOpen(true),
                }
              : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onEdit={() => handleOpenEdit(collection)}
              onDelete={() => setCollectionToDelete(collection.id)}
              onAddDesigns={() => handleOpenAddDesigns(collection)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCollections.map((collection) => (
            <CollectionListItem
              key={collection.id}
              collection={collection}
              onEdit={() => handleOpenEdit(collection)}
              onDelete={() => setCollectionToDelete(collection.id)}
              onAddDesigns={() => handleOpenAddDesigns(collection)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CollectionModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCollection}
      />

      {selectedCollection && (
        <>
          <CollectionModal
            open={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedCollection(null);
            }}
            onSubmit={handleUpdateCollection}
            collection={selectedCollection}
            mode="edit"
          />

          <AddDesignsModal
            open={isAddDesignsModalOpen}
            onClose={() => {
              setIsAddDesignsModalOpen(false);
              setSelectedCollection(null);
            }}
            collection={selectedCollection}
            onSuccess={() => {
              refresh();
              setIsAddDesignsModalOpen(false);
            }}
          />
        </>
      )}

      {/* Delete Confirmation */}
      {collectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <Card className="p-6 bg-gray-800 border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              Supprimer la collection
            </h3>
            <p className="text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette collection ? Cette action
              est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setCollectionToDelete(null)}
                className="border-gray-700"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteCollection(collectionToDelete);
                }}
              >
                Supprimer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

const MemoizedCollectionsPage = memo(CollectionsPage);

export default function CollectionsPageWrapper() {
  return (
    <ErrorBoundary level="page" componentName="CollectionsPage">
      <MemoizedCollectionsPage />
    </ErrorBoundary>
  );
}

/**
 * Composant Card pour vue Grid
 */
function CollectionCard({
  collection,
  onEdit,
  onDelete,
  onAddDesigns,
}: {
  collection: any;
  onEdit: () => void;
  onDelete: () => void;
  onAddDesigns: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all group">
        <Link href={`/dashboard/collections/${collection.id}`}>
          <div
            className="aspect-video bg-gradient-to-br relative"
            style={{
              background: `linear-gradient(135deg, ${collection.color || '#6366f1'}20, ${collection.color || '#6366f1'}40)`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <FolderOpen
                className="w-16 h-16"
                style={{ color: collection.color || '#6366f1' }}
              />
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              {collection.is_public ? (
                <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Public
                </div>
              ) : (
                <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Privé
                </div>
              )}
            </div>
          </div>
        </Link>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <Link href={`/dashboard/collections/${collection.id}`}>
              <h3 className="font-semibold text-white hover:text-blue-400 transition-colors">
                {collection.name}
              </h3>
            </Link>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit();
                }}
                className="h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {collection.description && (
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {collection.description}
            </p>
          )}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                {collection.designs_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {collection.views_count || 0}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                onAddDesigns();
              }}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * Composant List Item pour vue List
 */
function CollectionListItem({
  collection,
  onEdit,
  onDelete,
  onAddDesigns,
}: {
  collection: any;
  onEdit: () => void;
  onDelete: () => void;
  onAddDesigns: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${collection.color || '#6366f1'}20, ${collection.color || '#6366f1'}40)`,
            }}
          >
            <FolderOpen
              className="w-8 h-8"
              style={{ color: collection.color || '#6366f1' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/dashboard/collections/${collection.id}`}>
                <h3 className="font-semibold text-white hover:text-blue-400 transition-colors">
                  {collection.name}
                </h3>
              </Link>
              {collection.is_public ? (
                <Globe className="w-4 h-4 text-green-400" />
              ) : (
                <Lock className="w-4 h-4 text-yellow-400" />
              )}
            </div>
            {collection.description && (
              <p className="text-sm text-gray-400 truncate">
                {collection.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                {collection.designs_count || 0} designs
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {collection.views_count || 0} vues
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {collection.likes_count || 0} likes
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onAddDesigns}
              className="border-gray-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter designs
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

