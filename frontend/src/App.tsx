import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthPage } from './modules/auth/AuthPage';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { ProductsPage } from './modules/products/ProductsPage';
import { CategoriesPage } from './modules/categories/CategoriesPage';
import { BrandsPage } from './modules/brands/BrandsPage';
import { InventoryPage } from './modules/inventory/InventoryPage';
import { POSPage } from './modules/pos/POSPage';
import { SalesPage } from './modules/sales/SalesPage';
import { ReturnsPage } from './modules/returns/ReturnsPage';
import { CashRegisterPage } from './modules/cashregister/CashRegisterPage';
import { ReportsPage } from './modules/reports/ReportsPage';
import { UsersPage } from './modules/users/UsersPage';
import { SettingsPage } from './modules/settings/SettingsPage';

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'brands', element: <BrandsPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'pos', element: <POSPage /> },
      { path: 'sales', element: <SalesPage /> },
      { path: 'returns', element: <ReturnsPage /> },
      { path: 'cash', element: <CashRegisterPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
