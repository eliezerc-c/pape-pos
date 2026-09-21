import React, { useState, useRef, useEffect } from 'react';
import { usePOS } from '../../hooks/usePOS';
import { useProducts } from '../../hooks/useProducts';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Search } from '../../components/ui/Search';
import { PrintTicket } from '../../components/shared/PrintTicket';
import { useKeyboardShortcuts } from '../../hooks/usePOS';
import { ShoppingCart, Tag, Calculator, Trash2, Plus, Minus, Receipt, ArrowRight, Package } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const POSPage: React.FC = () => {
  useKeyboardShortcuts();
  const { items, subtotal, tax, total, itemCount, cashAmount, setCashAmount, paymentMethod, setPaymentMethod, change, discount, setDiscount, notes, setNotes, addToCart, removeFromCart, updateQuantity, calculateChange, processSale, isProcessing, clearCart, receiptRef } = usePOS();
  const { products, isLoading } = useProducts();
  const { user } = useAuthStore();
  const { taxEnabled, taxRate } = useSettingsStore();
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter((p: any) =>
    p.name?.toLowerCase().includes(productSearchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [productSearchQuery]);

  useEffect(() => {
    if (showProductSearch && listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, showProductSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showProductSearch || filteredProducts.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleAddProduct(filteredProducts[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowProductSearch(false);
    }
  };

  const handleAddProduct = (product: any) => {
    addToCart(product, 1);
    setShowProductSearch(false);
    setProductSearchQuery('');
    quantityInputRef.current?.focus();
  };

  const handleQuickAmount = (amount: number) => {
    setCashAmount(String(amount));
    calculateChange(String(amount));
  };

  const handleProcessSale = async () => {
    const success = await processSale();
    if (success) {
      // Print will be available via button
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex gap-4">
      {/* Product Search Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Punto de Venta</h2>
            <p className="text-gray-400 text-sm">{items.length} artículos | Total: ${total.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">{user?.name}</Badge>
            <button onClick={clearCart} className="p-2 hover:bg-red-900/30 rounded-lg transition-colors">
              <Trash2 size={18} className="text-red-400" />
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Search
              id="pos-search"
              ref={searchInputRef}
              value={productSearchQuery}
              onChange={(v) => { setProductSearchQuery(v); setShowProductSearch(true); }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar producto (F2)..."
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Descuento:</span>
            <Input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-24"
              step="0.01"
            />
          </div>
        </div>

        {showProductSearch && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto" ref={listRef}>
            <div className="grid grid-cols-2 gap-2">
              {filteredProducts.slice(0, 20).map((product: any, idx: number) => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                    idx === selectedIndex ? 'bg-primary-600/30 ring-1 ring-primary-500' : 'hover:bg-gray-800'
                  }`}
                >
                  {product.imagePrimary ? (
                    <img src={`/images/${product.imagePrimary.split('/').pop()}`} alt={product.name} className="w-10 h-10 rounded object-cover bg-gray-700 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku} | ${Number(product.salePrice || 0).toFixed(2)}</p>
                  </div>
                  <Badge variant={product.stock > 0 ? 'success' : 'danger'} dot>{product.stock}</Badge>
                </button>
              ))}
              {filteredProducts.length === 0 && <p className="text-gray-500 text-sm col-span-2 py-4">Sin resultados</p>}
            </div>
            {filteredProducts.length > 0 && (
              <p className="text-xs text-gray-600 text-center mt-2">↑↓ navegar &middot; Enter seleccionar &middot; Esc cerrar</p>
            )}
          </div>
        )}

        {/* Cart */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-64 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="text-center">
                <ShoppingCart size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-500">El carrito está vacío</p>
                <p className="text-sm text-gray-600 mt-1">Busca un producto para comenzar</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item: any, index: number) => (
                <div key={item.product.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-3">
                  {item.product.imagePrimary ? (
                    <img src={`/images/${item.product.imagePrimary.split('/').pop()}`} alt={item.product.name} className="w-10 h-10 rounded object-cover bg-gray-700 mr-3 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center mr-3 shrink-0">
                      <Package size={14} className="text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">${item.unitPrice?.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 hover:bg-gray-800 rounded"><Minus size={14} className="text-gray-400" /></button>
                    <span className="text-sm text-white w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 hover:bg-gray-800 rounded"><Plus size={14} className="text-gray-400" /></button>
                    <span className="text-sm font-medium text-white w-20 text-right">${(item.unitPrice * item.quantity - item.discount).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.product.id)} className="p-1 hover:bg-red-900/30 rounded"><Trash2 size={14} className="text-red-400" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Panel */}
      <div className="w-80 flex flex-col gap-4 overflow-y-auto">
        <Card>
          <h3 className="font-semibold text-white mb-3">Resumen de Compra</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {taxEnabled && (
              <div className="flex justify-between text-gray-400"><span>Impuesto ({taxRate}%)</span><span>${tax.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-gray-400"><span>Descuento</span><span>-${discount.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>Notas</span><span>{notes ? 'Si' : 'No'}</span></div>
            <div className="border-t border-gray-800 pt-2 flex justify-between font-bold text-white"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
        </Card>

        <div id="cash-panel"><Card>
          <h3 className="font-semibold text-white mb-3">Método de Pago</h3>
          <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
        </Card></div>

        {paymentMethod === 'cash' && (
          <Card>
            <h3 className="font-semibold text-white mb-3">Monto Recibido (F6)</h3>
            <Input
              type="number"
              value={cashAmount}
              onChange={(e) => { setCashAmount(e.target.value); calculateChange(e.target.value); }}
              placeholder="0.00"
              className="text-lg font-mono text-center"
            />
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-gray-400">Cambio:</span>
              <span className="text-emerald-400 font-bold">${change.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[10, 20, 50].map((amt) => (
                <button key={amt} onClick={() => handleQuickAmount(amt)} className="btn-secondary text-xs">${amt}</button>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)"
            className="input-field w-full min-h-[60px] resize-y text-sm"
          />
        </Card>

        <Button
          size="lg"
          onClick={handleProcessSale}
          loading={isProcessing}
          disabled={items.length === 0}
          className="w-full text-base"
        >
          <Receipt size={20} className="mr-2" />
          {paymentMethod === 'cash' ? `Cobrar $${total.toFixed(2)}` : `Procesar $${total.toFixed(2)}`}
        </Button>

        <div className="text-center text-xs text-gray-600">
          <p>F2: Buscar | F4: Carrito | F6: Efectivo | ESC: Cancelar</p>
        </div>

        <PrintTicket />
      </div>
    </div>
  );
};

const PaymentMethodSelector: React.FC<{
  paymentMethod: string;
  setPaymentMethod: (m: 'cash' | 'card' | 'transfer') => void;
}> = ({ paymentMethod, setPaymentMethod }) => {
  const [open, setOpen] = useState(false);
  const label = paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia';

  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between bg-primary-600 text-white"
      >
        <span>{label}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="space-y-1 bg-gray-800/30 rounded-lg p-1">
          {(['cash', 'card', 'transfer'] as const).map((method) => (
            <button
              key={method}
              onClick={() => { setPaymentMethod(method); setOpen(false); }}
              className={`w-full py-1.5 px-3 rounded-md text-sm transition-colors text-left ${
                paymentMethod === method
                  ? 'bg-primary-600/30 text-primary-300'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              {method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : 'Transferencia'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
