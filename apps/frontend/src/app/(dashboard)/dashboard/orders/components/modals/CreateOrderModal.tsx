/**
 * Modal de création de commande
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
import { RefreshCw, Plus, X, Save } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import type { ShippingAddress } from '../../types';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  designId?: string;
}

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    customerNotes?: string;
  }) => Promise<{ success: boolean }>;
}

export function CreateOrderModal({
  open,
  onOpenChange,
  onCreate,
}: CreateOrderModalProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<OrderItem[]>([
    { productId: '', productName: '', quantity: 1, price: 0, totalPrice: 0 },
  ]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    street: '',
    city: '',
    postal_code: '',
    country: 'FR',
    phone: '',
  });
  const [customerNotes, setCustomerNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddItem = () => {
    setItems([
      ...items,
      { productId: '', productName: '', quantity: 1, price: 0, totalPrice: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'price') {
      newItems[index].totalPrice =
        newItems[index].quantity * newItems[index].price;
    }
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await onCreate({
        items: items.filter((item) => item.productId && item.productName),
        shippingAddress,
        customerNotes: customerNotes || undefined,
      });
      if (result.success) {
        setItems([
          { productId: '', productName: '', quantity: 1, price: 0, totalPrice: 0 },
        ]);
        setShippingAddress({
          name: '',
          street: '',
          city: '',
          postal_code: '',
          country: 'FR',
          phone: '',
        });
        setCustomerNotes('');
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
          <DialogTitle>{t('orders.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('orders.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-gray-700">{t('orders.items')} *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="border-gray-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('orders.addItem')}
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="col-span-5">
                    <Input
                      placeholder={t('orders.productNamePlaceholder')}
                      value={item.productName}
                      onChange={(e) =>
                        handleItemChange(index, 'productName', e.target.value)
                      }
                      className="bg-white border-gray-200 text-gray-900"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder={t('orders.quantityPlaceholder')}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'quantity',
                          parseInt(e.target.value) || 1
                        )
                      }
                      min="1"
                      className="bg-white border-gray-200 text-gray-900"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={t('orders.unitPrice')}
                      value={item.price}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'price',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="bg-white border-gray-200 text-gray-900"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={`€${item.totalPrice.toFixed(2)}`}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-600"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <Label className="text-gray-700 mb-4 block">{t('orders.fullAddress')}</Label>
            <div className="space-y-3">
              <Input
                placeholder={t('orders.fullNamePlaceholder')}
                value={shippingAddress.name}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, name: e.target.value })
                }
                className="bg-white border-gray-200 text-gray-900"
                required
              />
              <Input
                placeholder={t('orders.streetPlaceholder')}
                value={shippingAddress.street}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    street: e.target.value,
                  })
                }
                className="bg-white border-gray-200 text-gray-900"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder={t('orders.postalCodePlaceholder')}
                  value={shippingAddress.postal_code}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      postal_code: e.target.value,
                    })
                  }
                  className="bg-white border-gray-200 text-gray-900"
                  required
                />
                <Input
                  placeholder={t('orders.cityPlaceholder')}
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      city: e.target.value,
                    })
                  }
                  className="bg-white border-gray-200 text-gray-900"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder={t('orders.countryPlaceholder')}
                  value={shippingAddress.country}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      country: e.target.value,
                    })
                  }
                  className="bg-white border-gray-200 text-gray-900"
                  required
                />
                <Input
                  placeholder={t('orders.phonePlaceholder')}
                  value={shippingAddress.phone || ''}
                  onChange={(e) =>
                    setShippingAddress({
                      ...shippingAddress,
                      phone: e.target.value,
                    })
                  }
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-gray-700">{t('orders.notesOptional')}</Label>
            <Textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder={t('orders.notesPlaceholder')}
              rows={3}
              className="bg-white border-gray-200 text-gray-900 mt-1 resize-none"
            />
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
              disabled={saving || items.length === 0}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('orders.creating')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('orders.createOrder')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



