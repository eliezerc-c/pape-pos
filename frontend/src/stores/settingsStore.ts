import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  taxEnabled: boolean;
  taxRate: number;
  currency: string;
  storeName: string;
  setTaxEnabled: (enabled: boolean) => void;
  setTaxRate: (rate: number) => void;
  setCurrency: (currency: string) => void;
  setStoreName: (name: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      taxEnabled: false,
      taxRate: 13,
      currency: 'MXN',
      storeName: 'Papelería Central',
      setTaxEnabled: (enabled) => set({ taxEnabled: enabled }),
      setTaxRate: (rate) => set({ taxRate: rate }),
      setCurrency: (currency) => set({ currency }),
      setStoreName: (name) => set({ storeName: name }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
