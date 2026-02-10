'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Grid3X3,
  Package,
  AlertTriangle,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/lib/api/client';

export interface Variant {
  id: string;
  name: string;
  sku: string | null;
  attributes: Record<string, string>;
  price: number | null;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
}

interface ProductVariantsTabProps {
  productId: string;
}

const DEFAULT_THRESHOLD = 5;

function getStockIndicator(stock: number, threshold: number) {
  if (stock <= threshold) return 'red';
  if (stock <= threshold * 2) return 'orange';
  return 'green';
}

export function ProductVariantsTab({ productId }: ProductVariantsTabProps) {
  const { toast } = useToast();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<string>('');
  const [savingStock, setSavingStock] = useState(false);

  // Add variant form
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('0');
  const [newAttributes, setNewAttributes] = useState('');
  const [adding, setAdding] = useState(false);

  // Matrix generator
  const [matrixInputs, setMatrixInputs] = useState<{ type: string; values: string }[]>([
    { type: 'Couleur', values: 'Or Rose, Argent, Platine' },
    { type: 'Taille', values: '48, 50, 52, 54' },
  ]);
  const [basePrice, setBasePrice] = useState('');
  const [baseStock, setBaseStock] = useState('0');

  const fetchVariants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await endpoints.products.variants.list(productId);
      const data = Array.isArray(res) ? res : (res as { data?: Variant[] })?.data ?? [];
      setVariants(
        (data as Variant[]).map((v) => ({
          ...v,
          price: v.price != null ? Number(v.price) : null,
          attributes: typeof v.attributes === 'object' && v.attributes != null ? v.attributes : {},
        }))
      );
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les variantes.',
        variant: 'destructive',
      });
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    const attrs: Record<string, string> = {};
    newAttributes.split(',').forEach((pair) => {
      const [k, v] = pair.split(':').map((s) => s.trim());
      if (k && v) attrs[k] = v;
    });
    if (!newName.trim()) {
      toast({ title: 'Nom requis', variant: 'destructive' });
      return;
    }
    setAdding(true);
    try {
      await endpoints.products.variants.create(productId, {
        name: newName.trim(),
        sku: newSku.trim() || undefined,
        attributes: Object.keys(attrs).length ? attrs : { Variante: newName.trim() },
        price: newPrice ? parseFloat(newPrice) : undefined,
        stock: parseInt(newStock, 10) || 0,
      });
      toast({ title: 'Variante ajoutée' });
      setAddModalOpen(false);
      setNewName('');
      setNewSku('');
      setNewPrice('');
      setNewStock('0');
      setNewAttributes('');
      fetchVariants();
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible d’ajouter la variante.',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteVariant = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await endpoints.products.variants.delete(productId, deleteTarget.id);
      toast({ title: 'Variante supprimée' });
      setDeleteTarget(null);
      fetchVariants();
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la variante.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkGenerate = async () => {
    const attributeOptions: Record<string, string[]> = {};
    for (const row of matrixInputs) {
      const type = row.type.trim();
      if (!type) continue;
      const values = row.values
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (values.length) attributeOptions[type] = values;
    }
    if (Object.keys(attributeOptions).length === 0) {
      toast({
        title: 'Saisie requise',
        description: 'Renseignez au moins un type et des valeurs (séparées par des virgules).',
        variant: 'destructive',
      });
      return;
    }
    setBulkGenerating(true);
    try {
      await endpoints.products.variants.bulkCreate(productId, {
        attributeOptions,
        basePrice: basePrice ? parseFloat(basePrice) : undefined,
        baseStock: baseStock ? parseInt(baseStock, 10) : undefined,
      });
      toast({ title: 'Variantes générées', description: 'La matrice a été créée.' });
      fetchVariants();
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer les variantes.',
        variant: 'destructive',
      });
    } finally {
      setBulkGenerating(false);
    }
  };

  const startEditStock = (v: Variant) => {
    setEditingStockId(v.id);
    setEditingStockValue(String(v.stock));
  };

  const saveStock = async () => {
    if (editingStockId == null) return;
    const value = parseInt(editingStockValue, 10);
    if (Number.isNaN(value) || value < 0) {
      toast({ title: 'Stock invalide', variant: 'destructive' });
      return;
    }
    setSavingStock(true);
    try {
      await endpoints.products.variants.updateStock(productId, editingStockId, value);
      setVariants((prev) =>
        prev.map((x) => (x.id === editingStockId ? { ...x, stock: value } : x))
      );
      setEditingStockId(null);
      setEditingStockValue('');
      toast({ title: 'Stock mis à jour' });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le stock.',
        variant: 'destructive',
      });
    } finally {
      setSavingStock(false);
    }
  };

  const addMatrixRow = () => {
    setMatrixInputs((prev) => [...prev, { type: '', values: '' }]);
  };

  const removeMatrixRow = (index: number) => {
    setMatrixInputs((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Variantes
          </CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter une variante
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : variants.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Aucune variante. Ajoutez-en une ou utilisez le générateur de matrice ci-dessous.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Attributs</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((v) => {
                    const threshold = v.lowStockThreshold ?? DEFAULT_THRESHOLD;
                    const indicator = getStockIndicator(v.stock, threshold);
                    const stockColor =
                      indicator === 'red'
                        ? 'text-red-600 font-medium'
                        : indicator === 'orange'
                          ? 'text-amber-600'
                          : 'text-green-600';
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell className="text-muted-foreground">{v.sku ?? '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(v.attributes || {}).map(([k, val]) => (
                              <Badge key={k} variant="secondary" className="text-xs">
                                {k}: {val}
                              </Badge>
                            ))}
                            {Object.keys(v.attributes || {}).length === 0 && '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {v.price != null ? `${Number(v.price).toFixed(2)} €` : '—'}
                        </TableCell>
                        <TableCell>
                          {editingStockId === v.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                value={editingStockValue}
                                onChange={(e) => setEditingStockValue(e.target.value)}
                                className="w-20 h-8"
                                autoFocus
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={saveStock}
                                disabled={savingStock}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingStockId(null);
                                  setEditingStockValue('');
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className={`inline-flex items-center gap-1 cursor-pointer hover:underline ${stockColor}`}
                              onClick={() => startEditStock(v)}
                            >
                              {indicator === 'red' && <AlertTriangle className="h-3.5 w-3.5" />}
                              {v.stock}
                            </button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget({ id: v.id, name: v.name })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Grid3X3 className="h-4 w-4" />
            Générateur de matrice
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Définissez des types d’attributs et des valeurs (séparées par des virgules). Chaque
            combinaison créera une variante.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {matrixInputs.map((row, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Type (ex: Couleur)"
                value={row.type}
                onChange={(e) =>
                  setMatrixInputs((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], type: e.target.value };
                    return next;
                  })
                }
                className="max-w-[180px]"
              />
              <Input
                placeholder="Valeurs (ex: Or Rose, Argent, Platine)"
                value={row.values}
                onChange={(e) =>
                  setMatrixInputs((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], values: e.target.value };
                    return next;
                  })
                }
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeMatrixRow(index)}
                disabled={matrixInputs.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-4 items-center">
            <Button type="button" variant="outline" size="sm" onClick={addMatrixRow}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un type
            </Button>
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Prix de base</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Optionnel"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-24"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Stock de base</Label>
              <Input
                type="number"
                min={0}
                value={baseStock}
                onChange={(e) => setBaseStock(e.target.value)}
                className="w-24"
              />
            </div>
            <Button
              type="button"
              onClick={handleBulkGenerate}
              disabled={bulkGenerating}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {bulkGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Grid3X3 className="h-4 w-4 mr-2" />
              )}
              Générer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add variant modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle>Ajouter une variante</DialogTitle>
            <DialogDescription>
              Renseignez le nom et les attributs. Optionnel : SKU, prix, stock.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddVariant} className="space-y-4">
            <div>
              <Label>Nom *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex: Or Rose - Taille 52"
                className="mt-1"
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="Optionnel"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Attributs (clé: valeur, séparés par des virgules)</Label>
              <Input
                value={newAttributes}
                onChange={(e) => setNewAttributes(e.target.value)}
                placeholder="Couleur: Or Rose, Taille: 52"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prix (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Optionnel"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  min={0}
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={adding} className="bg-cyan-600 hover:bg-cyan-700">
                {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle>Supprimer la variante</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la variante « {deleteTarget?.name} » ? Cette
              action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVariant}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
