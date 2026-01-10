'use client';

import React, { useMemo, memo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface DataPoint {
  x: string | number;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

function LineChartContent({ 
  data, 
  width = 300, 
  height = 150, 
  color = '#3B82F6',
  className 
}: LineChartProps) {
  // Optimisé: useMemo pour calculs
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxY = Math.max(...data.map(d => d.y));
    const minY = Math.min(...data.map(d => d.y));
    const rangeY = maxY - minY || 1;

    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((point.y - minY) / rangeY) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return {
      maxY,
      minY,
      rangeY,
      padding,
      chartWidth,
      chartHeight,
      pathData: `M ${points}`,
    };
  }, [data, width, height]);

  if (!chartData) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} 
           style={{ width, height }}>
        <span className="text-gray-400 text-sm">Aucune donnée</span>
      </div>
    );
  }

  const { padding, chartWidth, chartHeight, pathData, minY, rangeY } = chartData;

  return (
    <motion
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <line
            key={index}
            x1={padding}
            y1={padding + ratio * chartHeight}
            x2={padding + chartWidth}
            y2={padding + ratio * chartHeight}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        ))}
        
        {/* Line path */}
        <motion.path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = chartData.padding + (index / (data.length - 1)) * chartData.chartWidth;
          const y = chartData.padding + chartData.chartHeight - ((point.y - chartData.minY) / chartData.rangeY) * chartData.chartHeight;
          
          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r={4}
              fill={color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.5, stroke: color, strokeWidth: 2 }}
            />
          );
        })}
      </svg>
    </motion>
  );
}

const LineChartContentMemo = memo(LineChartContent);

export function LineChart(props: LineChartProps) {
  return (
    <ErrorBoundary componentName="LineChart">
      <LineChartContentMemo {...props} />
    </ErrorBoundary>
  );
}

// Default export for backward compatibility
export default LineChart;