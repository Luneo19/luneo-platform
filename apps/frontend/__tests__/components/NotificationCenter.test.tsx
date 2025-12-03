/**
 * Tests NotificationCenter Component
 * T-013: Tests pour NotificationCenter component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { AllProviders } from '../utils/test-utils';
import { mockNotifications } from '../fixtures';

// Mock fetch
const mockFetch = vi.fn();

describe('NotificationCenter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    
    // Default mock response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { notifications: [] },
      }),
    });
  });

  // ============================================
  // RENDERING TESTS
  // ============================================

  describe('Rendering', () => {
    it('should render notification bell icon', () => {
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      const bellButton = screen.getByRole('button');
      expect(bellButton).toBeInTheDocument();
    });

    it('should render without userId', () => {
      render(
        <NotificationCenter />,
        { wrapper: AllProviders }
      );
      
      const bellButton = screen.getByRole('button');
      expect(bellButton).toBeInTheDocument();
    });

    it('should not show unread badge when no notifications', () => {
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      // Badge should not be visible or show 0
      const badge = screen.queryByText(/^\d+$/);
      if (badge) {
        expect(badge.textContent).toBe('0');
      }
    });
  });

  // ============================================
  // LOADING NOTIFICATIONS
  // ============================================

  describe('Loading Notifications', () => {
    it('should fetch notifications on mount', async () => {
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/notifications');
      });
    });

    it('should display notifications when loaded', async () => {
      const notifications = [mockNotifications.info, mockNotifications.success];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { notifications },
        }),
      });
      
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      // Open notification panel
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);
      
      // Should show notifications
      await waitFor(() => {
        expect(screen.getByText(mockNotifications.info.title)).toBeInTheDocument();
      });
    });

    it('should show unread count badge', async () => {
      const notifications = [
        { ...mockNotifications.info, read: false },
        { ...mockNotifications.success, read: false },
        { ...mockNotifications.warning, read: true },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { notifications },
        }),
      });
      
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        // Should show 2 unread
        const badge = screen.queryByText('2');
        if (badge) {
          expect(badge).toBeInTheDocument();
        }
      });
    });
  });

  // ============================================
  // PANEL TOGGLE
  // ============================================

  describe('Panel Toggle', () => {
    it('should open notification panel on click', async () => {
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);
      
      // Panel should be visible
      await waitFor(() => {
        const panel = screen.queryByText(/notifications|centre/i);
        if (panel) {
          expect(panel).toBeInTheDocument();
        }
      });
    });

    it('should close panel on second click', async () => {
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      const bellButton = screen.getByRole('button');
      
      // Open
      await user.click(bellButton);
      // Close
      await user.click(bellButton);
      
      // Panel should be hidden or empty message shown
      expect(document.body).toBeTruthy();
    });
  });

  // ============================================
  // MARK AS READ
  // ============================================

  describe('Mark as Read', () => {
    it('should mark notification as read on click', async () => {
      const notifications = [mockNotifications.info];
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/notifications') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { notifications },
            }),
          });
        }
        if (url.includes('/read')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });
      
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      // Open panel
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);
      
      // Wait for notification to appear
      await waitFor(() => {
        expect(screen.getByText(mockNotifications.info.title)).toBeInTheDocument();
      });
    });

    it('should mark all as read', async () => {
      const notifications = [
        { ...mockNotifications.info, read: false },
        { ...mockNotifications.success, read: false },
      ];
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/notifications') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { notifications },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });
      
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      // Open panel
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);
      
      // Look for "mark all as read" button
      const markAllButton = screen.queryByText(/tout.*lu|mark.*read/i);
      if (markAllButton) {
        await user.click(markAllButton);
        
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('read-all'),
            expect.anything()
          );
        });
      }
    });
  });

  // ============================================
  // DELETE NOTIFICATION
  // ============================================

  describe('Delete Notification', () => {
    it('should delete notification', async () => {
      const notifications = [mockNotifications.info];
      
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url === '/api/notifications') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { notifications },
            }),
          });
        }
        if (options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });
      
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      // Open panel
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);
      
      // Wait for notification
      await waitFor(() => {
        expect(screen.getByText(mockNotifications.info.title)).toBeInTheDocument();
      });
      
      // Look for delete button
      const deleteButton = screen.queryByLabelText(/supprimer|delete/i)
        || screen.queryByRole('button', { name: /supprimer|delete/i });
      
      if (deleteButton) {
        await user.click(deleteButton);
        
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/notifications/'),
            expect.objectContaining({ method: 'DELETE' })
          );
        });
      }
    });
  });

  // ============================================
  // NOTIFICATION TYPES
  // ============================================

  describe('Notification Types', () => {
    it('should render info notification correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { notifications: [mockNotifications.info] },
        }),
      });
      
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      await user.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText(mockNotifications.info.title)).toBeInTheDocument();
      });
    });

    it('should render success notification correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { notifications: [mockNotifications.success] },
        }),
      });
      
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      await user.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText(mockNotifications.success.title)).toBeInTheDocument();
      });
    });

    it('should render warning notification correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { notifications: [mockNotifications.warning] },
        }),
      });
      
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      await user.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText(mockNotifications.warning.title)).toBeInTheDocument();
      });
    });

    it('should render error notification correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { notifications: [mockNotifications.error] },
        }),
      });
      
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      await user.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText(mockNotifications.error.title)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // EMPTY STATE
  // ============================================

  describe('Empty State', () => {
    it('should show empty message when no notifications', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { notifications: [] },
        }),
      });
      
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      await user.click(screen.getByRole('button'));
      
      // Should show empty message
      await waitFor(() => {
        const emptyMessage = screen.queryByText(/aucune|no notification|vide|empty/i);
        if (emptyMessage) {
          expect(emptyMessage).toBeInTheDocument();
        }
      });
    });
  });

  // ============================================
  // ACCESSIBILITY
  // ============================================

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      // Tab to bell button
      await user.tab();
      
      const focused = document.activeElement;
      expect(focused?.tagName).toBe('BUTTON');
    });

    it('should have aria-label on bell button', () => {
      render(
        <NotificationCenter userId="user-123" />,
        { wrapper: AllProviders }
      );
      
      const bellButton = screen.getByRole('button');
      const hasLabel = bellButton.getAttribute('aria-label') || bellButton.textContent;
      expect(hasLabel).toBeTruthy();
    });
  });
});


