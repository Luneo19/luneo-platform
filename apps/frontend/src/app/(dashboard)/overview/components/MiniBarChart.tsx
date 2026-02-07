'use client';

import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';

export function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => (
        <motion
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(value / max) * 100}%` }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className={`w-2 rounded-sm ${color}`}
          style={{ minHeight: value > 0 ? '2px' : '0' }}
        />
      ))}
    </div>
  );
}
