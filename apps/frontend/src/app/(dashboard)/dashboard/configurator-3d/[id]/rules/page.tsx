/**
 * Rules Editor Page - Condition -> Action rules with priority
 */

'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Configurator3DRule, RuleType } from '@/lib/configurator-3d/types/configurator.types';

export default function RulesEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'DEPENDENCY' as RuleType, priority: 0 });

  const { data: rules, isLoading } = useQuery({
    queryKey: ['configurator3d', 'rules', id],
    queryFn: () => configurator3dEndpoints.rules.list(id),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => configurator3dEndpoints.rules.create(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurator3d', 'rules', id] });
      toast({ title: 'Rule added' });
      setAddDialogOpen(false);
      setForm({ name: '', type: 'DEPENDENCY', priority: 0 });
    },
    onError: () => toast({ title: 'Failed to add', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: Record<string, unknown> }) =>
      configurator3dEndpoints.rules.update(id, ruleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurator3d', 'rules', id] });
      toast({ title: 'Rule updated' });
    },
    onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => configurator3dEndpoints.rules.delete(id, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurator3d', 'rules', id] });
      toast({ title: 'Rule deleted' });
    },
    onError: () => toast({ title: 'Failed to delete', variant: 'destructive' }),
  });

  const items = (Array.isArray(rules) ? rules : (rules as { data?: Configurator3DRule[] } | undefined)?.data) ?? [];

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    createMutation.mutate({
      name: form.name,
      type: form.type,
      priority: form.priority,
      isEnabled: true,
      conditions: [],
      actions: [],
    });
  };

  const toggleEnabled = (r: Configurator3DRule) => {
    updateMutation.mutate({ ruleId: r.id, data: { isEnabled: !r.isEnabled } });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/configurator-3d/${id}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Rules</h1>
            <p className="text-muted-foreground">Define conditions and actions for your configurator</p>
          </div>
        </div>
        <Button onClick={() => { setForm({ name: '', type: 'DEPENDENCY', priority: items.length }); setAddDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rule List</CardTitle>
          <CardDescription>
            Rules run in priority order. Condition (component + operator + value) → Action (show/hide, enable/disable, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <p>No rules yet. Add rules to control visibility, dependencies, and pricing.</p>
              <Button variant="outline" className="mt-4" onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {items
                .sort((a, b) => a.priority - b.priority)
                .map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-4 rounded-lg border p-4 ${!r.isEnabled ? 'opacity-60' : ''}`}
                  >
                    <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Priority {r.priority} · {r.type} · {r.conditions?.length ?? 0} conditions → {r.actions?.length ?? 0} actions
                      </p>
                    </div>
                    <Switch checked={r.isEnabled} onCheckedChange={() => toggleEnabled(r)} />
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this rule?')) deleteMutation.mutate(r.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Rules</CardTitle>
          <CardDescription>Input selections and see which rules fire (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select options in the configurator and rules will apply in real-time.</p>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Rule</DialogTitle>
            <DialogDescription>Create a new rule. Configure conditions and actions in the rule editor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Hide engraving when size is small"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as RuleType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEPENDENCY">Dependency</SelectItem>
                  <SelectItem value="EXCLUSION">Exclusion</SelectItem>
                  <SelectItem value="COMBINATION">Combination</SelectItem>
                  <SelectItem value="VISIBILITY">Visibility</SelectItem>
                  <SelectItem value="PRICING">Pricing</SelectItem>
                  <SelectItem value="VALIDATION">Validation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority (lower = runs first)</Label>
              <Input
                type="number"
                min={0}
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
