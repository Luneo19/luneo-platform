"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  indicatorClassName?: string
  indicatorStyle?: React.CSSProperties
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, indicatorStyle, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full bg-blue-600 transition-all duration-300 ease-in-out",
          indicatorClassName
        )}
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          ...indicatorStyle,
        }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }
