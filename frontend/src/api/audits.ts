// frontend/src/api/audits.ts
// Audit API hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { 
  AuditSession, 
  PaginatedResponse, 
  AuditFilters, 
  CreateAuditInput,
  AuditScanInput,
  AuditReconcileInput
} from '../types/api';

export const auditKeys = {
  all: ['audits'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filters: AuditFilters) => [...auditKeys.lists(), filters] as const,
  details: () => [...auditKeys.all, 'detail'] as const,
  detail: (id: string) => [...auditKeys.details(), id] as const,
  reports: () => [...auditKeys.all, 'report'] as const,
};

export function useAudits(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => api.get<PaginatedResponse<AuditSession>>('/audits', filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useAudit(id: string) {
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: () => api.get<AuditSession>(`/audits/${id}`),
    enabled: !!id,
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAuditInput) => api.post<{ id: string; name: string }>('/audits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditKeys.lists() });
    },
  });
}

export function useStartAudit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.post<{ message: string }>(`/audits/${id}/start`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: auditKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditKeys.detail(id) });
    },
  });
}

export function useSubmitScan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AuditScanInput }) => 
      api.post<{ message: string; item: { id: string; status: string } }>(`/audits/${id}/scan`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: auditKeys.detail(id) });
    },
  });
}

export function useReconcileDiscrepancy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, discrepancyId, data }: { id: string; discrepancyId: string; data: AuditReconcileInput }) => 
      api.post<{ message: string }>(`/audits/${id}/discrepancies/${discrepancyId}/resolve`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: auditKeys.detail(id) });
    },
  });
}

export function useCompleteAudit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.post<{ message: string }>(`/audits/${id}/complete`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: auditKeys.lists() });
      queryClient.invalidateQueries({ queryKey: auditKeys.detail(id) });
    },
  });
}

export function useExportAuditReport(id: string, format: 'pdf' | 'csv' | 'json' = 'csv') {
  return useMutation({
    mutationFn: () => api.get(`/audits/${id}/report`, { format }),
  });
}