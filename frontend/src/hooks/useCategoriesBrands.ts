import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi, brandApi } from '../services/api';

export function useCategories() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const raw = query.data?.data;
  const categoriesList = Array.isArray(raw) ? raw : raw?.categories || [];

  const createMutation = useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      categoryApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  return {
    categories: categoriesList,
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
  };
}

export function useBrands() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandApi.list().then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const raw = query.data?.data;
  const brandsList = Array.isArray(raw) ? raw : raw?.brands || [];

  const createMutation = useMutation({
    mutationFn: brandApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      brandApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: brandApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  });

  return {
    brands: brandsList,
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
  };
}
