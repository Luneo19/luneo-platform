'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Configurator3D } from '../core/Configurator3D';
import { PostMessageHandler, usePostMessage } from './PostMessageHandler';
import { cn } from '@/lib/utils';

export interface EmbeddedConfiguratorProps {
  configurationId: string;
  projectId?: string;
  theme?: 'light' | 'dark' | 'system';
  layout?: 'minimal' | 'full';
  allowedDomains?: string[];
  className?: string;
}

function EmbeddedConfiguratorInner({
  configurationId,
  projectId,
  theme = 'light',
  layout = 'minimal',
  className,
}: Omit<EmbeddedConfiguratorProps, 'allowedDomains'>) {
  const { send } = usePostMessage() ?? { send: () => {} };

  useEffect(() => {
    send({
      type: 'LOADED',
      payload: { configurationId, theme, layout },
      configurationId,
    });
  }, [configurationId, theme, layout, send]);

  const themeClass = useMemo(() => {
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return '';
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : '';
  }, [theme]);

  return (
    <div
      className={cn(
        'h-full w-full overflow-hidden',
        themeClass,
        layout === 'minimal' && 'rounded-lg',
        className
      )}
    >
      <Configurator3D
        configurationId={configurationId}
        projectId={projectId}
        className="h-full min-h-[400px]"
      />
    </div>
  );
}

export function EmbeddedConfigurator({
  configurationId,
  projectId,
  theme = 'light',
  layout = 'minimal',
  allowedDomains = [],
  className,
}: EmbeddedConfiguratorProps) {
  const searchParams = useSearchParams();

  const urlTheme = (searchParams.get('theme') as 'light' | 'dark' | 'system') ?? theme;
  const urlLayout = (searchParams.get('layout') as 'minimal' | 'full') ?? layout;

  const handleMessage = useCallback((message: { type: string; payload?: Record<string, unknown> }) => {
    switch (message.type) {
      case 'INIT':
        break;
      case 'SELECT_OPTION':
        break;
      case 'GET_PRICE':
        break;
      case 'GET_STATE':
        break;
      default:
        break;
    }
  }, []);

  return (
    <PostMessageHandler
      allowedDomains={allowedDomains}
      onMessage={handleMessage}
    >
      <EmbeddedConfiguratorInner
        configurationId={configurationId}
        projectId={projectId}
        theme={urlTheme}
        layout={urlLayout}
        className={className}
      />
    </PostMessageHandler>
  );
}
