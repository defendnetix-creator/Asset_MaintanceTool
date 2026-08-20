// frontend/src/api/users.ts
// Users API hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { 
  User, 
  PaginatedResponse, 
  UserFilters, 
  CreateUserInput, 
  UpdateUserInput 
} from '../types/api';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  apiKeys: (id: string) => [...userKeys.detail(id), 'api-keys'] as const,
};

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => api.get<PaginatedResponse<User>>('/users', { ...filters, additionalProperties: true }),
    placeholderData: (previousData) => previousData,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => api.get<User>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateUserInput) => api.post<{ id: string; email: string }>('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) => 
      api.patch<{ id: string }>(`/users/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useBulkInviteUsers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { users: CreateUserInput[]; send_invites?: boolean }) => 
      api.post('/users/bulk-invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { new_password: string; send_email?: boolean } }) => 
      api.post<{ message: string }>(`/users/${id}/reset-password`, data),
  });
}

export function useResetUserMfa() {
  return useMutation({
    mutationFn: (id: string) => api.post<{ message: string; backup_codes: string[] }>(`/users/${id}/reset-mfa`),
  });
}

export function useRevokeUserSessions() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { exclude_current?: boolean } }) => 
      api.post<{ message: string; revoked_count: number }>(`/users/${id}/revoke-sessions`, data),
  });
}

export function useUserApiKeys(id: string) {
  return useQuery({
    queryKey: userKeys.apiKeys(id),
    queryFn: () => api.get<any[]>(`/users/${id}/api-keys`),
    enabled: !!id,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; scopes: string[]; expires_at?: string } }) => 
      api.post<{ id: string; name: string; key: string; scopes: string[] }>(`/users/${id}/api-keys`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.apiKeys(id) });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, keyId }: { id: string; keyId: string }) => 
      api.delete<{ message: string }>(`/users/${id}/api-keys/${keyId}`),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.apiKeys(id) });
    },
  });
}