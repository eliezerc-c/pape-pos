import React from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { useSettingsStore } from '../../stores/settingsStore';
import { Settings2, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { storeName, setStoreName, taxEnabled, setTaxEnabled, taxRate, setTaxRate, currency, setCurrency } = useSettingsStore();
  const [localStoreName, setLocalStoreName] = React.useState(storeName);
  const [localTaxRate, setLocalTaxRate] = React.useState(String(taxRate));
  const [localCurrency, setLocalCurrency] = React.useState(currency);
  const [printReceipt, setPrintReceipt] = React.useState(true);
  const [autoClose, setAutoClose] = React.useState(false);
  const [lowStockAlert, setLowStockAlert] = React.useState(5);

  const handleSave = () => {
    setStoreName(localStoreName);
    setTaxRate(Number(localTaxRate) || 0);
    setCurrency(localCurrency);
    toast.success('Configuracion guardada exitosamente');
  };

  const handleReset = () => {
    setTaxEnabled(false);
    setTaxRate(13);
    setCurrency('MXN');
    setStoreName('Papeleria Central');
    setLocalStoreName('Papeleria Central');
    setLocalTaxRate('13');
    setLocalCurrency('MXN');
    toast.info('Configuracion restaurada a valores predeterminados');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Configuracion</h2>
        <p className="text-gray-400 text-sm">Ajustes del sistema y preferencias</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Settings2 size={18} /> Configuracion General</h3>
          <div className="space-y-4">
            <Input label="Nombre del Almacen" value={localStoreName} onChange={(e) => setLocalStoreName(e.target.value)} />
            <Input label="RUC/Cedula" placeholder="000000000000" />
            <Input label="Direccion" placeholder="Direccion del local" />
            <Input label="Telefono" placeholder="+506 0000 0000" />
            <Input label="Email" placeholder="admin@papeleria.com" />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Settings2 size={18} /> Configuracion Fiscal</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-white">Habilitar Impuestos</p>
                <p className="text-xs text-gray-500">Aplicar impuestos a las ventas del POS</p>
              </div>
              <button onClick={() => setTaxEnabled(!taxEnabled)} className={`w-12 h-6 rounded-full transition-colors ${taxEnabled ? 'bg-primary-600' : 'bg-gray-700'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${taxEnabled ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
              </button>
            </div>
            {taxEnabled && (
              <Input label="Tasa de Impuesto (%)" type="number" value={localTaxRate} onChange={(e) => setLocalTaxRate(e.target.value)} />
            )}
            <Select label="Moneda" value={localCurrency} onChange={(e) => setLocalCurrency(e.target.value)} options={[{ value: 'MXN', label: 'MXN - Peso Mexicano' }, { value: 'USD', label: 'USD - Dolar' }, { value: 'CRC', label: 'CRC - Colon' }, { value: 'EUR', label: 'EUR - Euro' }]} />
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div><p className="text-sm text-white">Impresion automatica</p><p className="text-xs text-gray-500">Imprimir ticket al cerrar venta</p></div>
              <button onClick={() => setPrintReceipt(!printReceipt)} className={`w-12 h-6 rounded-full transition-colors ${printReceipt ? 'bg-primary-600' : 'bg-gray-700'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${printReceipt ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Settings2 size={18} /> Configuracion de Inventario</h3>
          <div className="space-y-4">
            <Input label="Alerta de Stock Bajo" type="number" value={lowStockAlert} onChange={(e) => setLowStockAlert(Number(e.target.value))} />
            <Select label="Metodo de Calculo de Stock" options={[{ value: 'FIFO', label: 'FIFO' }, { value: 'LIFO', label: 'LIFO' }, { value: 'Promedio', label: 'Promedio Ponderado' }]} />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Settings2 size={18} /> Seguridad</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div><p className="text-sm text-white">Cierre automatico de caja</p><p className="text-xs text-gray-500">Cerrar caja al finalizar jornada</p></div>
              <button onClick={() => setAutoClose(!autoClose)} className={`w-12 h-6 rounded-full transition-colors ${autoClose ? 'bg-primary-600' : 'bg-gray-700'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${autoClose ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div><p className="text-sm text-white">Confirmacion de devoluciones</p><p className="text-xs text-gray-500">Requerir confirmacion para devoluciones</p></div>
              <button className="w-12 h-6 rounded-full bg-primary-600"><div className="w-5 h-5 bg-white rounded-full translate-x-6 mt-0.5" /></button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div><p className="text-sm text-white">Registro de actividades</p><p className="text-xs text-gray-500">Auditar todas las transacciones</p></div>
              <button className="w-12 h-6 rounded-full bg-primary-600"><div className="w-5 h-5 bg-white rounded-full translate-x-6 mt-0.5" /></button>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={handleReset}><Trash2 size={16} className="mr-2" />Restaurar Valores</Button>
        <Button onClick={handleSave}><Save size={16} className="mr-2" />Guardar Configuracion</Button>
      </div>
    </div>
  );
};
