import { useState, useCallback, useEffect, useRef } from 'react';
import { useCartStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { salesApi } from '../services/api';
import toast from 'react-hot-toast';
import type { Product, Sale } from '../types';

export function usePOS() {
  const { items, subtotal, tax, total, itemCount, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [change, setChange] = useState(0);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const subtotalValue = subtotal();
  const taxValue = tax();
  const totalValue = total();

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      useCartStore.getState().addItem(product, quantity);
      toast.success(`${product.name} agregado al carrito`);
    },
    []
  );

  const removeFromCart = useCallback((productId: string) => {
    useCartStore.getState().removeItem(productId);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    useCartStore.getState().updateQuantity(productId, quantity);
  }, []);

  const updateItemDiscount = useCallback((productId: string, discount: number) => {
    useCartStore.getState().updateDiscount(productId, discount);
  }, []);

  const calculateChange = useCallback((amount?: string) => {
    const paid = parseFloat(amount ?? cashAmount) || 0;
    const newChange = paid - totalValue;
    setChange(Math.max(0, newChange));
    return newChange;
  }, [cashAmount, totalValue]);

  const processSale = useCallback(async () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return false;
    }
    const paid = parseFloat(cashAmount) || 0;
    const currentChange = paid - totalValue;
    if (paymentMethod === 'cash' && totalValue > 0 && currentChange < 0) {
      toast.error('El monto en efectivo es insuficiente');
      return false;
    }

    setIsProcessing(true);
    try {
      const amountPaid = paymentMethod === 'cash' ? (parseFloat(cashAmount) || 0) : totalValue;      const saleData = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice) || 0,
          discount: Number(item.discount) || 0,
        })),
        amountPaid,
        paymentMethod: paymentMethod === 'cash' ? 'EFECTIVO' : paymentMethod === 'card' ? 'TARJETA' : 'TRANSFERENCIA',
        discount: Number(discount) || 0,
        cashRegisterId: null,
      };

      const { data } = await salesApi.create(saleData);
      setLastSale(data);
      clearCart();
      setCashAmount('');
      setDiscount(0);
      setNotes('');
      setChange(0);
      toast.success('Venta completada exitosamente');
      return true;
    } catch (error) {
      toast.error('Error al procesar la venta');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [items, paymentMethod, discount, notes, subtotalValue, taxValue, totalValue, cashAmount]);

  const openCashRegister = useCallback(async (openingAmount: number) => {
    const { data } = await salesApi.openCashRegister({ openingAmount });
    return data;
  }, []);

  const closeCashRegister = useCallback(async () => {
    const { data } = await salesApi.closeCashRegister();
    return data;
  }, []);

  const getCashStatus = useCallback(async () => {
    const { data } = await salesApi.getCashStatus();
    return data;
  }, []);

  const printReceipt = useCallback(() => {
    if (receiptRef.current) {
      window.print();
    }
  }, []);

  const clearCartCallback = useCallback(() => {
    clearCart();
  }, [clearCart]);

  return {
    items,
    subtotal: subtotalValue,
    tax: taxValue,
    total: totalValue,
    itemCount: itemCount(),
    isProcessing,
    cashAmount,
    setCashAmount,
    paymentMethod,
    setPaymentMethod,
    change,
    lastSale,
    discount,
    setDiscount,
    notes,
    setNotes,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemDiscount,
    calculateChange,
    processSale,
    openCashRegister,
    closeCashRegister,
    getCashStatus,
    printReceipt,
    receiptRef,
    clearCart: clearCartCallback,
  };
}

export function useKeyboardShortcuts() {
  const { searchQuery, setSearchQuery } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        if (e.key === 'Escape') target.blur();
        return;
      }

      switch (e.key) {
        case 'F2':
          e.preventDefault();
          setSearchQuery('');
          const searchInput = document.getElementById('pos-search');
          searchInput?.focus();
          break;
        case 'F4':
          e.preventDefault();
          const cartPanel = document.getElementById('cart-panel');
          if (cartPanel) {
            cartPanel.classList.toggle('hidden');
          }
          break;
        case 'F6':
          e.preventDefault();
          const cashPanel = document.getElementById('cash-panel');
          if (cashPanel) cashPanel.scrollIntoView({ behavior: 'smooth' });
          break;
        case 'Escape':
          const modal = document.querySelector('[data-modal]');
          if (modal) modal.remove();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, setSearchQuery]);
}
