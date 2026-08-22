// frontend/src/api/webhooks.ts
// Webhooks API hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { PaginatedResponse, CreateWebhookInput } from '../types/api';

export const webhookKeys = {
  all: ['webhooks'] as const,
  lists: () => [...webhookKeys.all, 'list'] as const,
  list: (filters: { page?: number; limit?: number; status?: string } = {}) => [...webhookKeys.lists(), filters] as const,
  details: () => [...webhookKeys.all, 'detail'] as const,
  detail: (id: string) => [...webhookKeys.details(), id] as const,
  logs: (id: string) => [...webhookKeys.detail(id), 'logs'] as const,
};

export function useWebhooks(filters: { page?: number; limit?: number; status?: string } = {}) {
  return useQuery({
    queryKey: webhookKeys.list(filters),
    queryFn: () => api.get<PaginatedResponse<any>>('/webhooks', filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useWebhook(id: string) {
  return useQuery({
    queryKey: webhookKeys.detail(id),
    queryFn: () => api.get<any>(`/webhooks/${id}`),
    enabled: !!id,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateWebhookInput) => api.post<{ id: string; secret: string }>('/webhooks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWebhookInput> }) => 
      api.patch<{ id: string }>(`/webhooks/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(id) });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/webhooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { event?: string } }) => 
      api.post<{ success: boolean; status_code: number | null; response_time_ms: number; response_body: string | null }>(`/webhooks/${id}/test`, data),
  });
}

export function useWebhookLogs(id: string, filters: { page?: number; limit?: number; status?: string; start_date?: string; end_date?: string } = {}) {
  return useQuery({
    queryKey: [...webhookKeys.logs(id), filters],
    queryFn: () => api.get<PaginatedResponse<any>>(`/webhooks/${id}/logs`, filters),
    enabled: !!id,
    placeholderData: (previousData) => previousData,
  });
}

export function useRetryWebhookDelivery() {
  return useMutation({
    mutationFn: ({ id, logId }: { id: string; logId: string }) => 
      api.post<{ message: string }>(`/webhooks/${id}/logs/${logId}/retry`),
  });
}