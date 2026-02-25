import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { AllProviders } from '../utils/test-utils';
import { api } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('NotificationCenter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({
      notifications: [],
      unreadCount: 0,
    } as never);
    vi.mocked(api.patch).mockResolvedValue({} as never);
    vi.mocked(api.post).mockResolvedValue({} as never);
    vi.mocked(api.delete).mockResolvedValue({} as never);
  });

  it('affiche le bouton de notifications', () => {
    render(<NotificationCenter />, { wrapper: AllProviders });
    expect(screen.getByTestId('notification-center-button')).toBeInTheDocument();
  });

  it('ouvre le dialog et affiche l’état vide', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />, { wrapper: AllProviders });

    await user.click(screen.getByTestId('notification-center-button'));

    expect(await screen.findByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Aucune notification')).toBeInTheDocument();
  });

  it('affiche une notification chargée depuis l’API', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      notifications: [
        {
          id: 'n1',
          title: 'Nouveau lead',
          message: 'Un lead vient d’arriver',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    } as never);

    const user = userEvent.setup();
    render(<NotificationCenter />, { wrapper: AllProviders });

    await user.click(screen.getByTestId('notification-center-button'));
    expect(await screen.findByText('Nouveau lead')).toBeInTheDocument();
  });

  it('déclenche la suppression', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      notifications: [
        {
          id: 'n2',
          title: 'Action requise',
          message: 'Merci de valider',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    } as never);

    const user = userEvent.setup();
    render(<NotificationCenter />, { wrapper: AllProviders });

    await user.click(screen.getByTestId('notification-center-button'));
    await screen.findByText('Action requise');

    const deleteButton = screen.getByLabelText('Supprimer la notification');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/v1/notifications/n2');
    });
  });

  it('déclenche “tout marquer comme lu”', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      notifications: [
        {
          id: 'n3',
          title: 'Alerte',
          message: 'Alerte de sécurité',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    } as never);

    const user = userEvent.setup();
    render(<NotificationCenter />, { wrapper: AllProviders });
    await user.click(screen.getByTestId('notification-center-button'));

    const button = await screen.findByRole('button', { name: /Tout marquer comme lu/i });
    await user.click(button);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/notifications/read-all');
    });
  });
});


