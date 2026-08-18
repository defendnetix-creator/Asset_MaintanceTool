// frontend/src/api/maintenance.ts
// Maintenance API hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { 
  MaintenanceWorkOrder, 
  PaginatedResponse, 
  MaintenanceFilters, 
  CreateMaintenanceInput,
  MaintenanceCompleteSchema
} from '../types/api';

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (filters: MaintenanceFilters) => [...maintenanceKeys.lists(), filters] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
};

export function useMaintenanceWorkOrders(filters: MaintenanceFilters = {}) {
  return useQuery({
    queryKey: maintenanceKeys.list(filters),
    queryFn: () => api.get<PaginatedResponse<MaintenanceWorkOrder>>('/maintenance', filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useMaintenanceWorkOrder(id: string) {
  return useQuery({
    queryKey: maintenanceKeys.detail(id),
    queryFn: () => api.get<MaintenanceWorkOrder>(`/maintenance/${id}`),
    enabled: !!id,
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMaintenanceInput) => api.post<{ id: string; wo_number: string }>('/maintenance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
    },
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMaintenanceInput> }) => 
      api.patch<{ id: string }>(`/maintenance/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
    },
  });
}

export function useStartMaintenance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.post<{ message: string }>(`/maintenance/${id}/start`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
    },
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { condition_after: string; resolution: string; labor_hours?: number; parts_cost?: number; downtime_hours?: number } }) => 
      api.post<{ message: string }>(`/maintenance/${id}/complete`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
    },
  });
}

export function useAddMaintenanceTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string; description?: string; order?: number } }) => 
      api.post<{ id: string }>(`/maintenance/${id}/tasks`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
    },
  });
}

export function useUpdateMaintenanceTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, taskId, data }: { id: string; taskId: string; data: { is_completed: boolean } }) => 
      api.patch<{ message: string }>(`/maintenance/${id}/tasks/${taskId}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
    },
  });
}

export function useAddMaintenancePart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { part_name: string; part_number?: string; quantity?: number; unit_cost?: number; source?: string } }) => 
      api.post<{ id: string }>(`/maintenance/${id}/parts`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
    },
  });
}

export function useAddMaintenanceLabor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { technician_id: string; hours: number; rate?: number; description?: string } }) => 
      api.post<{ id: string }>(`/maintenance/${id}/labor`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
    },
  });
}

export function useAddMaintenanceNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { content: string; is_internal?: boolean } }) => 
      api.post<{ id: string }>(`/maintenance/${id}/notes`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
    },
  });
}