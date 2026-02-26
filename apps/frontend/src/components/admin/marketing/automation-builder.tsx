/**
 * ★★★ AUTOMATION BUILDER ★★★
 * Builder visuel pour créer des workflows d'automation email
 * Avec drag & drop et connexions entre nodes
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AutomationNode } from './automation-node';
import { Plus, Save, Play, ArrowDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutomationStep } from '@/hooks/admin/use-automations';

export interface AutomationBuilderProps {
  initialSteps?: AutomationStep[];
  onSave?: (steps: AutomationStep[]) => void;
  onTest?: () => void;
  className?: string;
}

const AVAILABLE_NODES = [
  { type: 'email', label: 'Email', icon: '📧' },
  { type: 'wait', label: 'Wait', icon: '⏰' },
  { type: 'condition', label: 'Condition', icon: '🔀' },
  { type: 'tag', label: 'Tag User', icon: '🏷️' },
  { type: 'notify', label: 'Notify', icon: '🔔' },
];

export function AutomationBuilder({
  initialSteps = [],
  onSave,
  onTest,
  className,
}: AutomationBuilderProps) {
  const [steps, setSteps] = useState<AutomationStep[]>(initialSteps);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<AutomationStep | null>(null);

  useEffect(() => {
    setSteps(initialSteps);
  }, [initialSteps]);

  const addStep = useCallback(
    (type: AutomationStep['type']) => {
      const newStep: AutomationStep = {
        id: `step-${Date.now()}`,
        type,
        order: steps.length,
        delay: type === 'wait' ? 24 : undefined,
        templateId: type === 'email' ? undefined : undefined,
      };
      setSteps((prev) => [...prev, newStep]);
    },
    [steps.length]
  );

  const deleteStep = useCallback((stepId: string) => {
    setSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== stepId);
      return filtered.map((s, index) => ({ ...s, order: index }));
    });
    if (selectedStep === stepId) {
      setSelectedStep(null);
    }
  }, [selectedStep]);

  const updateStep = useCallback((stepId: string, updates: Partial<AutomationStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    );
  }, []);

  const moveStep = useCallback((stepId: string, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const index = prev.findIndex((s) => s.id === stepId);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const newSteps = [...prev];
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      return newSteps.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(steps);
    }
  }, [steps, onSave]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Workflow Builder</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Créez votre workflow d'automation en ajoutant des étapes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onTest && (
            <Button variant="outline" onClick={onTest}>
              <Play className="w-4 h-4 mr-2" />
              Test Workflow
            </Button>
          )}
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Workflow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Available Nodes */}
        <Card className="bg-zinc-800 border-zinc-700 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white text-lg">Available Nodes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {AVAILABLE_NODES.map((node) => (
              <Button
                key={node.type}
                variant="outline"
                className="w-full justify-start bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                onClick={() => addStep(node.type as AutomationStep['type'])}
              >
                <span className="mr-2">{node.icon}</span>
                {node.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Main Canvas - Workflow */}
        <Card className="bg-zinc-800 border-zinc-700 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-white text-lg">Workflow Steps</CardTitle>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <p className="mb-4">Aucune étape dans le workflow</p>
                <p className="text-sm">Ajoutez des étapes depuis la sidebar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="relative">
                    {/* Arrow between steps */}
                    {index > 0 && (
                      <div className="flex justify-center mb-2">
                        <ArrowDown className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}

                    {/* Step Node */}
                    <AutomationNode
                      step={step}
                      isSelected={selectedStep === step.id}
                      onSelect={() => setSelectedStep(step.id)}
                      onEdit={() => setEditingStep(step)}
                      onDelete={() => deleteStep(step.id)}
                    />

                    {/* Step Editor (when selected) */}
                    {selectedStep === step.id && (
                      <Card className="mt-4 bg-zinc-900 border-zinc-700">
                        <CardContent className="p-4 space-y-4">
                          {step.type === 'email' && (
                            <>
                              <div>
                                <Label className="text-zinc-400">Email Template</Label>
                                <Select
                                  value={step.templateId || ''}
                                  onValueChange={(value) =>
                                    updateStep(step.id, { templateId: value })
                                  }
                                >
                                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue placeholder="Select template" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="welcome">Welcome Email</SelectItem>
                                    <SelectItem value="trial-ending">Trial Ending</SelectItem>
                                    <SelectItem value="churn-prevention">Churn Prevention</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}

                          {step.type === 'wait' && (
                            <div>
                              <Label className="text-zinc-400">Wait Duration (hours)</Label>
                              <Input
                                type="number"
                                value={step.delay || 24}
                                onChange={(e) =>
                                  updateStep(step.id, { delay: parseInt(e.target.value) || 24 })
                                }
                                className="bg-zinc-800 border-zinc-700"
                              />
                            </div>
                          )}

                          {step.type === 'condition' && (
                            <div>
                              <Label className="text-zinc-400">Condition</Label>
                              <Select
                                value={typeof step.condition?.type === 'string' ? step.condition.type : ''}
                                onValueChange={(value) =>
                                  updateStep(step.id, {
                                    condition: { type: value, value: '' },
                                  })
                                }
                              >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                  <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="engagement_low">Engagement Low</SelectItem>
                                  <SelectItem value="plan_type">Plan Type</SelectItem>
                                  <SelectItem value="segment">In Segment</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Move buttons */}
                          <div className="flex items-center gap-2 pt-2 border-t border-zinc-700">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveStep(step.id, 'up')}
                              disabled={index === 0}
                            >
                              Move Up
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveStep(step.id, 'down')}
                              disabled={index === steps.length - 1}
                            >
                              Move Down
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStep(null)}
                              className="ml-auto"
                            >
                              Close
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
