'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function ChartCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon, 
  children, 
  className 
}: ChartCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

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
            <div className={`flex items-center space-x-1 text-sm ${getTrendColor()}`}>
              <span>{getTrendIcon()}</span>
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

