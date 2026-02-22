/**
 * Product Tour Module
 * O-006: Export centralisé du système de product tour
 */

export { ProductTour, default as ProductTourComponent } from './ProductTour';
export { useTour, default as useTourDefault } from './useTour';
export { 
  ALL_TOURS, 
  DASHBOARD_TOUR, 
  CUSTOMIZER_TOUR, 
  ANALYTICS_TOUR,
  AB_TESTING_TOUR,
  INTEGRATIONS_TOUR,
  getTourById, 
  getToursForRoute 
} from './tours';
export type { Tour, TourStep, TourState, TourProgress } from './types';


