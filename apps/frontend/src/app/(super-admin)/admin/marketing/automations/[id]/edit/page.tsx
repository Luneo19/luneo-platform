'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AutomationBuilder } from '@/components/admin/marketing/automation-builder';
import { useAutomation } from '@/hooks/admin/use-automations';
import type { AutomationStep } from '@/hooks/admin/use-automations';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';

export default function EditAutomationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const automationId = String(params?.id || '');
  const { automation, isLoading } = useAutomation(automationId);

  const [name, setName] = React.useState('');
  const [trigger, setTrigger] = React.useState('');
  const [status, setStatus] = React.useState<'active' | 'paused' | 'draft'>('draft');
  const [steps, setSteps] = React.useState<AutomationStep[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);

  React.useEffect(() => {
    if (!automation) return;
    setName(automation.name || '');
    setTrigger(automation.trigger || '');
    setStatus(automation.status || 'draft');
    setSteps(Array.isArray(automation.steps) ? automation.steps : []);
  }, [automation]);

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
      await api.put(`/api/admin/marketing/automations/${automationId}`, {
        name,
        trigger,
        status,
        active: status === 'active',
        steps,
      });
      toast({
        title: 'Success',
        description: 'Automation updated successfully',
      });
      router.push('/admin/marketing/automations');
    } catch (error) {
      logger.error('Error updating automation:', error);
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
    setIsTesting(true);
    try {
      const testResult = await api.post<{ message?: string }>('/api/admin/marketing/automations/test', {
        id: automationId,
        trigger,
        steps,
      });
      toast({
        title: 'Test Successful',
        description: testResult?.message || 'Automation workflow test completed successfully',
      });
    } catch (error) {
      logger.error('Error testing automation:', error);
      toast({
        variant: 'destructive',
        title: 'Test failed',
        description: getErrorDisplayMessage(error),
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return <div className="text-zinc-400">Loading automation...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/marketing/automations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Automations
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Automation</h1>
            <p className="text-zinc-400 mt-2">Update and test your email automation workflow</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-800 border-zinc-700 lg:col-span-1">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-zinc-400">Automation Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Automation name"
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

            <div>
              <Label className="text-zinc-400">Status</Label>
              <Select value={status} onValueChange={(value: 'active' | 'paused' | 'draft') => setStatus(value)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-2">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-zinc-700">
              <Button variant="outline" className="w-full" onClick={handleTest} disabled={isTesting}>
                {isTesting ? 'Testing...' : 'Run Test'}
              </Button>
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
