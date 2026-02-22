/**
 * UI Store
 * Manages UI state, panels, dialogs, and toasts
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type LeftPanelType =
  | 'layers'
  | 'templates'
  | 'clipart'
  | 'text'
  | 'images'
  | 'shapes';

export type RightPanelType =
  | 'properties'
  | 'colors'
  | 'fonts'
  | 'history'
  | 'pricing';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

// -----------------------------------------------------------------------------
// State Interface
// -----------------------------------------------------------------------------

interface UIState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  activeLeftPanel: LeftPanelType | null;
  activeRightPanel: RightPanelType | null;
  isMobile: boolean;
  mobileBottomSheetOpen: boolean;
  activeMobilePanel: string | null;
  confirmDialog: (ConfirmDialogOptions & { open: boolean }) | null;
  toasts: ToastItem[];
}

interface UIActions {
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanel: (panel: LeftPanelType | null) => void;
  setRightPanel: (panel: RightPanelType | null) => void;
  setMobile: (isMobile: boolean) => void;
  openMobilePanel: (panel: string) => void;
  closeMobilePanel: () => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
  closeConfirmDialog: () => void;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

type UIStore = UIState & UIActions;

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const initialState: UIState = {
  leftPanelOpen: true,
  rightPanelOpen: true,
  activeLeftPanel: 'layers',
  activeRightPanel: 'properties',
  isMobile: false,
  mobileBottomSheetOpen: false,
  activeMobilePanel: null,
  confirmDialog: null,
  toasts: [],
};

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useUIStore = create<UIStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        toggleLeftPanel: () => {
          set((state) => {
            state.leftPanelOpen = !state.leftPanelOpen;
            if (!state.leftPanelOpen) {
              state.activeLeftPanel = null;
            } else if (!state.activeLeftPanel) {
              state.activeLeftPanel = 'layers';
            }
          });
        },

        toggleRightPanel: () => {
          set((state) => {
            state.rightPanelOpen = !state.rightPanelOpen;
            if (!state.rightPanelOpen) {
              state.activeRightPanel = null;
            } else if (!state.activeRightPanel) {
              state.activeRightPanel = 'properties';
            }
          });
        },

        setLeftPanel: (panel: LeftPanelType | null) => {
          set((state) => {
            state.activeLeftPanel = panel;
            state.leftPanelOpen = panel !== null;
          });
        },

        setRightPanel: (panel: RightPanelType | null) => {
          set((state) => {
            state.activeRightPanel = panel;
            state.rightPanelOpen = panel !== null;
          });
        },

        setMobile: (isMobile: boolean) => {
          set((state) => {
            state.isMobile = isMobile;
            if (!isMobile) {
              state.mobileBottomSheetOpen = false;
              state.activeMobilePanel = null;
            }
          });
        },

        openMobilePanel: (panel: string) => {
          set((state) => {
            state.mobileBottomSheetOpen = true;
            state.activeMobilePanel = panel;
          });
        },

        closeMobilePanel: () => {
          set((state) => {
            state.mobileBottomSheetOpen = false;
            state.activeMobilePanel = null;
          });
        },

        showConfirmDialog: (options: ConfirmDialogOptions) => {
          set((state) => {
            state.confirmDialog = {
              ...options,
              open: true,
            };
          });
        },

        closeConfirmDialog: () => {
          set((state) => {
            state.confirmDialog = null;
          });
        },

        addToast: (toast: Omit<ToastItem, 'id'>) => {
          const id = crypto.randomUUID();
          const toastItem: ToastItem = {
            ...toast,
            id,
            duration: toast.duration ?? 5000,
          };

          set((state) => {
            state.toasts.push(toastItem);
          });

          // Auto-remove toast after duration
          if (toastItem.duration && toastItem.duration > 0) {
            setTimeout(() => {
              get().removeToast(id);
            }, toastItem.duration);
          }
        },

        removeToast: (id: string) => {
          set((state) => {
            state.toasts = state.toasts.filter((toast) => toast.id !== id);
          });
        },
      }))
    ),
    { name: 'UIStore' }
  )
);
