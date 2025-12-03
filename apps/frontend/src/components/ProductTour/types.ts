/**
 * Product Tour Types
 * O-006: Types pour le système de product tour
 */

export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  spotlightPadding?: number;
  disableOverlay?: boolean;
  disableScroll?: boolean;
  action?: {
    label: string;
    onClick?: () => void;
  };
  beforeShow?: () => Promise<void> | void;
  afterShow?: () => Promise<void> | void;
  onComplete?: () => void;
}

export interface Tour {
  id: string;
  name: string;
  description?: string;
  steps: TourStep[];
  version?: number;
  showOnce?: boolean;
  showOnRoutes?: string[];
  trigger?: 'auto' | 'manual' | 'first_visit';
  delay?: number;
}

export interface TourState {
  activeTour: string | null;
  currentStep: number;
  completedTours: string[];
  dismissedTours: string[];
  isVisible: boolean;
}

export interface TourProgress {
  tourId: string;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  isComplete: boolean;
}

export interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TooltipPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}


