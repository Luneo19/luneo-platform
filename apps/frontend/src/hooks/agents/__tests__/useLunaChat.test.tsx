/**
 * useLunaChat - Tests unitaires
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLunaChat } from '../useLunaChat';
import { endpoints } from '@/lib/api/client';

const mockChatFn = vi.fn();
const mockActionFn = vi.fn();
const mockConversationsFn = vi.fn();

vi.mock('@/lib/api/client', () => ({
  endpoints: {
    agents: {
      luna: {
        chat: (...args: unknown[]) => mockChatFn(...args),
        action: (...args: unknown[]) => mockActionFn(...args),
        conversations: (...args: unknown[]) => mockConversationsFn(...args),
      },
    },
  },
}));

describe('useLunaChat', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('should send a message successfully', async () => {
    // Arrange
    const mockResponse = {
      success: true,
      data: {
        conversationId: 'conv-123',
        message: 'Réponse de Luna',
        intent: 'analyze_sales',
        confidence: 0.9,
        actions: [],
        suggestions: [],
      },
    };

    mockChatFn.mockResolvedValue(mockResponse);

    // Act
    const { result } = renderHook(() => useLunaChat(), { wrapper });

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const response = await result.current.sendMessage({
      message: 'Test message',
    });

    expect(response).toBeDefined();
    expect(response.message).toBe('Réponse de Luna');
    expect(mockChatFn).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    const error = new Error('API Error');
    mockChatFn.mockRejectedValue(error);

    // Act
    const { result } = renderHook(() => useLunaChat(), { wrapper });

    // Assert
    await expect(
      result.current.sendMessage({ message: 'Test' }),
    ).rejects.toThrow('API Error');
  });

  it('should execute an action', async () => {
    // Arrange
    const mockAction = {
      type: 'create_product' as const,
      label: 'Créer produit',
      payload: {},
      requiresConfirmation: false,
    };

    mockActionFn.mockResolvedValue({
      success: true,
      data: {},
    });

    // Act
    const { result } = renderHook(() => useLunaChat(), { wrapper });

    await result.current.executeAction(mockAction);

    // Assert
    expect(mockActionFn).toHaveBeenCalledWith({
      action: mockAction,
    });
  });
});
