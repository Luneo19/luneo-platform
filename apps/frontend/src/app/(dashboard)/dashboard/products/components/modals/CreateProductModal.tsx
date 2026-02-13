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



