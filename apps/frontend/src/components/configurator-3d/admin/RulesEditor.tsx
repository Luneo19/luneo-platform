'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Gavel, Play, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type {
  Configurator3DRule,
  Configurator3DComponent,
  RuleType,
  RuleCondition,
  RuleAction,
  RuleActionType,
  RuleOperator,
} from '@/lib/configurator-3d/types/configurator.types';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';

const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: 'DEPENDENCY', label: 'Dependency' },
  { value: 'EXCLUSION', label: 'Exclusion' },
  { value: 'COMBINATION', label: 'Combination' },
  { value: 'VISIBILITY', label: 'Visibility' },
  { value: 'PRICING', label: 'Pricing' },
  { value: 'VALIDATION', label: 'Validation' },
];

const OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'in', label: 'in' },
  { value: 'not_in', label: 'not in' },
  { value: 'contains', label: 'contains' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater or equal' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less or equal' },
];

const ACTION_TYPES: { value: RuleActionType; label: string }[] = [
  { value: 'SHOW_COMPONENT', label: 'Show component' },
  { value: 'HIDE_COMPONENT', label: 'Hide component' },
  { value: 'ENABLE_OPTION', label: 'Enable option' },
  { value: 'DISABLE_OPTION', label: 'Disable option' },
  { value: 'SET_DEFAULT', label: 'Set default' },
  { value: 'SET_PRICE', label: 'Set price' },
  { value: 'VALIDATE', label: 'Validate' },
];

export interface RulesEditorProps {
  configId: string;
  rules: Configurator3DRule[];
  components: Configurator3DComponent[];
  onRulesChange: (rules: Configurator3DRule[]) => void;
  isLoading?: boolean;
  className?: string;
}

function formatCondition(c: RuleCondition, components: Configurator3DComponent[]): string {
  const comp = components.find((x) => x.id === c.componentId);
  const compName = comp?.name ?? c.componentId ?? '?';
  const op = OPERATORS.find((o) => o.value === c.operator)?.label ?? c.operator;
  const val = typeof c.value === 'object' ? JSON.stringify(c.value) : String(c.value);
  return `${compName} ${op} ${val}`;
}

function formatAction(a: RuleAction, components: Configurator3DComponent[]): string {
  const type = ACTION_TYPES.find((t) => t.value === a.type)?.label ?? a.type;
  const comp = components.find((x) => x.id === a.componentId);
  const compName = comp?.name ?? a.componentId ?? '?';
  if (a.optionId) {
    const opt = comp?.options?.find((o) => o.id === a.optionId);
    return `${type}: ${compName} → ${opt?.name ?? a.optionId}`;
  }
  if (a.priceModifier !== undefined) return `${type}: ${compName} (${a.priceModifier})`;
  return `${type}: ${compName}`;
}

export function RulesEditor({
  configId,
  rules,
  components,
  onRulesChange,
  isLoading = false,
  className,
}: RulesEditorProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleCreate = useCallback(
    (data: {
      name: string;
      description?: string;
      type: RuleType;
      conditions: RuleCondition[];
      actions: RuleAction[];
      priority: number;
      isEnabled: boolean;
    }) => {
      configurator3dEndpoints.rules
        .create(configId, data)
        .then((res) => {
          const created = (typeof res === 'object' && res !== null && 'id' in res)
            ? (res as Configurator3DRule)
            : (res as { data?: Configurator3DRule })?.data;
          if (created) onRulesChange([...rules, created]);
          setAddOpen(false);
        })
        .catch(() => {});
    },
    [configId, rules, onRulesChange]
  );

  const handleUpdate = useCallback(
    (id: string, data: Partial<Configurator3DRule>) => {
      configurator3dEndpoints.rules
        .update(configId, id, data)
        .then((res) => {
          const updated = (typeof res === 'object' && res !== null && 'id' in res)
            ? (res as Configurator3DRule)
            : (res as { data?: Configurator3DRule })?.data ?? data;
          onRulesChange(rules.map((r) => (r.id === id ? { ...r, ...updated } : r)));
        })
        .catch(() => {});
    },
    [configId, rules, onRulesChange]
  );

  const handleDelete = useCallback(
    (id: string) => {
      configurator3dEndpoints.rules
        .delete(configId, id)
        .then(() => {
          onRulesChange(rules.filter((r) => r.id !== id));
          setDeleteConfirmId(null);
        })
        .catch(() => {});
    },
    [configId, rules, onRulesChange]
  );

  const handleTest = useCallback(
    (rule: Configurator3DRule) => {
      configurator3dEndpoints.rules
        .validate(configId, { rule: rule as unknown as Record<string, unknown> })
        .then((res) => {
          const result = res as { valid?: boolean; errors?: unknown[] };
          setTestResult(
            result.valid
              ? 'Rule is valid'
              : `Errors: ${JSON.stringify(result.errors ?? [])}`
          );
          setTimeout(() => setTestResult(null), 3000);
        })
        .catch((err) => {
          setTestResult(`Error: ${err?.message ?? 'Validation failed'}`);
          setTimeout(() => setTestResult(null), 3000);
        });
    },
    [configId]
  );

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gavel className="h-5 w-5 text-primary" />
              Rules
            </CardTitle>
            <CardDescription>
              Define dependencies, exclusions, and validation rules
            </CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </DialogTrigger>
            <AddRuleDialog
              components={components}
              onAdd={handleCreate}
              onCancel={() => setAddOpen(false)}
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Zap className="mb-4 h-12 w-12 opacity-50" />
              <p className="font-medium">No rules yet</p>
              <p className="text-sm">Add rules to control option visibility and pricing</p>
              <Button variant="outline" className="mt-4" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </div>
          ) : (
            <ul className="divide-y p-4">
              {sortedRules.map((rule) => (
                <li
                  key={rule.id}
                  className={cn(
                    'rounded-lg border p-4 transition-colors',
                    !rule.isEnabled && 'opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rule.name}</span>
                        <Badge variant="secondary">{rule.type}</Badge>
                        <Badge variant="outline">P{rule.priority}</Badge>
                        {!rule.isEnabled && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      {rule.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
                      )}
                      <div className="mt-2 space-y-1 text-xs">
                        <p>
                          <span className="text-muted-foreground">When:</span>{' '}
                          {rule.conditions.length
                            ? rule.conditions.map((c) => formatCondition(c, components)).join(' AND ')
                            : '—'}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Then:</span>{' '}
                          {rule.actions.length
                            ? rule.actions.map((a) => formatAction(a, components)).join('; ')
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTest(rule)}
                        title="Test rule"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={rule.isEnabled}
                        onCheckedChange={(v) => handleUpdate(rule.id, { isEnabled: v })}
                        className="scale-75"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setDeleteConfirmId(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {testResult && (
                    <p className="mt-2 text-xs text-muted-foreground">{testResult}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>

      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete rule?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AddRuleDialog({
  components,
  onAdd,
  onCancel,
}: {
  components: Configurator3DComponent[];
  onAdd: (data: {
    name: string;
    description?: string;
    type: RuleType;
    conditions: RuleCondition[];
    actions: RuleAction[];
    priority: number;
    isEnabled: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<RuleType>('DEPENDENCY');
  const [priority, setPriority] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [conditions, setConditions] = useState<RuleCondition[]>([
    { componentId: '', operator: 'eq', value: '' },
  ]);
  const [actions, setActions] = useState<RuleAction[]>([
    { type: 'SHOW_COMPONENT', componentId: '' },
  ]);

  const addCondition = () =>
    setConditions((c) => [...c, { componentId: '', operator: 'eq', value: '' }]);
  const removeCondition = (i: number) =>
    setConditions((c) => c.filter((_, j) => j !== i));
  const updateCondition = (i: number, upd: Partial<RuleCondition>) =>
    setConditions((c) => c.map((x, j) => (j === i ? { ...x, ...upd } : x)));

  const addAction = () =>
    setActions((a) => [...a, { type: 'SHOW_COMPONENT', componentId: '' }]);
  const removeAction = (i: number) => setActions((a) => a.filter((_, j) => j !== i));
  const updateAction = (i: number, upd: Partial<RuleAction>) =>
    setActions((a) => a.map((x, j) => (j === i ? { ...x, ...upd } : x)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      conditions: conditions.filter((c) => c.componentId),
      actions: actions.filter((a) => a.componentId || a.type === 'VALIDATE'),
      priority,
      isEnabled,
    });
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Add Rule</DialogTitle>
        <DialogDescription>
          Define conditions and actions for your configurator
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rule-name">Name</Label>
          <Input
            id="rule-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gold requires premium band"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rule-desc">Description</Label>
          <Textarea
            id="rule-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as RuleType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RULE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority (higher = first)</Label>
            <Input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Conditions</Label>
            <Button type="button" variant="ghost" size="sm" onClick={addCondition}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {conditions.map((c, i) => (
            <div key={i} className="flex gap-2">
              <Select
                value={c.componentId}
                onValueChange={(v) => updateCondition(i, { componentId: v })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Component" />
                </SelectTrigger>
                <SelectContent>
                  {components.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={c.operator}
                onValueChange={(v) => updateCondition(i, { operator: v as RuleOperator })}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Value"
                value={typeof c.value === 'string' ? c.value : ''}
                onChange={(e) => updateCondition(i, { value: e.target.value })}
                className="w-24"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeCondition(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Actions</Label>
            <Button type="button" variant="ghost" size="sm" onClick={addAction}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {actions.map((a, i) => (
            <div key={i} className="flex gap-2">
              <Select
                value={a.type}
                onValueChange={(v) => updateAction(i, { type: v as RuleActionType })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={a.componentId ?? ''}
                onValueChange={(v) => updateAction(i, { componentId: v })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Target" />
                </SelectTrigger>
                <SelectContent>
                  {components.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeAction(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          <Label>Enabled</Label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            Add Rule
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
