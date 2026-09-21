import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api';
import type { LoginCredentials, User } from '../types';

export function useAuth() {
  const { user, token, isAuthenticated, login, logout, setUser, setToken } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data: { user: User; token: string }) => {
      setUser(data.user);
      setToken(data.token);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
    },
  });

  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authApi.me(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user,
    token,
    isAuthenticated,
    isLoading: loginMutation.isPending,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    currentUser: currentUserQuery.data as User | undefined,
    isCurrentUserLoading: currentUserQuery.isLoading,
  };
}

export function useProducts() {
  const { searchQuery } = useAppStore();

  const productsQuery = useQuery({
    queryKey: ['products', searchQuery],
    queryFn: () => {
      if (searchQuery) {
        return fetch(`/api/products/search?q=${searchQuery}`).then((r) => r.json());
      }
      return fetch('/api/products').then((r) => r.json());
    },
    enabled: !!searchQuery || true,
    staleTime: 2 * 60 * 1000,
  });

  const createProductMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/products/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    products: productsQuery.data,
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    createProduct: createProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutateAsync,
  };
}

import { queryClient } from './api';
import { useAppStore } from '../stores/appStore';
