'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────
   ElectricGrid — Madgicx-style animated electric grid background
   Renders a futuristic grid with electric pulses that travel
   along the lines, creating a circuit-board / energy effect.
   ────────────────────────────────────────────────────────── */

export interface ElectricGridProps {
  /** Grid cell size in pixels */
  cellSize?: number;
  /** Base color of grid lines */
  lineColor?: string;
  /** Electric pulse color */
  pulseColor?: string;
  /** Secondary pulse color for variety */
  pulseColorAlt?: string;
  /** Number of simultaneous electric pulses */
  pulseCount?: number;
  /** Speed multiplier (1 = normal) */
  speed?: number;
  /** Opacity of the grid background (0-1) */
  opacity?: number;
  /** Additional className */
  className?: string;
  /** Variant: 'full' covers entire area, 'fade' adds edge fade */
  variant?: 'full' | 'fade' | 'radial';
  /** Show intersection glow dots */
  showNodes?: boolean;
  /** Enable mouse interaction (glow follows cursor) */
  mouseInteraction?: boolean;
}

interface Pulse {
  x: number;
  y: number;
  direction: 'horizontal' | 'vertical';
  progress: number;
  speed: number;
  length: number;
  color: string;
  opacity: number;
}

interface Node {
  x: number;
  y: number;
  intensity: number;
  phase: number;
}

export function ElectricGrid({
  cellSize = 60,
  lineColor = 'rgba(99, 102, 241, 0.06)',
  pulseColor = 'rgba(99, 102, 241, 0.8)',
  pulseColorAlt = 'rgba(139, 92, 246, 0.7)',
  pulseCount = 8,
  speed = 1,
  opacity = 1,
  className,
  variant = 'fade',
  showNodes = true,
  mouseInteraction = true,
}: ElectricGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const pulsesRef = useRef<Pulse[]>([]);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const timeRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize pulses
  const initPulses = useCallback(
    (width: number, height: number) => {
      const pulses: Pulse[] = [];
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);

      for (let i = 0; i < pulseCount; i++) {
        const isHorizontal = Math.random() > 0.5;
        pulses.push({
          x: isHorizontal ? 0 : Math.floor(Math.random() * cols) * cellSize,
          y: isHorizontal ? Math.floor(Math.random() * rows) * cellSize : 0,
          direction: isHorizontal ? 'horizontal' : 'vertical',
          progress: Math.random(),
          speed: (0.3 + Math.random() * 0.7) * speed,
          length: 80 + Math.random() * 160,
          color: Math.random() > 0.4 ? pulseColor : pulseColorAlt,
          opacity: 0.6 + Math.random() * 0.4,
        });
      }
      pulsesRef.current = pulses;
    },
    [cellSize, pulseCount, speed, pulseColor, pulseColorAlt]
  );

  // Initialize intersection nodes
  const initNodes = useCallback(
    (width: number, height: number) => {
      if (!showNodes) return;
      const nodes: Node[] = [];
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);

      // Only show a subset of nodes for performance
      for (let col = 0; col <= cols; col++) {
        for (let row = 0; row <= rows; row++) {
          if (Math.random() > 0.3) continue; // 30% of intersections get nodes
          nodes.push({
            x: col * cellSize,
            y: row * cellSize,
            intensity: Math.random(),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
      nodesRef.current = nodes;
    },
    [cellSize, showNodes]
  );

  // Draw grid
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let x = 0; x <= width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    },
    [cellSize, lineColor]
  );

  // Draw electric pulses
  const drawPulses = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => {
      pulsesRef.current.forEach((pulse) => {
        const maxDist = pulse.direction === 'horizontal' ? width : height;
        const pos = pulse.progress * maxDist;

        // Create gradient for the pulse trail
        const isH = pulse.direction === 'horizontal';
        const startX = isH ? pos - pulse.length : pulse.x;
        const startY = isH ? pulse.y : pos - pulse.length;
        const endX = isH ? pos : pulse.x;
        const endY = isH ? pulse.y : pos;

        // Avoid zero-length gradients
        if (Math.abs(endX - startX) < 1 && Math.abs(endY - startY) < 1) return;

        try {
          const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(0.7, pulse.color);
          gradient.addColorStop(1, pulse.color);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.globalAlpha = pulse.opacity;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Glow at the head of the pulse
          ctx.globalAlpha = pulse.opacity * 0.6;
          ctx.shadowColor = pulse.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(endX, endY, 3, 0, Math.PI * 2);
          ctx.fillStyle = pulse.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        } catch {
          // gradient creation can fail if coords are invalid
        }

        ctx.globalAlpha = 1;

        // Update pulse position
        pulse.progress += (dt * pulse.speed * 0.15) / (maxDist / 1000);

        // Reset when off-screen
        if (pulse.progress * maxDist > maxDist + pulse.length) {
          const cols = Math.ceil(width / cellSize);
          const rows = Math.ceil(height / cellSize);
          const isHorizontal = Math.random() > 0.5;
          pulse.direction = isHorizontal ? 'horizontal' : 'vertical';
          pulse.x = isHorizontal ? 0 : Math.floor(Math.random() * cols) * cellSize;
          pulse.y = isHorizontal ? Math.floor(Math.random() * rows) * cellSize : 0;
          pulse.progress = -pulse.length / maxDist;
          pulse.speed = (0.3 + Math.random() * 0.7) * speed;
          pulse.color = Math.random() > 0.4 ? pulseColor : pulseColorAlt;
          pulse.opacity = 0.6 + Math.random() * 0.4;
        }
      });
    },
    [cellSize, speed, pulseColor, pulseColorAlt]
  );

  // Draw intersection nodes
  const drawNodes = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      if (!showNodes) return;

      nodesRef.current.forEach((node) => {
        const intensity = 0.3 + 0.7 * ((Math.sin(time * 0.002 + node.phase) + 1) / 2);

        // Check proximity to mouse
        const dx = node.x - mouseRef.current.x;
        const dy = node.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseBoost = mouseInteraction ? Math.max(0, 1 - dist / 200) : 0;

        const finalIntensity = Math.min(1, intensity * node.intensity + mouseBoost);

        if (finalIntensity < 0.15) return;

        // Outer glow
        ctx.globalAlpha = finalIntensity * 0.3;
        ctx.fillStyle = pulseColor;
        ctx.shadowColor = pulseColor;
        ctx.shadowBlur = 8 + mouseBoost * 12;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 + mouseBoost * 3, 0, Math.PI * 2);
        ctx.fill();

        // Inner dot
        ctx.globalAlpha = finalIntensity * 0.8;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1 + mouseBoost * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
      });
    },
    [showNodes, mouseInteraction, pulseColor]
  );

  // Mouse interaction: glow near cursor
  const drawMouseGlow = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!mouseInteraction || mouseRef.current.x < 0) return;

      const { x, y } = mouseRef.current;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 200);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
      gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.03)');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - 200, y - 200, 400, 400);
    },
    [mouseInteraction]
  );

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        initPulses(width, height);
        initNodes(width, height);
      }
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [initPulses, initNodes]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dt = now - lastTime;
      lastTime = now;
      timeRef.current += dt;

      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, w, h);

      // Draw layers
      drawGrid(ctx, w, h);
      drawMouseGlow(ctx);
      drawPulses(ctx, w, h, dt);
      drawNodes(ctx, timeRef.current);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [drawGrid, drawPulses, drawNodes, drawMouseGlow, dimensions]);

  // Mouse tracking
  useEffect(() => {
    if (!mouseInteraction) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [mouseInteraction]);

  // Fade mask based on variant
  const maskStyle = (() => {
    switch (variant) {
      case 'fade':
        return {
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMaskComposite: 'source-in',
        } as React.CSSProperties;
      case 'radial':
        return {
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 80%)',
        } as React.CSSProperties;
      default:
        return {};
    }
  })();

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      style={{ opacity, ...maskStyle }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   ElectricGridCSS — Lightweight CSS-only variant
   For pages that need the effect without Canvas overhead.
   ────────────────────────────────────────────────────────── */

export interface ElectricGridCSSProps {
  className?: string;
  variant?: 'fade' | 'radial' | 'full';
  /** Grid cell size */
  cellSize?: number;
  /** Line color */
  lineColor?: string;
  /** Show animated pulse lines */
  animated?: boolean;
}

export function ElectricGridCSS({
  className,
  variant = 'fade',
  cellSize = 60,
  lineColor = 'rgba(99, 102, 241, 0.05)',
  animated = true,
}: ElectricGridCSSProps) {
  const maskStyle = (() => {
    switch (variant) {
      case 'fade':
        return {
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        } as React.CSSProperties;
      case 'radial':
        return {
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 80%)',
        } as React.CSSProperties;
      default:
        return {};
    }
  })();

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      style={maskStyle}
    >
      {/* CSS Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${lineColor} 1px, transparent 1px),
            linear-gradient(90deg, ${lineColor} 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
        }}
      />

      {/* Animated pulse lines */}
      {animated && (
        <>
          {/* Horizontal pulse */}
          <div
            className="absolute left-0 right-0 h-px"
            style={{
              top: '30%',
              background: `linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.3), transparent)`,
              animation: 'electric-scan-h 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute left-0 right-0 h-px"
            style={{
              top: '60%',
              background: `linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.4), transparent)`,
              animation: 'electric-scan-h 12s ease-in-out infinite 3s',
            }}
          />
          {/* Vertical pulse */}
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: '25%',
              background: `linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.2), transparent)`,
              animation: 'electric-scan-v 10s ease-in-out infinite 1s',
            }}
          />
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: '70%',
              background: `linear-gradient(180deg, transparent, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.3), transparent)`,
              animation: 'electric-scan-v 14s ease-in-out infinite 5s',
            }}
          />
        </>
      )}
    </div>
  );
}
