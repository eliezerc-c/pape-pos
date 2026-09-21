import React from 'react';
import { useSales } from '../../hooks/useSales';
import { Table } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Search } from '../../components/ui/Search';
import { Pagination } from '../../components/shared/Pagination';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Receipt, RotateCcw, Eye, X, Package } from 'lucide-react';
import { format } from 'date-fns';

export const SalesPage: React.FC = () => {
  const { sales, isLoading } = useSales();
  const [showReturnDialog, setShowReturnDialog] = React.useState(false);
  const [saleToReturn, setSaleToReturn] = React.useState<string>('');
  const [selectedSale, setSelectedSale] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 15;

  const filtered = sales.filter((s: any) =>
    s.folio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.saleItems?.some((item: any) => item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const columns = [
    { key: 'folio', label: 'Folio' },
    { key: 'date', label: 'Fecha' },
    { key: 'total', label: 'Total' },
    { key: 'paymentMethod', label: 'Metodo' },
    { key: 'status', label: 'Estado' },
    { key: 'actions', label: '' },
  ];

  const renderRow = (sale: any, index: number) => (
    <tr key={sale.id || index} className="hover:bg-gray-800/50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-white">{sale.folio}</td>
      <td className="py-3 px-4 text-sm text-gray-400">{format(new Date(sale.date || sale.createdAt), 'dd/MM/yyyy HH:mm')}</td>
      <td className="py-3 px-4 text-sm text-white font-medium">${Number(sale.total || 0).toFixed(2)}</td>
      <td className="py-3 px-4 text-sm text-gray-400 capitalize">{sale.paymentMethod}</td>
      <td className="py-3 px-4"><Badge variant={sale.status === 'COMPLETED' ? 'success' : sale.status === 'CANCELLED' ? 'danger' : 'warning'} dot>{sale.status}</Badge></td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <button onClick={() => setSelectedSale(sale)} className="p-1.5 hover:bg-blue-900/30 rounded" title="Ver detalle">
            <Eye size={14} className="text-blue-400" />
          </button>
          <button onClick={() => { setSaleToReturn(sale.id); setShowReturnDialog(true); }} className="p-1.5 hover:bg-amber-900/30 rounded" title="Devolver">
            <RotateCcw size={14} className="text-amber-400" />
          </button>
          <button className="p-1.5 hover:bg-gray-800 rounded" title="Imprimir">
            <Receipt size={14} className="text-gray-400" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-white">Ventas</h2><p className="text-gray-400 text-sm">Historial de transacciones</p></div>
        <Search value={searchQuery} onChange={setSearchQuery} placeholder="Buscar ventas..." className="w-64" />
      </div>
      <Card padding="none">
        <Table headers={columns} data={paginated} renderRow={renderRow} loading={isLoading} emptyMessage="No hay ventas registradas" />
        <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} onPageChange={setCurrentPage} />
      </Card>

      {/* Modal detalle de venta */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedSale(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-white">Detalle de Venta</h3>
                <p className="text-sm text-gray-400">{selectedSale.folio} &mdash; {format(new Date(selectedSale.date || selectedSale.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[55vh] space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400">Metodo de pago</p>
                  <p className="text-white font-medium capitalize">{selectedSale.paymentMethod}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400">Estado</p>
                  <Badge variant={selectedSale.status === 'COMPLETED' ? 'success' : 'danger'} dot>{selectedSale.status}</Badge>
                </div>
              </div>

              {/* Productos */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Productos vendidos</h4>
                <div className="space-y-2">
                  {selectedSale.saleItems?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-800/40 rounded-lg p-3">
                      {item.product?.imagePrimary ? (
                        <img src={`/images/${item.product.imagePrimary.split('/').pop()}`} alt={item.product?.name} className="w-10 h-10 rounded-lg object-cover bg-gray-700 mr-3 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center mr-3 shrink-0">
                          <Package size={14} className="text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.product?.name || 'Producto'}</p>
                        <p className="text-xs text-gray-500">{item.product?.sku} &middot; Cant: {item.quantity}</p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="text-sm font-medium text-white">${Number(item.unitPrice || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Subtotal: ${Number(item.subtotal || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Totales */}
            <div className="border-t border-gray-700 p-5 space-y-1 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>${Number(selectedSale.subtotal || 0).toFixed(2)}</span>
              </div>
              {Number(selectedSale.discount || 0) > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Descuento</span>
                  <span className="text-red-400">-${Number(selectedSale.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-base pt-1">
                <span>Total</span>
                <span>${Number(selectedSale.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Pagado</span>
                <span>${Number(selectedSale.amountPaid || 0).toFixed(2)}</span>
              </div>
              {Number(selectedSale.change || 0) > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Cambio</span>
                  <span>${Number(selectedSale.change).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 p-4 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedSale(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showReturnDialog}
        onClose={() => setShowReturnDialog(false)}
        onConfirm={() => setShowReturnDialog(false)}
        title="Devolver Producto"
        message="¿Deseas procesar la devolución de esta venta? Los productos se reingresarán al inventario."
        confirmLabel="Procesar Devolución"
        variant="warning"
      />
    </div>
  );
};
