'use client';
import React from 'react';

export function ScrollReveal({ children, className, delay, direction }: { children: React.ReactNode; className?: string; delay?: number; direction?: string }) {
  return <div className={className}>{children}</div>;
}
