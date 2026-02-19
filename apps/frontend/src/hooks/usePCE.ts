'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

const PCE_BASE = '/api/v1/pce';

// ── Dashboard ────────────────────────────────────────────────────────

export function usePCEDashboard() {
  return useQuery({
    queryKey: ['pce', 'dashboard'],
    queryFn: () => api.get(`${PCE_BASE}/dashboard`),
    refetchInterval: 30_000,
  });
}

export function usePCEMetrics(period = 'day') {
  return useQuery({
    queryKey: ['pce', 'metrics', period],
    queryFn: () => api.get(`${PCE_BASE}/dashboard/metrics`, { params: { period } }),
  });
}

// ── Pipelines ────────────────────────────────────────────────────────

export function usePipelines(options?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['pce', 'pipelines', options],
    queryFn: () => api.get(`${PCE_BASE}/pipelines`, { params: options }),
  });
}

export function usePipeline(pipelineId: string) {
  return useQuery({
    queryKey: ['pce', 'pipeline', pipelineId],
    queryFn: () => api.get(`${PCE_BASE}/pipelines/${pipelineId}`),
    enabled: !!pipelineId,
    refetchInterval: 5_000,
  });
}

export function useProcessOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { orderId: string; options?: Record<string, unknown> }) =>
      api.post(`${PCE_BASE}/process-order`, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAdvancePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { pipelineId: string; targetStage?: string }) =>
      api.put(`${PCE_BASE}/pipelines/${params.pipelineId}/advance`, {
        targetStage: params.targetStage,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'pipeline', variables.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pce', 'pipelines'] });
    },
  });
}

export function useRetryPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pipelineId: string) =>
      api.put(`${PCE_BASE}/pipelines/${pipelineId}/retry`),
    onSuccess: (_, pipelineId) => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'pipeline', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pce', 'pipelines'] });
    },
  });
}

export function useCancelPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { pipelineId: string; reason?: string }) =>
      api.put(`${PCE_BASE}/pipelines/${params.pipelineId}/cancel`, {
        reason: params.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce'] });
    },
  });
}

// ── Order Status ─────────────────────────────────────────────────────

export function useOrderProcessingStatus(orderId: string) {
  return useQuery({
    queryKey: ['pce', 'order', orderId, 'status'],
    queryFn: () => api.get(`${PCE_BASE}/orders/${orderId}/status`),
    enabled: !!orderId,
    refetchInterval: 10_000,
  });
}

// ── Queues ───────────────────────────────────────────────────────────

export function useQueues() {
  return useQuery({
    queryKey: ['pce', 'queues'],
    queryFn: () => api.get(`${PCE_BASE}/queues`),
    refetchInterval: 10_000,
  });
}

export function usePauseQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueName: string) => api.put(`${PCE_BASE}/queues/${queueName}/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'queues'] });
    },
  });
}

export function useResumeQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueName: string) => api.put(`${PCE_BASE}/queues/${queueName}/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'queues'] });
    },
  });
}

export function useRetryFailedJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { queueName: string; limit?: number }) =>
      api.post(`${PCE_BASE}/queues/${params.queueName}/retry-failed`, null, {
        params: { limit: params.limit },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'queues'] });
    },
  });
}

// ── Ecommerce ───────────────────────────────────────────────────────────

export function useEcommerceConnections() {
  return useQuery({
    queryKey: ['pce', 'ecommerce', 'connections'],
    queryFn: () => api.get<unknown>(`${PCE_BASE}/ecommerce/connections`),
  });
}

export function useConnectEcommerce() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<unknown>(`${PCE_BASE}/ecommerce/connections`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'ecommerce', 'connections'] });
    },
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: Record<string, unknown>) =>
      api.post<unknown>(`${PCE_BASE}/ecommerce/sync`, data ?? {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce'] });
    },
  });
}

// ── Manufacturing ───────────────────────────────────────────────────────

export function usePODProviders() {
  return useQuery({
    queryKey: ['pce', 'manufacturing', 'providers'],
    queryFn: () => api.get<unknown>(`${PCE_BASE}/manufacturing/providers`),
  });
}

export function useRegisterPODProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<unknown>(`${PCE_BASE}/manufacturing/providers`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'manufacturing', 'providers'] });
    },
  });
}

export function useProductionOrders(options?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['pce', 'manufacturing', 'production-orders', options],
    queryFn: () => api.get<unknown>(`${PCE_BASE}/manufacturing/production-orders`, { params: options }),
  });
}

export function useProductionOrder(id: string | null) {
  return useQuery({
    queryKey: ['pce', 'manufacturing', 'production-orders', id],
    queryFn: () => api.get<unknown>(`${PCE_BASE}/manufacturing/production-orders/${id}`),
    enabled: !!id,
  });
}

export function useCreateProductionOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<unknown>(`${PCE_BASE}/manufacturing/production-orders`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'manufacturing', 'production-orders'] });
    },
  });
}

export function useCancelProductionOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.put<unknown>(`${PCE_BASE}/manufacturing/production-orders/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'manufacturing', 'production-orders'] });
    },
  });
}

export function useManufacturingQuotes() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<unknown>(`${PCE_BASE}/manufacturing/quotes`, data),
  });
}

// ── Fulfillment ─────────────────────────────────────────────────────────

export function useFulfillments(options?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['pce', 'fulfillment', options],
    queryFn: () => api.get<unknown>(`${PCE_BASE}/fulfillment`, { params: options }),
  });
}

export function useFulfillment(id: string | null) {
  return useQuery({
    queryKey: ['pce', 'fulfillment', id],
    queryFn: () => api.get<unknown>(`${PCE_BASE}/fulfillment/${id}`),
    enabled: !!id,
  });
}

export function useCreateFulfillment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { pipelineId: string }) =>
      api.post<unknown>(`${PCE_BASE}/fulfillment`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'fulfillment'] });
    },
  });
}

export function useShipFulfillment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; trackingNumber?: string; carrier?: string }) =>
      api.put<unknown>(`${PCE_BASE}/fulfillment/${params.id}/ship`, {
        trackingNumber: params.trackingNumber,
        carrier: params.carrier,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'fulfillment'] });
    },
  });
}

export function useDeliverFulfillment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.put<unknown>(`${PCE_BASE}/fulfillment/${id}/deliver`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'fulfillment'] });
    },
  });
}

export function useCancelFulfillment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.put<unknown>(`${PCE_BASE}/fulfillment/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'fulfillment'] });
    },
  });
}

// ── Shipping ────────────────────────────────────────────────────────────

export function useShippingRates() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<unknown>(`${PCE_BASE}/shipping/rates`, data),
  });
}

export function useValidateAddress() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<unknown>(`${PCE_BASE}/shipping/validate-address`, data),
  });
}

export function useShippingCarriers() {
  return useQuery({
    queryKey: ['pce', 'shipping', 'carriers'],
    queryFn: () => api.get<unknown>(`${PCE_BASE}/shipping/carriers`),
  });
}

// ── Returns ─────────────────────────────────────────────────────────────

export function useReturns(options?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['pce', 'returns', options],
    queryFn: () => api.get<unknown>(`${PCE_BASE}/returns`, { params: options }),
  });
}

export function useReturn(id: string | null) {
  return useQuery({
    queryKey: ['pce', 'returns', id],
    queryFn: () => api.get<unknown>(`${PCE_BASE}/returns/${id}`),
    enabled: !!id,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<unknown>(`${PCE_BASE}/returns`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'returns'] });
    },
  });
}

export function useProcessReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; action: string; notes?: string }) =>
      api.put<unknown>(`${PCE_BASE}/returns/${params.id}/process`, {
        action: params.action,
        notes: params.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'returns'] });
    },
  });
}

export function useMarkReturnReceived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.put<unknown>(`${PCE_BASE}/returns/${id}/received`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'returns'] });
    },
  });
}

export function useProcessRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; amountCents?: number; reason?: string }) =>
      api.put<unknown>(`${PCE_BASE}/returns/${params.id}/refund`, {
        amountCents: params.amountCents,
        reason: params.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce', 'returns'] });
    },
  });
}
