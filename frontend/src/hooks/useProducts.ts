import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../services/api';
import { useCartStore } from '../stores/authStore';

export function useProducts() {
  const queryClient = useQueryClient();
  const { addItem } = useCartStore();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.list().then((res) => res.data),
    staleTime: 2 * 60 * 1000,
  });

  const rawProducts = productsQuery.data?.data;
  const productsList = Array.isArray(rawProducts) ? rawProducts : rawProducts?.products || [];

  const createMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> | FormData }) =>
      productApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const stockUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { quantity: number; reason: string } }) =>
      productApi.stockUpdate(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  return {
    products: productsList,
    isLoading: productsQuery.isLoading,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    updateStock: stockUpdateMutation.mutateAsync,
    addToCart: addItem,
  };
}
