/**
 * Modal de création de produit
 */

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
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
import { RefreshCw, Save, Upload, X as XIcon } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
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
  const { t } = useI18n();
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    category: 'OTHER' as ProductCategory,
    price: 0,
    currency: 'EUR',
    isActive: true,
    status: 'DRAFT' as ProductStatus,
    images: [],
  });
  const [saving, setSaving] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setImagePreviews((prev) => [...prev, dataUrl]);
        setFormData((prev) => ({
          ...prev,
          images: [...(prev.images || []), dataUrl],
        }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

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
          images: [],
        });
        setImagePreviews([]);
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-gray-200 text-gray-900 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('products.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('products.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-700">{t('products.name')} *</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t('products.productNamePlaceholder')}
              className="bg-white border-gray-200 text-gray-900 mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-gray-700">{t('products.description')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t('products.descriptionPlaceholder')}
              rows={4}
              className="bg-white border-gray-200 text-gray-900 mt-1 resize-none"
            />
          </div>
          {/* Images */}
          <div>
            <Label className="text-gray-700">Images</Label>
            <div className="mt-1 space-y-2">
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                      <Image src={src} alt={`Image ${i + 1}`} fill className="object-cover" sizes="80px" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-gray-200 text-gray-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Ajouter des images
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700">{t('products.category')} *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value as ProductCategory,
                  })
                }
              >
                <SelectTrigger className="bg-white border-gray-200 text-gray-900 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => {
                    const Icon = cat.icon;
                    const labelKey = `products.categories.${cat.value}` as keyof typeof t;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {t(labelKey as string)}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700">{t('products.price')}</Label>
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
                className="bg-white border-gray-200 text-gray-900 mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700">{t('products.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as ProductStatus })
                }
              >
                <SelectTrigger className="bg-white border-gray-200 text-gray-900 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.filter((s) => s.value !== 'all').map(
                    (status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {t(`products.${status.value.toLowerCase()}` as string)}
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
                <Label htmlFor="is-active" className="text-gray-700 cursor-pointer">
                  {t('products.productActive')}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-200"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('products.creating')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('common.create')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



