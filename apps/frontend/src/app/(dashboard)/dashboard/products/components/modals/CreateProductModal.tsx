/**
 * Modal de création de produit
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Save } from 'lucide-react';
import { CATEGORIES, STATUS_OPTIONS } from '../../constants/products';
import type { Product, ProductCategory, ProductStatus } from '@/lib/types/product';

interface CreateProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (product: Partial<Product>) => Promise<{ success: boolean }>;
}

export function CreateProductModal({
  open,
  onOpenChange,
  onCreate,
}: CreateProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    category: 'OTHER' as ProductCategory,
    price: 0,
    currency: 'EUR',
    isActive: true,
    status: 'DRAFT' as ProductStatus,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await onCreate(formData);
      if (result.success) {
        setFormData({
          name: '',
          description: '',
          category: 'OTHER' as ProductCategory,
          price: 0,
          currency: 'EUR',
          isActive: true,
          status: 'DRAFT' as ProductStatus,
        });
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau produit</DialogTitle>
          <DialogDescription>
            Créez un nouveau produit pour votre catalogue
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-300">Nom du produit *</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Bague en or avec diamant"
              className="bg-gray-900 border-gray-600 text-white mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-gray-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Décrivez votre produit..."
              rows={4}
              className="bg-gray-900 border-gray-600 text-white mt-1 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value as ProductCategory,
                  })
                }
              >
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Prix</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="bg-gray-900 border-gray-600 text-white mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as ProductStatus })
                }
              >
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.filter((s) => s.value !== 'all').map(
                    (status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      isActive: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is-active" className="text-gray-300 cursor-pointer">
                  Produit actif
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


