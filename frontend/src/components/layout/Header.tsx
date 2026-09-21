import React from 'react';
import { Menu, ShoppingCart, Bell, Search, Settings, LogOut, User } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../ui/Badge';
import { useKeyboardShortcuts } from '../../hooks/usePOS';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { toggleSidebar, searchQuery, setSearchQuery, notifications } = useAppStore();
  const { user, logout } = useAuthStore();

  useKeyboardShortcuts();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      // logout handles cleanup
    }
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <Menu size={20} className="text-gray-400" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="text-lg font-semibold text-white hidden md:block">
            {title || 'Papelería POS'}
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-4 hidden lg:block">
        <div className="relative" id="pos-search">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos... (F2)"
            className="input-field pl-9 pr-9 w-full"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 keyboard-shortcut">F2</kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-gray-400">{user?.name || 'Usuario'}</span>
          <Badge variant={user?.role === 'admin' ? 'danger' : 'info'} dot>
            {user?.role}
          </Badge>
        </div>

        <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <Bell size={20} className="text-gray-400" />
          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 relative">
          <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <ShoppingCart size={20} className="text-gray-400" />
          </button>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-800 transition-colors" title="Cerrar sesión">
            <LogOut size={20} className="text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
