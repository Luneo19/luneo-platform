'use client';

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Lock, Settings } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function EnterpriseSettingsPageContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Enterprise Settings</h1>
        <p className="text-gray-400">Configuration enterprise-grade</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <Shield className="w-12 h-12 text-blue-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">SSO / SAML</h3>
          <p className="text-sm text-gray-400 mb-4">Configure single sign-on</p>
          <Button variant="outline" className="border-gray-600">Configure</Button>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <Users className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Team Management</h3>
          <p className="text-sm text-gray-400 mb-4">Manage roles and permissions</p>
          <Button variant="outline" className="border-gray-600">Configure</Button>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <Lock className="w-12 h-12 text-green-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Audit Logs</h3>
          <p className="text-sm text-gray-400 mb-4">Track all actions</p>
          <Button variant="outline" className="border-gray-600">View Logs</Button>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <Settings className="w-12 h-12 text-orange-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">API Keys</h3>
          <p className="text-sm text-gray-400 mb-4">Manage API access</p>
          <Button variant="outline" className="border-gray-600">Manage</Button>
        </Card>
      </div>
    </div>
  );
}

const MemoizedEnterpriseSettingsPageContent = memo(EnterpriseSettingsPageContent);

export default function EnterpriseSettingsPage() {
  return (
    <ErrorBoundary level="page" componentName="EnterpriseSettingsPage">
      <MemoizedEnterpriseSettingsPageContent />
    </ErrorBoundary>
  );
}
