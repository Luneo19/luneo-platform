'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

interface IntegrationStatusBadgeProps {
  integrationType: 'shopify' | 'woocommerce' | 'stripe' | 'zapier' | 'printful' | 'make';
  className?: string;
}

export function IntegrationStatusBadge({ integrationType, className }: IntegrationStatusBadgeProps) {
  const integrationsModuleEnabled = process.env.NEXT_PUBLIC_ENABLE_INTEGRATIONS_MODULE === 'true';
  const { data: integrations, isLoading, error } = useQuery({
    queryKey: ['integrations'],
    queryFn: () =>
      api
        .get('/api/v1/integrations')
        .then((r: { data?: unknown } | unknown) =>
          typeof r === 'object' && r !== null && 'data' in r
            ? (r as { data?: unknown }).data ?? r
            : r
        ),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: integrationsModuleEnabled && typeof window !== 'undefined', // Only run on client when module is enabled
  });

  if (!integrationsModuleEnabled) {
    return (
      <Badge variant="outline" className={`border-gray-300 text-gray-600 ${className}`}>
        <XCircle className="w-3 h-3 mr-1" />
        Non connecté
      </Badge>
    );
  }

  // If not authenticated or error, show disconnected
  if (error || !integrations) {
    return (
      <Badge variant="outline" className={`border-gray-300 text-gray-600 ${className}`}>
        <XCircle className="w-3 h-3 mr-1" />
        Non connecté
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <Badge variant="outline" className={className}>
        <Clock className="w-3 h-3 mr-1" />
        Vérification...
      </Badge>
    );
  }

  const integrationsList = Array.isArray(integrations) ? integrations : [];
  const connectedIntegration = integrationsList.find(
    (integration: { platform?: string; status?: string }) => integration.platform === integrationType && integration.status === 'active'
  );

  if (connectedIntegration) {
    return (
      <Badge variant="default" className={`bg-green-600 hover:bg-green-700 ${className}`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        Connecté
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`border-gray-300 text-gray-600 ${className}`}>
      <XCircle className="w-3 h-3 mr-1" />
      Non connecté
    </Badge>
  );
}

