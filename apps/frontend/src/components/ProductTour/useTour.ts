/**
 * useTour Hook
 * O-006: Hook pour gérer les product tours
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { Tour, TourState } from './types';
import { getToursForRoute, getTourById, ALL_TOURS } from './tours';

const STORAGE_KEY = 'luneo_tours';

interface UseTourOptions {
  autoStart?: boolean;
}

export function useTour(options: UseTourOptions = {}) {
  const { autoStart = true } = options;
  const pathname = usePathname();
  
  const [state, setState] = useState<TourState>(() => {
    if (typeof window === 'undefined') {
      return {
        activeTour: null,
        currentStep: 0,
        completedTours: [],
        dismissedTours: [],
        isVisible: false,
      };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          activeTour: null,
          currentStep: 0,
          isVisible: false,
        };
      } catch {
        // Ignore parse errors
      }
    }

    return {
      activeTour: null,
      currentStep: 0,
      completedTours: [],
      dismissedTours: [],
      isVisible: false,
    };
  });

  // Persist state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        completedTours: state.completedTours,
        dismissedTours: state.dismissedTours,
      }));
    }
  }, [state.completedTours, state.dismissedTours]);

  // Check for auto-start tours on route change
  useEffect(() => {
    if (!autoStart || state.activeTour) return;

    const toursForRoute = getToursForRoute(pathname);
    
    // Find first eligible tour
    const eligibleTour = toursForRoute.find(tour => {
      // Skip if already completed or dismissed
      if (state.completedTours.includes(tour.id) || state.dismissedTours.includes(tour.id)) {
        return false;
      }
      // Only auto-start first_visit tours
      if (tour.trigger !== 'first_visit') {
        return false;
      }
      return true;
    });

    if (eligibleTour) {
      setTimeout(() => {
        startTour(eligibleTour.id);
      }, eligibleTour.delay || 1000);
    }
  }, [pathname, autoStart, state.activeTour, state.completedTours, state.dismissedTours]);

  // Start a tour
  const startTour = useCallback((tourId: string) => {
    const tour = getTourById(tourId);
    if (!tour) {
      console.warn(`Tour "${tourId}" not found`);
      return;
    }

    setState(prev => ({
      ...prev,
      activeTour: tourId,
      currentStep: 0,
      isVisible: true,
    }));
  }, []);

  // Complete a tour
  const completeTour = useCallback((tourId: string) => {
    setState(prev => ({
      ...prev,
      activeTour: null,
      currentStep: 0,
      isVisible: false,
      completedTours: [...new Set([...prev.completedTours, tourId])],
    }));
  }, []);

  // Dismiss a tour
  const dismissTour = useCallback((tourId: string) => {
    setState(prev => ({
      ...prev,
      activeTour: null,
      currentStep: 0,
      isVisible: false,
      dismissedTours: [...new Set([...prev.dismissedTours, tourId])],
    }));
  }, []);

  // Set current step
  const setStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  // Reset all tours (for testing/debugging)
  const resetAllTours = useCallback(() => {
    setState({
      activeTour: null,
      currentStep: 0,
      completedTours: [],
      dismissedTours: [],
      isVisible: false,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Get active tour
  const activeTour = state.activeTour ? getTourById(state.activeTour) : null;

  // Check if tour is completed
  const isTourCompleted = useCallback((tourId: string) => {
    return state.completedTours.includes(tourId);
  }, [state.completedTours]);

  // Check if tour is dismissed
  const isTourDismissed = useCallback((tourId: string) => {
    return state.dismissedTours.includes(tourId);
  }, [state.dismissedTours]);

  // Get available tours for current route
  const availableTours = getToursForRoute(pathname);

  return {
    // State
    activeTour,
    currentStep: state.currentStep,
    isVisible: state.isVisible,
    completedTours: state.completedTours,
    dismissedTours: state.dismissedTours,
    
    // Actions
    startTour,
    completeTour,
    dismissTour,
    setStep,
    resetAllTours,
    
    // Helpers
    isTourCompleted,
    isTourDismissed,
    availableTours,
    allTours: ALL_TOURS,
  };
}

export default useTour;


