/**
 * Modal d'édition de produit
 */

'use client';

import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Save, Info, Package } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { CATEGORIES, STATUS_OPTIONS } from '../../constants/products';
import { ProductVariantsTab } from '../ProductVariantsTab';
import type { Product, ProductCategory, ProductStatus } from '@/lib/types/product';

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onUpdate: (product: Partial<Product>) => Promise<{ success: boolean }>;
}

export function EditProductModal({
  open,
  onOpenChange,
  product,
  onUpdate,
}: EditProductModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Partial<Product>>(product);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(product);
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await onUpdate(formData);
      if (result.success) {
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white border-gray-200 text-gray-900 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('products.editTitle')}</DialogTitle>
          <DialogDescription>
            {t('products.editDescription')}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="infos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="infos" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              {t('products.infos')}
            </TabsTrigger>
            <TabsTrigger value="variantes" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t('products.variants')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="infos" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-gray-700">{t('products.name')} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {t(`products.categories.${cat.value}` as string)}
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
                      id="is-active-edit"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          isActive: checked as boolean,
                        })
                      }
                    />
                    <Label
                      htmlFor="is-active-edit"
                      className="text-gray-700 cursor-pointer"
                    >
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
                      {t('products.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {t('common.save')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="variantes" className="mt-4">
            {product?.id ? (
              <ProductVariantsTab productId={product.id} />
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                {t('products.saveFirstVariants')}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}



