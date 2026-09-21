import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi, inventoryApi, cashRegisterApi } from '../services/api';

export function useDashboard() {
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => salesApi.summary().then((res) => res.data),
    staleTime: 1 * 60 * 1000,
  });

  const recentSalesQuery = useQuery({
    queryKey: ['recent-sales'],
    queryFn: () => salesApi.list({ limit: 10 }).then((res) => res.data),
    staleTime: 30 * 1000,
  });

  const lowStockQuery = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryApi.lowStock().then((res) => res.data),
    staleTime: 1 * 60 * 1000,
  });

  const rawSales = recentSalesQuery.data?.data;
  const salesList = Array.isArray(rawSales) ? rawSales : rawSales?.sales || [];

  const rawLowStock = lowStockQuery.data?.data;
  const lowStockList = Array.isArray(rawLowStock) ? rawLowStock : rawLowStock?.products || [];

  return {
    stats: statsQuery.data?.data,
    recentSales: salesList,
    lowStock: lowStockList,
    isLoading: statsQuery.isLoading,
  };
}

export function useSales() {
  const queryClient = useQueryClient();

  const salesQuery = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesApi.list().then((res) => res.data),
    staleTime: 30 * 1000,
  });

  const rawSales = salesQuery.data?.data;
  const salesList = Array.isArray(rawSales) ? rawSales : rawSales?.sales || [];

  const createMutation = useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      salesApi.return(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
  });

  return {
    sales: salesList,
    isLoading: salesQuery.isLoading,
    createSale: createMutation.mutateAsync,
    processReturn: returnMutation.mutateAsync,
  };
}

export function useCashRegister() {
  const query = useQuery({
    queryKey: ['cash-status'],
    queryFn: () => cashRegisterApi.status().then((res) => res.data),
    refetchInterval: 30000,
  });

  const openMutation = useMutation({
    mutationFn: cashRegisterApi.open,
    onSuccess: () => query.refetch(),
  });

  const closeMutation = useMutation({
    mutationFn: cashRegisterApi.close,
    onSuccess: () => query.refetch(),
  });

  return {
    cashStatus: query.data?.data,
    isLoading: query.isLoading,
    openRegister: openMutation.mutateAsync,
    closeRegister: closeMutation.mutateAsync,
  };
}
