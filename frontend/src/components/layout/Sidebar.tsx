import React from 'react';
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Calculator,
  BarChart3,
  Users,
  Settings,
  Box,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  collapsed?: boolean;
}

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pos', label: 'Punto de Venta', icon: ShoppingCart, shortcut: 'F2/F4' },
  { path: '/products', label: 'Productos', icon: Package, shortcut: 'F3' },
  { path: '/categories', label: 'Categorias', icon: Tag },
  { path: '/brands', label: 'Marcas', icon: Tag },
  { path: '/inventory', label: 'Inventario', icon: Box },
  { path: '/sales', label: 'Ventas', icon: Receipt },
  { path: '/returns', label: 'Devoluciones', icon: RotateCcw },
  { path: '/cash', label: 'Caja', icon: Calculator, shortcut: 'F6' },
  { path: '/reports', label: 'Reportes', icon: BarChart3 },
  { path: '/users', label: 'Usuarios', icon: Users },
  { path: '/settings', label: 'Configuracion', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = () => {
  const { sidebarOpen } = useAppStore();

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-30 bg-gray-900 border-r border-gray-800 transition-all duration-300 ${
        sidebarOpen ? 'w-60' : 'w-16'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {sidebarOpen && (
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Menu
            </span>
          )}
          <button
            onClick={() => useAppStore.getState().toggleSidebar()}
            className="p-1 rounded hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border-l-2 border-primary-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon size={20} />
              {sidebarOpen && (
                <>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="keyboard-shortcut text-[10px]">{item.shortcut}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Store size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">Papeleria Central</p>
                <p className="text-xs text-gray-400">Sucursal Principal</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
