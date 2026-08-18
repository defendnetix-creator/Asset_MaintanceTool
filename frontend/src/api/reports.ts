// frontend/src/api/reports.ts
// Reports API hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { 
  Report, 
  PaginatedResponse 
} from '../types/api';

export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (type?: string) => [...reportKeys.lists(), type] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
  prebuilt: () => [...reportKeys.all, 'prebuilt'] as const,
  dashboard: () => [...reportKeys.all, 'dashboard'] as const,
};

export function useReports(type?: string) {
  return useQuery({
    queryKey: reportKeys.list(type),
    queryFn: () => api.get<PaginatedResponse<Report>>('/reports', { type }),
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => api.get<Report>(`/reports/${id}`),
    enabled: !!id,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; description?: string; query: any; visualization?: any }) => 
      api.post<{ id: string; name: string }>('/reports', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

export function useRunReport(id: string) {
  return useMutation({
    mutationFn: (data?: { parameters?: Record<string, any>; format?: 'json' | 'csv' | 'xlsx' }) => 
      api.post<any>(`/reports/${id}/run`, data),
  });
}

export function usePrebuiltReports() {
  return useQuery({
    queryKey: reportKeys.prebuilt(),
    queryFn: () => api.get<any[]>('/reports/prebuilt/list'),
  });
}

export function useRunPrebuiltReport(reportId: string) {
  return useMutation({
    mutationFn: (data?: { parameters?: Record<string, any>; format?: 'json' | 'csv' | 'xlsx' }) => 
      api.post<any>(`/reports/prebuilt/${reportId}/run`, data),
  });
}

export function useDashboardWidgets() {
  return useQuery({
    queryKey: reportKeys.dashboard(),
    queryFn: () => api.get('/reports/dashboard/widgets'),
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
}

export function useScheduleReport() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { cron: string; timezone?: string; format?: string; recipients?: Array<{ email: string; name?: string }>; enabled?: boolean } }) => 
      api.post<{ id: string }>(`/reports/${id}/schedule`, data),
  });
}