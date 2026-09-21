import React from 'react';
import { useDashboard } from '../../hooks/useSales';
import { Card, CardHeader, CardStats } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ShoppingCart, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { stats, recentSales, lowStock } = useDashboard();

  const statsCards = [
    { title: 'Ventas Hoy', value: stats?.todaySales || 0, change: '+12% vs ayer', changeType: 'up' as const, icon: <DollarSign size={20} /> },
    { title: 'Transacciones', value: stats?.todayTransactions || 0, change: 'Hoy', changeType: 'up' as const, icon: <ShoppingCart size={20} /> },
    { title: 'Ingresos Totales', value: `$${stats?.totalRevenue || 0}`, change: 'Mensual', changeType: 'up' as const, icon: <TrendingUp size={20} /> },
    { title: 'Stock Bajo', value: lowStock?.length || 0, change: 'Productos', changeType: 'down' as const, icon: <AlertTriangle size={20} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 text-sm">Resumen de ventas e inventario</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <CardStats key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Ventas Recientes" action={<Button variant="outline" size="sm" onClick={() => navigate('/sales')}>Ver todas</Button>} />
            <div className="space-y-3">
              {(recentSales || []).slice(0, 5).map((sale: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center">
                      <ShoppingCart size={16} className="text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{sale.folio || sale.id}</p>
                      <p className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">${Number(sale.total || 0).toFixed(2)}</p>
                    <Badge variant="success">{sale.status}</Badge>
                  </div>
                </div>
              ))}
              {(!recentSales || recentSales.length === 0) && (
                <p className="text-center text-gray-500 py-8">No hay ventas recientes</p>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader title="Alertas de Stock" />
            <div className="space-y-2">
              {(lowStock || []).slice(0, 5).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-sm text-white">{item.name}</p>
                    <p className="text-xs text-red-400">{item.stock} restantes</p>
                  </div>
                  <Badge variant="warning" dot>{item.stock <= (item.stockMin || 1) ? 'Critico' : 'Bajo'}</Badge>
                </div>
              ))}
              {(!lowStock || lowStock.length === 0) && (
                <p className="text-center text-gray-500 py-4">Sin alertas</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
