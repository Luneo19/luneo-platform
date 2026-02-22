/**
 * Session Store
 * Manages session tracking, pricing, and save state
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger } from '@/lib/logger';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type SessionStatus =
  | 'idle'
  | 'active'
  | 'saving'
  | 'exporting'
  | 'completed';

export interface PriceItem {
  id: string;
  label: string;
  amount: number;
  quantity?: number;
  type: 'base' | 'color' | 'text' | 'image' | 'shipping' | 'discount' | 'tax';
}

// -----------------------------------------------------------------------------
// State Interface
// -----------------------------------------------------------------------------

interface SessionState {
  sessionId: string | null;
  sessionStatus: SessionStatus;
  calculatedPrice: number;
  priceBreakdown: PriceItem[];
  lastSavedAt: Date | null;
  isDirty: boolean;
  autoSaveEnabled: boolean;
}

interface SessionActions {
  startSession: (customizerId: string) => void;
  setSessionStatus: (status: SessionStatus) => void;
  updatePrice: (price: number, breakdown: PriceItem[]) => void;
  markDirty: () => void;
  markClean: () => void;
  setLastSaved: (date: Date | null) => void;
  endSession: () => void;
}

type SessionStore = SessionState & SessionActions;

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const initialState: SessionState = {
  sessionId: null,
  sessionStatus: 'idle',
  calculatedPrice: 0,
  priceBreakdown: [],
  lastSavedAt: null,
  isDirty: false,
  autoSaveEnabled: true,
};

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useSessionStore = create<SessionStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        startSession: (customizerId: string) => {
          const sessionId = crypto.randomUUID();
          set((state) => {
            state.sessionId = sessionId;
            state.sessionStatus = 'active';
            state.isDirty = false;
            state.lastSavedAt = null;
          });
          logger.info('Session started', { customizerId, sessionId });
        },

        setSessionStatus: (status: SessionStatus) => {
          set((state) => {
            state.sessionStatus = status;
          });
        },

        updatePrice: (price: number, breakdown: PriceItem[]) => {
          set((state) => {
            state.calculatedPrice = price;
            state.priceBreakdown = breakdown;
          });
        },

        markDirty: () => {
          set((state) => {
            state.isDirty = true;
          });
        },

        markClean: () => {
          set((state) => {
            state.isDirty = false;
          });
        },

        setLastSaved: (date: Date | null) => {
          set((state) => {
            state.lastSavedAt = date;
            state.isDirty = false;
          });
        },

        endSession: () => {
          const { sessionId } = get();
          set((state) => {
            Object.assign(state, initialState);
          });
          logger.info('Session ended', { sessionId });
        },
      }))
    ),
    { name: 'SessionStore' }
  )
);
