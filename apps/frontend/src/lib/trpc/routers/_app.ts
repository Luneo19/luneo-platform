/**
 * ★★★ APP ROUTER TRPC - ROUTER PRINCIPAL ★★★
 * Combine tous les routers en un seul appRouter
 */

import { router } from '../server';
import { analyticsRouter } from './analytics';
import { customizationRouter } from './customization';
import { productRouter } from './product';
import { arRouter } from './ar';
import { orderRouter } from './order';
import { billingRouter } from './billing';
import { notificationRouter } from './notification';
import { adminRouter } from './admin';
import { integrationRouter } from './integration';
import { teamRouter } from './team';
import { libraryRouter } from './library';
import { designRouter } from './design';
import { profileRouter } from './profile';
import { aiRouter } from './ai';
import { abTestingRouter } from './ab-testing';
import { analyticsAdvancedRouter } from './analytics-advanced';
import { aiStudioRouter } from './ai-studio';
import { collaborationRouter } from './collaboration';

// ========================================
// APP ROUTER
// ========================================

export const appRouter = router({
  customization: customizationRouter,
  product: productRouter,
  ar: arRouter,
  order: orderRouter,
  billing: billingRouter,
  analytics: analyticsRouter,
  notification: notificationRouter,
  admin: adminRouter,
  integration: integrationRouter,
  team: teamRouter,
  library: libraryRouter,
  design: designRouter,
  profile: profileRouter,
  ai: aiRouter,
  abTesting: abTestingRouter,
  analyticsAdvanced: analyticsAdvancedRouter,
  aiStudio: aiStudioRouter,
  collaboration: collaborationRouter,
});

export type AppRouter = typeof appRouter;

