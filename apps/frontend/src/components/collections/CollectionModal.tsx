'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Input } from '@/components/ui/input';
import { X, Palette, Globe, Lock } from 'lucide-react';

interface CollectionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    color?: string;
    is_public?: boolean;
    tags?: string[];
  }) => Promise<void>;
  collection?: any;
  mode?: 'create' | 'edit';
}

const colors = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

export const CollectionModal = memo(function CollectionModal({
  open,
  onClose,
  onSubmit,
  collection,
  mode = 'create',
}: CollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (collection && mode === 'edit') {
      setName(collection.name || '');
      setDescription(collection.description || '');
      setColor(collection.color || '#6366f1');
      setIsPublic(collection.is_public || false);
      setTags(collection.tags || []);
    } else {
      setName('');
      setDescription('');
      setColor('#6366f1');
      setIsPublic(false);
      setTags([]);
    }
  }, [collection, mode, open]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        is_public: isPublic,
        tags: tags.length > 0 ? tags : undefined,
      });
    } finally {
      setSaving(false);
    }
  }, [name, description, color, isPublic, tags, onSubmit]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }, []);

  const colorsArray = useMemo(() => colors, []);
  
  const handleColorSelect = useCallback((selectedColor: string) => {
    setColor(selectedColor);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="bg-gray-800 border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {mode === 'edit' ? 'Modifier la collection' : 'Nouvelle collection'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom de la collection *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Designs Printemps 2025"
                className="bg-gray-900 border-gray-700 text-white"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez cette collection..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Couleur
              </label>
              <div className="flex flex-wrap gap-2">
                {colorsArray.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColorSelect(c)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      color === c
                        ? 'border-white scale-110'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Visibilité
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    isPublic
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  <Globe className="w-5 h-5 mx-auto mb-2 text-green-400" />
                  <p className="text-sm font-medium text-white">Publique</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Visible par tous
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    !isPublic
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  <Lock className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
                  <p className="text-sm font-medium text-white">Privée</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Visible uniquement par vous
                  </p>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Ajouter un tag..."
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="outline"
                  className="border-gray-700"
                >
                  Ajouter
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-700"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={saving || !name.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {saving
                  ? 'Enregistrement...'
                  : mode === 'edit'
                  ? 'Enregistrer'
                  : 'Créer'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
});

CollectionModal.displayName = 'CollectionModal';

export default function CollectionModalWithErrorBoundary(props: CollectionModalProps) {
  return (
    <ErrorBoundary componentName="CollectionModal">
      <CollectionModal {...props} />
    </ErrorBoundary>
  );
}
