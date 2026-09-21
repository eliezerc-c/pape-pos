import React from 'react';
import { useProducts } from '../../hooks/useProducts';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Search } from '../../components/ui/Search';
import { Pagination } from '../../components/shared/Pagination';
import { Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export const InventoryPage: React.FC = () => {
  const { products, updateStock } = useProducts();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 15;

  const productList = Array.isArray(products) ? products : [];
  const lowStockProducts = productList.filter((p: any) => p.stock <= (p.stockMin || 1));
  const filtered = productList.filter((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleStockUpdate = async (productId: string, change: number) => {
    try {
      await updateStock({ id: productId, data: { quantity: change, reason: 'Ajuste de inventario' } });
      toast.success('Stock actualizado');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error');
    }
  };

  const columns = [
    { key: 'image', label: '' },
    { key: 'name', label: 'Producto' },
    { key: 'sku', label: 'SKU' },
    { key: 'salePrice', label: 'Precio' },
    { key: 'stock', label: 'Stock' },
    { key: 'stockMin', label: 'Minimo' },
    { key: 'status', label: 'Estado' },
    { key: 'actions', label: 'Acciones' },
  ];

  const renderRow = (product: any, index: number) => {
    const isLow = product.stock <= (product.stockMin || 1);
    return (
      <tr key={product.id || index} className={`hover:bg-gray-800/50 transition-colors ${isLow ? 'bg-red-900/10' : ''}`}>
        <td className="py-3 px-4">
          {product.imagePrimary ? (
            <img src={`/images/${product.imagePrimary.split('/').pop()}`} alt={product.name} className="w-8 h-8 rounded object-cover bg-gray-800" />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center">
              <Package size={14} className="text-gray-500" />
            </div>
          )}
        </td>
        <td className="py-3 px-4 text-sm font-medium text-white">{product.name}</td>
        <td className="py-3 px-4 text-sm text-gray-400">{product.sku}</td>
        <td className="py-3 px-4 text-sm text-white">${Number(product.salePrice || 0).toFixed(2)}</td>
        <td className="py-3 px-4">
          <span className={`text-sm font-medium ${isLow ? 'text-red-400' : 'text-white'}`}>{product.stock}</span>
        </td>
        <td className="py-3 px-4 text-sm text-gray-400">{product.stockMin || 1}</td>
        <td className="py-3 px-4"><Badge variant={isLow ? 'danger' : 'success'} dot>{isLow ? 'Critico' : 'OK'}</Badge></td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => handleStockUpdate(product.id, 1)}>+</Button>
            <Button variant="outline" size="sm" onClick={() => handleStockUpdate(product.id, -1)} disabled={product.stock <= 0}>-</Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Inventario</h2>
          <p className="text-gray-400 text-sm">{lowStockProducts.length} productos con stock bajo</p>
        </div>
        <div className="flex items-center gap-3">
          {lowStockProducts.length > 0 && (
            <Badge variant="danger" dot>{lowStockProducts.length} alertas</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Package size={20} className="text-blue-400" /></div>
            <div><p className="text-sm text-gray-400">Total SKUs</p><p className="text-xl font-bold text-white">{productList.length}</p></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangle size={20} className="text-red-400" /></div>
            <div><p className="text-sm text-gray-400">Stock Critico</p><p className="text-xl font-bold text-white">{lowStockProducts.length}</p></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg"><Package size={20} className="text-emerald-400" /></div>
            <div><p className="text-sm text-gray-400">Con Stock</p><p className="text-xl font-bold text-white">{productList.filter((p: any) => p.stock > 0).length}</p></div>
          </div>
        </Card>
      </div>

      <Search value={searchQuery} onChange={setSearchQuery} placeholder="Buscar en inventario..." className="w-64" />

      <Card padding="none">
        <Table headers={columns} data={paginated} renderRow={renderRow} loading={false} emptyMessage="No hay productos en inventario" />
        <div className="p-4 border-t border-gray-800">
          <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} onPageChange={setCurrentPage} />
        </div>
      </Card>
    </div>
  );
};
