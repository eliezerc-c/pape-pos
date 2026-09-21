import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAppStore } from '../../stores/appStore';

export const Layout: React.FC = () => {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-950">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden ${sidebarOpen ? 'lg:ml-0' : ''}`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
