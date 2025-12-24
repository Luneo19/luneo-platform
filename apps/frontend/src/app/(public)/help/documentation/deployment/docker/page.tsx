'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function DeploymentDockerPageContent() {
  const dockerfile = useMemo(() => `FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm","start"]`, []);

  const buildCommands = useMemo(() => `docker build -t luneo-app .
docker run -p 3000:3000 --env-file .env luneo-app`, []);

  return (
    <DocPageTemplate
      title="Déploiement Docker"
      description="Containerisez Luneo avec Docker pour un déploiement flexible"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Deployment', href: '/help/documentation/deployment' },
        { label: 'Docker', href: '/help/documentation/deployment/docker' }
      ]}
      relatedLinks={[
        { title: 'Kubernetes', href: '/help/documentation/deployment/kubernetes', description: 'Déploiement K8s' },
        { title: 'Vercel', href: '/help/documentation/deployment/vercel', description: 'Déploiement Vercel' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Dockerfile</h2>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{dockerfile}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Build et Run</h2>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{buildCommands}</code>
          </pre>
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const DeploymentDockerPageMemo = memo(DeploymentDockerPageContent);

export default function DeploymentDockerPage() {
  return (
    <ErrorBoundary componentName="DeploymentDockerPage">
      <DeploymentDockerPageMemo />
    </ErrorBoundary>
  );
}
