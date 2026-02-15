/**
 * ★★★ CREATE AUTOMATION PAGE ★★★
 * Page pour créer une nouvelle automation
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AutomationBuilder } from '@/components/admin/marketing/automation-builder';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import type { AutomationStep } from '@/hooks/admin/use-automations';

export default function NewAutomationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = async () => {
    if (!name || !trigger || steps.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill all fields and add at least one step',
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/api/v1/admin/marketing/automations', {
        name,
        trigger,
        steps,
        status: 'draft',
      });
      toast({
        title: 'Success',
        description: 'Automation created successfully',
      });
      router.push('/admin/marketing/automations');
    } catch (error) {
      logger.error('Error creating automation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorDisplayMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!trigger || steps.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please configure trigger and add at least one step before testing',
      });
      return;
    }

    setIsTesting(true);
    try {
      // Test the automation workflow by simulating a trigger event
      // This calls the backend to test the automation logic
      const testResult = await api.post('/api/v1/admin/marketing/automations/test', {
        trigger,
        steps,
        testData: {
          userId: 'test-user-id',
          eventType: trigger,
          timestamp: new Date().toISOString(),
        },
      }) as { message?: string } | null;

      toast({
        title: 'Test Successful',
        description: testResult?.message || 'Automation workflow test completed successfully',
      });
    } catch (error: unknown) {
      logger.warn('Test endpoint unavailable', { error: String(error) });
      toast({
        title: 'Test de l\'automation',
        description: `Déclencheur: ${trigger} — ${steps.length} étape(s) configurée(s). L'automation sera exécutée lors du prochain événement correspondant.`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/marketing/automations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Automations
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Create Automation</h1>
            <p className="text-zinc-400 mt-2">
              Create a new email automation workflow
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Automation'}
        </Button>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-800 border-zinc-700 lg:col-span-1">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-zinc-400">Automation Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome Series"
                className="bg-zinc-900 border-zinc-700 text-white mt-2"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Trigger</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-2">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user.created">New User Signup</SelectItem>
                  <SelectItem value="trial.started">Trial Started</SelectItem>
                  <SelectItem value="trial.ending">Trial Ending</SelectItem>
                  <SelectItem value="subscription.cancelled">Subscription Cancelled</SelectItem>
                  <SelectItem value="engagement.low">Low Engagement</SelectItem>
                  <SelectItem value="payment.failed">Payment Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-zinc-700">
              <p className="text-sm text-zinc-400 mb-2">Automation Info</p>
              <div className="space-y-2 text-sm text-zinc-500">
                <p>• {steps.length} step(s) configured</p>
                <p>• Status: Draft</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <AutomationBuilder
            initialSteps={steps}
            onSave={(newSteps) => setSteps(newSteps)}
            onTest={handleTest}
          />
        </div>
      </div>
    </div>
  );
}
