'use client';

import React, { useState } from 'react';
import { Brain, Plus, Trash2, Pencil, Filter, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSegments } from '@/hooks/admin/use-segments';

const PROPERTIES = [
  { value: 'plan', label: 'Plan' },
  { value: 'sessions_per_month', label: 'Sessions / month' },
  { value: 'mrr', label: 'MRR' },
  { value: 'days_since_login', label: 'Days since login' },
  { value: 'signup_date', label: 'Signup date' },
  { value: 'usage_percent', label: 'Usage %' },
  { value: 'activity', label: 'Activity level' },
];

const OPERATORS = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater or equal' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less or equal' },
  { value: 'contains', label: 'contains' },
];

type ConditionRow = { property: string; operator: string; value: string };

export default function OrionSegmentsPage() {
  const { segments, isLoading, isError, error, createSegment, deleteSegment } = useSegments();
  const [logicMode, setLogicMode] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<ConditionRow[]>([
    { property: 'sessions_per_month', operator: 'gt', value: '' },
  ]);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [segmentType, setSegmentType] = useState('Behavioral');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addCondition = () => {
    setConditions((c) => [...c, { property: 'plan', operator: 'is', value: '' }]);
  };

  const removeCondition = (index: number) => {
    setConditions((c) => c.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof ConditionRow, value: string) => {
    setConditions((c) =>
      c.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSaveSegment = async () => {
    const name = segmentName.trim();
    if (!name) {
      setCreateError('Segment name is required');
      return;
    }
    setCreateError(null);
    setCreateLoading(true);
    try {
      await createSegment({
        name,
        description: segmentDescription.trim() || undefined,
        type: segmentType,
        conditions: conditions.map((c) => ({
          property: c.property,
          operator: c.operator,
          value: c.value.trim(),
        })),
      });
      setSegmentName('');
      setSegmentDescription('');
      setSegmentType('Behavioral');
      setConditions([{ property: 'sessions_per_month', operator: 'gt', value: '' }]);
    } catch {
      setCreateError('Failed to create segment');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSegment(id);
    } finally {
      setDeletingId(null);
    }
  };

  const totalSegmented = segments.reduce((acc, s) => acc + (s.userCount ?? 0), 0);
  const activeFilters = conditions.filter((c) => c.value.trim()).length;

  const segmentTypeDisplay = (seg: { type?: string | null; criteria?: Record<string, unknown> }) => {
    if (seg.type) return seg.type;
    const criteria = seg.criteria as { type?: string } | undefined;
    return criteria?.type ?? 'Behavioral';
  };

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
          <Brain className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">ATHENA - Segment Builder</h1>
          <p className="text-zinc-400 text-sm">Build and manage user segments with conditions</p>
        </div>
      </div>

      {isError && (
        <Card className="bg-zinc-800/80 border-zinc-600">
          <CardContent className="py-4 text-zinc-400">
            No data available. Segments API is not available. You can still create segments when the API is back.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">Total segments</div>
            <div className="text-2xl font-semibold text-zinc-100">
              {isLoading ? '—' : segments.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Users className="h-4 w-4" /> Users segmented
            </div>
            <div className="text-2xl font-semibold text-zinc-100">
              {isLoading ? '—' : totalSegmented}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Filter className="h-4 w-4" /> Active filters
            </div>
            <div className="text-2xl font-semibold text-zinc-100">{activeFilters}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100">Visual Segment Builder</CardTitle>
          <CardDescription className="text-zinc-400">
            Add conditions and combine with AND/OR logic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-400">Segment name</Label>
              <Input
                placeholder="e.g. Power Users"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Type</Label>
              <Select value={segmentType} onValueChange={setSegmentType}>
                <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="Behavioral" className="text-zinc-100 focus:bg-zinc-700">
                    Behavioral
                  </SelectItem>
                  <SelectItem value="Plan-based" className="text-zinc-100 focus:bg-zinc-700">
                    Plan-based
                  </SelectItem>
                  <SelectItem value="Revenue" className="text-zinc-100 focus:bg-zinc-700">
                    Revenue
                  </SelectItem>
                  <SelectItem value="Use-case" className="text-zinc-100 focus:bg-zinc-700">
                    Use-case
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Description</Label>
            <Input
              placeholder="Short description of this segment"
              value={segmentDescription}
              onChange={(e) => setSegmentDescription(e.target.value)}
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm">Conditions (combine with)</span>
            <Button
              variant={logicMode === 'AND' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLogicMode('AND')}
              className={
                logicMode === 'AND'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0'
                  : 'border-zinc-600 text-zinc-400 hover:bg-zinc-700'
              }
            >
              AND
            </Button>
            <Button
              variant={logicMode === 'OR' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLogicMode('OR')}
              className={
                logicMode === 'OR'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0'
                  : 'border-zinc-600 text-zinc-400 hover:bg-zinc-700'
              }
            >
              OR
            </Button>
          </div>

          <div className="space-y-3">
            {conditions.map((row, index) => (
              <div
                key={index}
                className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-zinc-700/50 border border-zinc-600"
              >
                <Select
                  value={row.property}
                  onValueChange={(v) => updateCondition(index, 'property', v)}
                >
                  <SelectTrigger className="w-[160px] bg-zinc-800 border-zinc-600 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {PROPERTIES.map((p) => (
                      <SelectItem
                        key={p.value}
                        value={p.value}
                        className="text-zinc-100 focus:bg-zinc-700"
                      >
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={row.operator}
                  onValueChange={(v) => updateCondition(index, 'operator', v)}
                >
                  <SelectTrigger className="w-[140px] bg-zinc-800 border-zinc-600 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {OPERATORS.map((o) => (
                      <SelectItem
                        key={o.value}
                        value={o.value}
                        className="text-zinc-100 focus:bg-zinc-700"
                      >
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Value"
                  value={row.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                  className="w-[120px] bg-zinc-800 border-zinc-600 text-zinc-100"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCondition(index)}
                  className="text-zinc-400 hover:text-red-400 hover:bg-zinc-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addCondition}
              className="border-zinc-600 text-zinc-400 hover:bg-zinc-700"
            >
              <Plus className="h-4 w-4 mr-2" /> Add condition
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2">
            {createError && (
              <span className="text-red-400 text-sm">{createError}</span>
            )}
            <div className="flex-1" />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSaveSegment}
              disabled={createLoading}
            >
              {createLoading ? 'Saving…' : 'Save segment'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100">Existing segments</CardTitle>
          <CardDescription className="text-zinc-400">Click edit or delete to manage</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-zinc-400">Loading segments…</div>
          ) : segments.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              {isError ? 'No data available.' : 'No segments yet. Create one above.'}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {segments.map((seg) => {
                const typeLabel = segmentTypeDisplay(seg);
                return (
                  <Card
                    key={seg.id}
                    className="bg-zinc-700/50 border-zinc-600 hover:border-zinc-500 transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-zinc-100 text-lg">{seg.name}</CardTitle>
                          <CardDescription className="text-zinc-400 text-sm mt-1">
                            {seg.description ?? '—'}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            typeLabel === 'Behavioral'
                              ? 'border-emerald-500/50 text-emerald-400'
                              : typeLabel === 'Plan-based'
                                ? 'border-blue-500/50 text-blue-400'
                                : typeLabel === 'Revenue'
                                  ? 'border-amber-500/50 text-amber-400'
                                  : 'border-zinc-500 text-zinc-400'
                          }
                        >
                          {typeLabel}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-sm">
                          <Users className="h-4 w-4 inline mr-1" />
                          {seg.userCount ?? 0} users
                        </span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-200">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-red-400"
                            onClick={() => handleDelete(seg.id)}
                            disabled={deletingId === seg.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
