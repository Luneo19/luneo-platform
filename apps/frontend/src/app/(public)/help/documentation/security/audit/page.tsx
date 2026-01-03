'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SecurityAuditPageContent() {
  const auditLogs = useMemo(() => [
    'Connexions utilisateurs (IP, device, timestamp)',
    'Actions API (endpoint, méthode, status)',
    'Modifications de settings',
    'Accès aux données sensibles',
    'Changements de permissions',
  ], []);

  const logExample = useMemo(() => `const logs = await fetch('/api/audit/logs', {
  headers: { 'Authorization': 'Bearer TOKEN' },
  params: {
    startDate: '2025-10-01',
    endDate: '2025-10-31',
    action: 'login', // ou 'api_call', 'settings_change'
    userId: 'user_123'
  }
});

const data = await logs.json();
// {
//   logs: [
//     {
//       timestamp: "2025-10-31T10:30:00Z",
//       userId: "user_123",
//       action: "login",
//       ip: "192.168.1.1",
//       userAgent: "Mozilla/5.0...",
//       status: "success"
//     }
//   ]
// }`, []);

  const retentionPlans = useMemo(() => [
    { plan: 'Professional', duration: '30 jours', color: 'text-gray-400' },
    { plan: 'Business', duration: '90 jours', color: 'text-gray-400' },
    { plan: 'Enterprise', duration: '1 an (personnalisable)', color: 'text-green-400' },
  ], []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-4 sm:px-6 md:px-4 sm:px-6 md:px-4 sm:px-6 md:px-3 min-[480px]:px-4 sm:px-6 md:px-8 lg:px-4 sm:px-6 md:px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-4 min-[480px]:py-6 sm:py-8 md:py-12 lg:py-12">
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-2 min-[480px]:space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-4 text-sm text-gray-400 mb-8">
          <Link href="/help/documentation" className="hover:text-white">Documentation</Link>
          <span>/</span>
          <Link href="/help/documentation/security" className="hover:text-white">Security</Link>
          <span>/</span>
          <span className="text-white">Audit</span>
        </div>
        <motion initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-3xl sm:text-2xl sm:text-xl sm:text-lg sm:text-xl md:text-2xl md:text-3xl md:text-4xl md:text-3xl sm:text-2xl sm:text-xl sm:text-lg sm:text-xl md:text-2xl md:text-3xl md:text-4xl md:text-2xl sm:text-3xl md:text-xl sm:text-2xl md:text-lg sm:text-xl md:text-2xl lg:text-3xl lg:text-4xl lg:text-xl min-[480px]:text-2xl sm:text-3xl md:text-4xl lg:text-xl sm:text-2xl md:text-lg min-[480px]:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-base min-[480px]:text-lg sm:text-xl md:text-2xl lg:text-base min-[480px]:text-lg sm:text-xl md:text-base min-[480px]:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-2xl sm:text-3xl md:text-xl sm:text-2xl md:text-lg sm:text-xl md:text-2xl lg:text-3xl lg:text-4xl lg:text-2xl sm:text-3xl md:text-xl sm:text-2xl md:text-lg sm:text-xl md:text-2xl lg:text-3xl lg:text-4xl lg:text-5xl font-bold mb-4">
            Security Audit
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Audit de sécurité et logs d'activité pour les comptes Enterprise.
          </p>
        </motion>
        <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
          <h2 className="text-lg sm:text-xl md:text-lg sm:text-xl md:text-base min-[480px]:text-lg sm:text-xl md:text-2xl font-bold mb-4">Audit Logs</h2>
          <p className="text-gray-300 mb-4">
            Accédez aux logs complets d'activité de votre compte :
          </p>
          <ul className="space-y-2 text-gray-300 text-sm">
            {auditLogs.map((log, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>{log}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
          <h2 className="text-lg sm:text-xl md:text-lg sm:text-xl md:text-base min-[480px]:text-lg sm:text-xl md:text-2xl font-bold mb-4">Récupérer les logs</h2>
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{logExample}</code>
            </pre>
          </div>
        </Card>
        <Card className="bg-blue-900/20 border-blue-500/30 p-6">
          <h3 className="text-xl font-bold mb-3">📊 Rétention des logs</h3>
          <div className="space-y-2 text-sm text-gray-300">
            {retentionPlans.map((plan, index) => (
              <div key={index} className="flex flex-col sm:flex-row justify-start sm:justify-between gap-3 sm:gap-0 p-2">
                <span>{plan.plan}:</span>
                <span className={plan.color}>{plan.duration}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const SecurityAuditPageMemo = memo(SecurityAuditPageContent);

export default function SecurityAuditPage() {
  return (
    <ErrorBoundary componentName="SecurityAuditPage">
      <SecurityAuditPageMemo />
    </ErrorBoundary>
  );
}
