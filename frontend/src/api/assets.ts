// frontend/src/api/assets.ts
// Asset API hooks using TanStack Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { 
  Asset, 
  PaginatedResponse, 
  AssetFilters, 
  CreateAssetInput, 
  UpdateAssetInput,
  BulkAssetOperationInput,
  ImportPreviewInput,
  ImportCommitInput
} from '../types/api';

// Query keys
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: AssetFilters) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  exports: () => [...assetKeys.all, 'export'] as const,
  importPreview: () => [...assetKeys.all, 'import-preview'] as const,
};

// Fetch assets list
export function useAssets(filters: AssetFilters = {}) {
  return useQuery({
    queryKey: assetKeys.list(filters),
    queryFn: () => api.get<PaginatedResponse<Asset>>('/assets', filters),
    placeholderData: (previousData) => previousData,
  });
}

// Fetch single asset
export function useAsset(id: string) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => api.get<Asset>(`/assets/${id}`),
    enabled: !!id,
  });
}

// Create asset
export function useCreateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAssetInput) => api.post<{ id: string; asset_tag: string }>('/assets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

// Update asset
export function useUpdateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetInput }) => 
      api.patch<{ id: string }>(`/assets/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) });
    },
  });
}

// Delete asset
export function useDeleteAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

// Bulk operations
export function useBulkAssetOperation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BulkAssetOperationInput) => api.post('/assets/bulk', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

// Export assets
export function useExportAssets(filters: AssetFilters = {}) {
  return useQuery({
    queryKey: assetKeys.exports(),
    queryFn: () => api.get('/assets/export', { ...filters, format: 'csv' }),
    enabled: false, // Only fetch when manually triggered
  });
}

// Import preview
export function useImportPreview() {
  return useMutation({
    mutationFn: (data: ImportPreviewInput) => api.post('/assets/import/preview', data),
  });
}

// Commit import
export function useCommitImport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ImportCommitInput) => api.post('/assets/import/commit', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

// Asset events/history
export function useAssetEvents(assetId: string) {
  return useQuery({
    queryKey: [...assetKeys.detail(assetId), 'events'],
    queryFn: () => api.get<AssetEvent[]>(`/assets/${assetId}/events`),
    enabled: !!assetId,
  });
}

import type { AssetEvent } from '../types/api';