import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Table } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search } from '../../components/ui/Search';
import { userApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.list().then((res) => res.data),
  });

  const rawUsers = data?.data;
  const users = Array.isArray(rawUsers) ? rawUsers : rawUsers?.users || [];
  const filtered = users.filter((u: any) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'username', label: 'Usuario' },
    { key: 'role', label: 'Rol' },
    { key: 'status', label: 'Estado' },
    { key: 'actions', label: '' },
  ];

  const renderRow = (u: any, index: number) => (
    <tr key={u.id || index} className="hover:bg-gray-800/50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-white">{u.name}</td>
      <td className="py-3 px-4 text-sm text-gray-400">{u.username}</td>
      <td className="py-3 px-4"><Badge variant={u.role?.name === 'ADMIN' ? 'danger' : 'info'}>{u.role?.name || u.role}</Badge></td>
      <td className="py-3 px-4"><Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'} dot>{u.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</Badge></td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-gray-800 rounded"><Edit2 size={14} className="text-gray-400" /></button>
          <button className="p-1.5 hover:bg-red-900/30 rounded"><Trash2 size={14} className="text-red-400" /></button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-white">Usuarios</h2><p className="text-gray-400 text-sm">Gestión de usuarios y permisos</p></div>
        <div className="flex items-center gap-3">
          <Search value={searchQuery} onChange={setSearchQuery} placeholder="Buscar usuarios..." className="w-64" />
          <Button><UserPlus size={16} className="mr-2" />Nuevo Usuario</Button>
        </div>
      </div>
      <Card padding="none">
        <Table headers={columns} data={filtered} renderRow={renderRow} emptyMessage="No hay usuarios registrados" />
      </Card>
    </div>
  );
};
