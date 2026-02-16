'use client';

import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  className?: string;
}

export function MagneticButton({
  children,
  strength = 0.3,
  variant = 'primary',
  size = 'md',
  glow = true,
  className,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      setPosition({ x, y });
    },
    [strength],
  );

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500',
    secondary:
      'bg-white/[0.06] text-white border border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.2] backdrop-blur-sm',
    ghost: 'bg-transparent text-white hover:bg-white/[0.06]',
    outline:
      'bg-transparent text-white border border-indigo-500/50 hover:bg-indigo-500/10 hover:border-indigo-400/70',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-sm rounded-xl',
    lg: 'px-8 py-4 text-base rounded-xl',
    xl: 'px-10 py-5 text-lg rounded-2xl',
  };

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-300 ease-out',
        'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) scale(${isHovered ? 1.02 : 1})`,
      }}
      {...props}
    >
      {glow && variant === 'primary' && (
        <span
          className="absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500"
          style={{
            opacity: isHovered ? 0.6 : 0,
            background:
              'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(124,58,237,0.4), rgba(168,85,247,0.4))',
            filter: 'blur(20px)',
            transform: 'translateY(8px) scale(0.9)',
          }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
