'use client';

import React, { memo, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function DeploymentKubernetesPageContent() {
  const deploymentManifest = useMemo(() => `apiVersion: apps/v1
kind: Deployment
metadata:
  name: luneo-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: luneo
  template:
    metadata:
      labels:
        app: luneo
    spec:
      containers:
      - name: frontend
        image: luneo/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          valueFrom:
            secretKeyRef:
              name: luneo-secrets
              key: api-url`, []);

  return (
    <DocPageTemplate
      title="Déploiement Kubernetes"
      description="Déployez Luneo sur Kubernetes pour haute disponibilité et scalabilité"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Deployment', href: '/help/documentation/deployment' },
        { label: 'Kubernetes', href: '/help/documentation/deployment/kubernetes' }
      ]}
      relatedLinks={[
        { title: 'Docker', href: '/help/documentation/deployment/docker', description: 'Containerisation Docker' },
        { title: 'CDN', href: '/help/documentation/deployment/cdn', description: 'Configuration CDN' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Deployment manifest</h2>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{deploymentManifest}</code>
          </pre>
        </div>
      </Card>

      <div className="mt-8 bg-blue-900/20 border border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">Configuration requise</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Cluster Kubernetes 1.24+</li>
          <li>• Secrets configurés pour les variables d'environnement</li>
          <li>• Service et Ingress configurés</li>
        </ul>
      </div>
    </DocPageTemplate>
  );
}

const DeploymentKubernetesPageMemo = memo(DeploymentKubernetesPageContent);

export default function DeploymentKubernetesPage() {
  return (
    <ErrorBoundary componentName="DeploymentKubernetesPage">
      <DeploymentKubernetesPageMemo />
    </ErrorBoundary>
  );
}
