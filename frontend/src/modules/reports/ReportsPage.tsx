import React, { useState } from 'react';
import { useSales } from '../../hooks/useSales';
import { Card, CardHeader, CardStats } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BarChart3, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const ReportsPage: React.FC = () => {
  const { sales } = useSales();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportType, setReportType] = useState('sales');

  const totalSales = sales.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);

  const handleExport = (fmt: string) => {
    toast.success(`Exportando reporte en formato ${fmt.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-white">Reportes</h2><p className="text-gray-400 text-sm">Genera reportes de ventas e inventario</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardStats title="Ingresos Totales" value={`$${totalSales.toFixed(2)}`} change="Del periodo" changeType="up" icon={<BarChart3 size={20} />} />
        <CardStats title="Total de Ventas" value={sales.length} change="Registradas" changeType="up" icon={<Download size={20} />} />
        <CardStats title="Ticket Promedio" value={sales.length ? `$${(totalSales / sales.length).toFixed(2)}` : '$0'} change="Precio promedio" changeType="up" icon={<BarChart3 size={20} />} />
        <CardStats title="Productos" value={12} change="En catalogo" changeType="up" icon={<Download size={20} />} />
      </div>

      <Card>
        <CardHeader title="Generar Reporte" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Tipo de Reporte</label>
            <select className="input-field w-full" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="sales">Ventas</option>
              <option value="inventory">Inventario</option>
              <option value="financial">Financiero</option>
              <option value="products">Productos</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Fecha Desde</label>
            <input type="date" className="input-field w-full" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Fecha Hasta</label>
            <input type="date" className="input-field w-full" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={() => handleExport('pdf')} className="flex-1"><Download size={16} className="mr-2" />PDF</Button>
            <Button variant="secondary" onClick={() => handleExport('xlsx')} className="flex-1"><Download size={16} className="mr-2" />Excel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
