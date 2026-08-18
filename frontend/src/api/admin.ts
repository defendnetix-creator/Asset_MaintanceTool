// frontend/src/api/admin.ts
// Admin API hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { PaginatedResponse } from '../types/api';

export const adminKeys = {
  all: ['admin'] as const,
  settings: () => [...adminKeys.all, 'settings'] as const,
  branding: () => [...adminKeys.all, 'branding'] as const,
  subscription: () => [...adminKeys.all, 'subscription'] as const,
  auditLog: () => [...adminKeys.all, 'audit-log'] as const,
};

export function useTenantSettings() {
  return useQuery({
    queryKey: adminKeys.settings(),
    queryFn: () => api.get<any>('/admin/settings'),
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.patch('/admin/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
    },
  });
}

export function useBranding() {
  return useQuery({
    queryKey: adminKeys.branding(),
    queryFn: () => api.get<any>('/admin/branding'),
  });
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.patch('/admin/branding', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.branding() });
    },
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: adminKeys.subscription(),
    queryFn: () => api.get<any>('/admin/subscription'),
  });
}

export function useAuditLog(filters: { page?: number; limit?: number; user_id?: string; action?: string; resource_type?: string; start_date?: string; end_date?: string } = {}) {
  return useQuery({
    queryKey: [...adminKeys.auditLog(), filters],
    queryFn: () => api.get<PaginatedResponse<any>>('/admin/audit-log', filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useVerifyAuditLog() {
  return useMutation({
    mutationFn: () => api.post<{ verified: boolean; checked: number; tampered: any[] }>('/admin/audit-log/verify'),
  });
}