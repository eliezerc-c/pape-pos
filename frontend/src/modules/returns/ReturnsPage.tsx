import React from 'react';
import { useSales } from '../../hooks/useSales';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Search } from '../../components/ui/Search';
import { Pagination } from '../../components/shared/Pagination';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { RotateCcw, Filter } from 'lucide-react';
import { format } from 'date-fns';

export const ReturnsPage: React.FC = () => {
  const { sales } = useSales();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);

  const returns = sales.filter((s: any) => s.status === 'returned').map((s: any, i: number) => ({
    ...s,
    id: s.id || `ret-${i}`,
    reason: 'Cambio de producto',
    status: 'pending',
  }));

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'saleId', label: 'Venta Original' },
    { key: 'reason', label: 'Motivo' },
    { key: 'total', label: 'Monto' },
    { key: 'status', label: 'Estado' },
    { key: 'createdAt', label: 'Fecha' },
  ];

  const renderRow = (item: any, index: number) => (
    <tr key={item.id || index} className="hover:bg-gray-800/50 transition-colors">
      <td className="py-3 px-4 text-sm text-white">{item.id}</td>
      <td className="py-3 px-4 text-sm text-gray-400">{item.saleId}</td>
      <td className="py-3 px-4 text-sm text-gray-400">{item.reason}</td>
      <td className="py-3 px-4 text-sm text-white">${item.total?.toFixed(2)}</td>
      <td className="py-3 px-4"><Badge variant={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'} dot>{item.status}</Badge></td>
      <td className="py-3 px-4 text-sm text-gray-400">{format(new Date(item.createdAt), 'dd/MM/yyyy')}</td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-white">Devoluciones</h2><p className="text-gray-400 text-sm">Gestión de devoluciones de productos</p></div>
        <Search value={searchQuery} onChange={setSearchQuery} placeholder="Buscar devoluciones..." className="w-64" />
      </div>
      <Card padding="none">
        <Table headers={columns} data={returns} renderRow={renderRow} emptyMessage="No hay devoluciones registradas" />
      </Card>
    </div>
  );
};
