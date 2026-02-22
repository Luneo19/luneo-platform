/**
 * Product Tour Component
 * O-006: Composant principal pour les product tours avec tooltips
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Tour, TourStep, SpotlightPosition, TooltipPosition } from './types';

interface ProductTourProps {
  tour: Tour;
  isActive: boolean;
  onComplete: (tourId: string) => void;
  onDismiss: (tourId: string) => void;
  onStepChange?: (stepIndex: number) => void;
}

function ProductTourContent({
  tour,
  isActive,
  onComplete,
  onDismiss,
  onStepChange,
}: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightPosition, setSpotlightPosition] = useState<SpotlightPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = tour.steps[currentStep];
  const isLastStep = currentStep === tour.steps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / tour.steps.length) * 100;

  // Mount check
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Calculate positions
  const calculatePositions = useCallback(() => {
    if (!step?.target) return;

    const element = document.querySelector(step.target);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const padding = step.spotlightPadding ?? 8;

    // Spotlight position
    setSpotlightPosition({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding + window.scrollX,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Tooltip position
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const margin = 16;

    let placement = step.placement || 'auto';
    let top = 0;
    let left = 0;

    // Auto-detect best placement
    if (placement === 'auto') {
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;

      if (spaceBelow >= tooltipHeight + margin) {
        placement = 'bottom';
      } else if (spaceAbove >= tooltipHeight + margin) {
        placement = 'top';
      } else if (spaceRight >= tooltipWidth + margin) {
        placement = 'right';
      } else {
        placement = 'left';
      }
    }

    switch (placement) {
      case 'bottom':
        top = rect.bottom + margin + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
        break;
      case 'top':
        top = rect.top - tooltipHeight - margin + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.right + margin + window.scrollX;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.left - tooltipWidth - margin + window.scrollX;
        break;
    }

    // Keep tooltip in viewport
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin + window.scrollY));

    setTooltipPosition({ top, left, placement });

    // Scroll element into view if needed
    if (!step.disableScroll) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step]);

  // Update positions on step change
  useEffect(() => {
    if (!isActive || !step) return;

    // Execute beforeShow hook
    if (step.beforeShow) {
      Promise.resolve(step.beforeShow()).then(calculatePositions);
    } else {
      calculatePositions();
    }

    // Notify parent
    onStepChange?.(currentStep);

    // Recalculate on resize/scroll
    window.addEventListener('resize', calculatePositions);
    window.addEventListener('scroll', calculatePositions);

    return () => {
      window.removeEventListener('resize', calculatePositions);
      window.removeEventListener('scroll', calculatePositions);
    };
  }, [isActive, currentStep, step, calculatePositions, onStepChange]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (step?.afterShow) {
      step.afterShow();
    }

    if (isLastStep) {
      step?.onComplete?.();
      onComplete(tour.id);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, step, tour.id, onComplete]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirstStep]);

  const handleDismiss = useCallback(() => {
    onDismiss(tour.id);
  }, [tour.id, onDismiss]);

  const handleAction = useCallback(() => {
    step?.action?.onClick?.();
    handleNext();
  }, [step, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;

      switch (e.key) {
        case 'Escape':
          handleDismiss();
          break;
        case 'ArrowRight':
        case 'Enter':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleNext, handlePrevious, handleDismiss]);

  if (!isActive || !isMounted || !step) return null;

  return createPortal(
    <AnimatePresence>
      {isActive && (
        <>
          {/* Overlay */}
          {!step.disableOverlay && (
            <motion
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] pointer-events-none"
              style={{
                background: spotlightPosition
                  ? `radial-gradient(
                      ellipse ${spotlightPosition.width + 50}px ${spotlightPosition.height + 50}px at ${spotlightPosition.left + spotlightPosition.width / 2}px ${spotlightPosition.top + spotlightPosition.height / 2}px,
                      transparent 0%,
                      rgba(0, 0, 0, 0.75) 100%
                    )`
                  : 'rgba(0, 0, 0, 0.75)',
              }}
            />
          )}

          {/* Spotlight border */}
          {spotlightPosition && (
            <motion
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-[9999] rounded-lg pointer-events-none"
              style={{
                top: spotlightPosition.top,
                left: spotlightPosition.left,
                width: spotlightPosition.width,
                height: spotlightPosition.height,
                boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)',
              }}
            />
          )}

          {/* Tooltip */}
          {tooltipPosition && (
            <motion
              ref={tooltipRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed z-[10000] w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl"
              style={{
                top: tooltipPosition.top,
                left: tooltipPosition.left,
              }}
            >
              {/* Arrow */}
              <div
                className="absolute w-3 h-3 bg-slate-900 border-slate-700 transform rotate-45"
                style={{
                  ...(tooltipPosition.placement === 'bottom' && {
                    top: -6,
                    left: '50%',
                    marginLeft: -6,
                    borderLeft: '1px solid',
                    borderTop: '1px solid',
                  }),
                  ...(tooltipPosition.placement === 'top' && {
                    bottom: -6,
                    left: '50%',
                    marginLeft: -6,
                    borderRight: '1px solid',
                    borderBottom: '1px solid',
                  }),
                  ...(tooltipPosition.placement === 'left' && {
                    right: -6,
                    top: '50%',
                    marginTop: -6,
                    borderRight: '1px solid',
                    borderTop: '1px solid',
                  }),
                  ...(tooltipPosition.placement === 'right' && {
                    left: -6,
                    top: '50%',
                    marginTop: -6,
                    borderLeft: '1px solid',
                    borderBottom: '1px solid',
                  }),
                }}
              />

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-slate-400">
                    {currentStep + 1} / {tour.steps.length}
                  </span>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{step.content}</p>
              </div>

              {/* Progress bar */}
              <div className="px-4">
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 pt-3">
                <button
                  onClick={handleDismiss}
                  className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Passer le tour
                </button>
                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      className="border-slate-700"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  )}
                  {step.action ? (
                    <Button
                      size="sm"
                      onClick={handleAction}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {step.action.label}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLastStep ? (
                        <>
                          Terminer
                          <Check className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Suivant
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion>
          )}
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

const ProductTourContentMemo = memo(ProductTourContent);

export function ProductTour(props: ProductTourProps) {
  return (
    <ErrorBoundary componentName="ProductTour">
      <ProductTourContentMemo {...props} />
    </ErrorBoundary>
  );
}

export default ProductTour;


