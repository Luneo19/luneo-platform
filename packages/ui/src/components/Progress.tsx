import * as React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    return (
      <div ref={ref} className={className} role="progressbar" aria-valuenow={value} aria-valuemax={max} {...props}>
        <div style={{ width: `${(value / max) * 100}%` }} />
      </div>
    );
  },
);
Progress.displayName = 'Progress';
