'use client';

import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ChartCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

function ChartCardContent({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon, 
  children, 
  className 
}: ChartCardProps) {
  const getTrendColor = useMemo(() => () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

  const getTrendIcon = useMemo(() => () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  }, []);

  const trendColor = useMemo(() => getTrendColor(), [getTrendColor, trend]);
  const trendIcon = useMemo(() => getTrendIcon(), [getTrendIcon, trend]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className={className}
    >
      <Card className="p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="p-2 bg-blue-100 rounded-lg">
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          {change && (
            <div className={`flex items-center space-x-1 text-sm ${trendColor}`}>
              <span>{trendIcon}</span>
              <span>{change}</span>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

const ChartCardContentMemo = memo(ChartCardContent);

export function ChartCard(props: ChartCardProps) {
  return (
    <ErrorBoundary componentName="ChartCard">
      <ChartCardContentMemo {...props} />
    </ErrorBoundary>
  );
}

