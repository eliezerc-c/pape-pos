import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
  register: (data: { name: string; email: string; password: string; role: string }) =>
    apiClient.post('/auth/register', data),
};

export const productApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/products', { params }),
  getById: (id: string) => apiClient.get(`/products/${id}`),
  create: (data: Record<string, unknown> | FormData) => apiClient.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: Record<string, unknown> | FormData) => apiClient.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
  toggle: (id: string) => apiClient.put(`/products/${id}/toggle`),
  search: (query: string) => apiClient.get(`/products/search?q=${query}`),
  stockUpdate: (id: string, data: { quantity: number; reason: string }) =>
    apiClient.post(`/products/${id}/stock`, data),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/products/import', formData);
  },
  export: () => apiClient.get('/products/export', { responseType: 'blob' }),
};

export const categoryApi = {
  list: () => apiClient.get('/categories'),
  create: (data: Record<string, unknown>) => apiClient.post('/categories', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/categories/${id}`, data),
  delete: (id: string) => apiClient.delete(`/categories/${id}`),
};

export const brandApi = {
  list: () => apiClient.get('/brands'),
  create: (data: Record<string, unknown>) => apiClient.post('/brands', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/brands/${id}`, data),
  delete: (id: string) => apiClient.delete(`/brands/${id}`),
};

export const salesApi = {
  create: (data: Record<string, unknown>) => apiClient.post('/sales', data),
  list: (params?: Record<string, unknown>) => apiClient.get('/sales', { params }),
  getById: (id: string) => apiClient.get(`/sales/${id}`),
  return: (id: string, data: Record<string, unknown>) => apiClient.post(`/sales/${id}/return`, data),
  summary: (params?: Record<string, unknown>) => apiClient.get('/sales/summary', { params }),
};

export const inventoryApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/inventory', { params }),
  move: (data: Record<string, unknown>) => apiClient.post('/inventory/move', data),
  lowStock: () => apiClient.get('/inventory/low-stock'),
};

export const cashRegisterApi = {
  open: (data: Record<string, unknown>) => apiClient.post('/cash/open', data),
  close: () => apiClient.post('/cash/close'),
  status: () => apiClient.get('/cash/status'),
  transactions: () => apiClient.get('/cash/transactions'),
};

export const reportApi = {
  generate: (data: Record<string, unknown>) => apiClient.post('/reports', data),
  export: (type: string, format: string) => apiClient.get(`/reports/export/${type}`, { responseType: 'blob' }),
};

export const userApi = {
  list: () => apiClient.get('/users'),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};
