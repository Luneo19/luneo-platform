'use client';

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Lock, Settings } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PlanGate } from '@/lib/hooks/api/useFeatureGate';
import { UpgradePrompt } from '@/components/upgrade/UpgradePrompt';

function EnterpriseSettingsPageContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Enterprise Settings</h1>
        <p className="text-white/80">Configuration enterprise-grade</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dash-card-glow p-6 border-white/[0.06]">
          <Shield className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">SSO / SAML</h3>
          <p className="text-sm text-white/80 mb-4">Configure single sign-on</p>
          <Button variant="outline" className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]">Configure</Button>
        </Card>

        <Card className="dash-card-glow p-6 border-white/[0.06]">
          <Users className="w-12 h-12 text-pink-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Team Management</h3>
          <p className="text-sm text-white/80 mb-4">Manage roles and permissions</p>
          <Button variant="outline" className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]">Configure</Button>
        </Card>

        <Card className="dash-card-glow p-6 border-white/[0.06]">
          <Lock className="w-12 h-12 text-[#4ade80] mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Audit Logs</h3>
          <p className="text-sm text-white/80 mb-4">Track all actions</p>
          <Button variant="outline" className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]">View Logs</Button>
        </Card>

        <Card className="dash-card-glow p-6 border-white/[0.06]">
          <Settings className="w-12 h-12 text-[#fbbf24] mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">API Keys</h3>
          <p className="text-sm text-white/80 mb-4">Manage API access</p>
          <Button variant="outline" className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]">Manage</Button>
        </Card>
      </div>
    </div>
  );
}

const MemoizedEnterpriseSettingsPageContent = memo(EnterpriseSettingsPageContent);

export default function EnterpriseSettingsPage() {
  return (
    <ErrorBoundary level="page" componentName="EnterpriseSettingsPage">
      <PlanGate
        minimumPlan="enterprise"
        showUpgradePrompt
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <UpgradePrompt
              requiredPlan="enterprise"
              feature="Paramètres Enterprise (SSO, limites personnalisées)"
              description="SSO/SAML et les paramètres enterprise sont disponibles sur le plan Enterprise."
            />
          </div>
        }
      >
        <MemoizedEnterpriseSettingsPageContent />
      </PlanGate>
    </ErrorBoundary>
  );
}
