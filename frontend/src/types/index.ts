export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier' | 'manager';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  salePrice: number;
  purchasePrice: number;
  categoryId: string;
  brandId?: string;
  stock: number;
  stockMin: number;
  barcode?: string;
  unit?: string;
  active: boolean;
  imagePrimary?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  brand?: Brand;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  userId: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  paid: number;
  change: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  status: 'completed' | 'cancelled' | 'returned';
  notes: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Return {
  id: string;
  saleId: string;
  userId: string;
  items: ReturnItem[];
  total: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  unitPrice: number;
}

export interface CashRegister {
  id: string;
  userId: string;
  openingAmount: number;
  closingAmount?: number;
  totalSales: number;
  totalReturns: number;
  totalDiscounts: number;
  cashDifference: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  transactions: CashTransaction[];
}

export interface CashTransaction {
  id: string;
  type: 'sale' | 'return' | 'expense' | 'income';
  amount: number;
  description: string;
  reference?: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  userId: string;
  createdAt: string;
}

export interface Report {
  id: string;
  type: 'sales' | 'inventory' | 'financial' | 'products';
  name: string;
  dateFrom: string;
  dateTo: string;
  data: Record<string, unknown>[];
  summary: Record<string, number>;
  createdAt: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  pagination?: PaginationData;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  categoryId: string;
  brandId: string;
  stock: number;
  minStock: number;
  barcode?: string;
}

export interface CreateSaleData {
  items: CartItem[];
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  discount: number;
  notes: string;
}

export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  revenueByDay: { date: string; revenue: number }[];
  topProducts: { name: string; sold: number }[];
  salesByCategory: { category: string; revenue: number }[];
}
