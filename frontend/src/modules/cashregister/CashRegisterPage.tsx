import React, { useState } from 'react';
import { useCashRegister } from '../../hooks/useSales';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardStats } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Calculator, ArrowRight, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const CashRegisterPage: React.FC = () => {
  const { cashStatus, isLoading, openRegister, closeRegister } = useCashRegister();
  const { user } = useAuthStore();
  const [openingAmount, setOpeningAmount] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = async () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    setIsOpening(true);
    try {
      await openRegister({ openingAmount: amount });
      setOpeningAmount('');
      toast.success('Caja abierta correctamente');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al abrir caja');
    } finally {
      setIsOpening(false);
    }
  };

  const handleClose = async () => {
    try {
      await closeRegister();
      toast.success('Caja cerrada correctamente');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al cerrar caja');
    }
  };

  const isOpen = cashStatus?.status === 'open';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-white">Caja</h2><p className="text-gray-400 text-sm">Gestión de caja registradora</p></div>
        <Badge variant={isOpen ? 'success' : 'danger'} dot>{isOpen ? 'Caja Abierta' : 'Caja Cerrada'}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardStats title="Ingresos Hoy" value={cashStatus?.totalSales || 0} change="+15% ayer" changeType="up" icon={<TrendingUp size={20} />} />
        <CardStats title="Ventas" value={cashStatus?.totalSales || 0} icon={<Calculator size={20} />} />
        <CardStats title="Devoluciones" value={cashStatus?.totalReturns || 0} change="Hoy" changeType="down" icon={<ArrowRight size={20} />} />
        <CardStats title="Diferencia" value={cashStatus?.cashDifference || 0} change={cashStatus?.status === 'open' ? 'Abierta' : 'Cerrada'} changeType={(cashStatus?.cashDifference || 0) >= 0 ? 'up' : 'down'} icon={<Calculator size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isOpen ? (
          <Card>
            <CardHeader title="Abrir Caja" />
            <div className="space-y-4">
              <Input label="Monto de Apertura" type="number" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} placeholder="0.00" required />
              <p className="text-xs text-gray-500">Cajero: {user?.name}</p>
              <Button onClick={handleOpen} loading={isOpening} className="w-full">
                <Calculator size={16} className="mr-2" /> Abrir Caja
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Cerrar Caja" />
            <div className="space-y-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Monto de Apertura</span><span className="text-white">${cashStatus?.openingAmount?.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm mt-2"><span className="text-gray-400">Ventas Totales</span><span className="text-white">${cashStatus?.totalSales?.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm mt-2"><span className="text-gray-400">Devoluciones</span><span className="text-white">${cashStatus?.totalReturns?.toFixed(2)}</span></div>
              </div>
              <div className="flex justify-between text-sm bg-gray-800 rounded-lg p-3">
                <span className="text-gray-400">Diferencia</span>
                <span className={`font-bold ${(cashStatus?.cashDifference || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${cashStatus?.cashDifference?.toFixed(2)}
                </span>
              </div>
              <Button onClick={handleClose} className="w-full">
                <ArrowRight size={16} className="mr-2" /> Cerrar Caja
              </Button>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title="Movimientos de Caja" />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(cashStatus?.transactions || []).slice(0, 10).map((tx: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800">
                <div>
                  <p className="text-sm text-white">{tx.type?.toUpperCase()}</p>
                  <p className="text-xs text-gray-500">{tx.description}</p>
                </div>
                <span className={`text-sm font-medium ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${tx.amount?.toFixed(2)}
                </span>
              </div>
            ))}
            {(cashStatus?.transactions || []).length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin movimientos</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};
