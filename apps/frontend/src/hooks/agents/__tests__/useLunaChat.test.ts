/**
 * useLunaChat - Tests unitaires
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLunaChat } from '../useLunaChat';
import { endpoints } from '@/lib/api/client';

// Mock API client
jest.mock('@/lib/api/client', () => ({
  endpoints: {
    agents: {
      luna: {
        chat: jest.fn(),
        action: jest.fn(),
        conversations: jest.fn(),
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
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

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

    (endpoints.agents.luna.chat as jest.Mock).mockResolvedValue(mockResponse);

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
    expect(endpoints.agents.luna.chat).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    const error = new Error('API Error');
    (endpoints.agents.luna.chat as jest.Mock).mockRejectedValue(error);

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

    (endpoints.agents.luna.action as jest.Mock).mockResolvedValue({
      success: true,
      data: {},
    });

    // Act
    const { result } = renderHook(() => useLunaChat(), { wrapper });

    await result.current.executeAction(mockAction);

    // Assert
    expect(endpoints.agents.luna.action).toHaveBeenCalledWith({
      action: mockAction,
    });
  });
});
