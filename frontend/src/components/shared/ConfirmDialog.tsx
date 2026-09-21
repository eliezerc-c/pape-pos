import React, { useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {
  const [countdown, setCountdown] = useState(3);

  React.useEffect(() => {
    if (isOpen) {
      setCountdown(3);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 1;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const variantColors = {
    danger: 'border-red-500/50 bg-red-500/5',
    warning: 'border-amber-500/50 bg-amber-500/5',
    info: 'border-blue-500/50 bg-blue-500/5',
  };

  const variantIcons = {
    danger: <Trash2 size={24} className="text-red-400" />,
    warning: <AlertTriangle size={24} className="text-amber-400" />,
    info: <X size={24} className="text-blue-400" />,
  };

  const confirmBtnClasses = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={16} />
        </button>
        <div className={`p-6 ${variantColors[variant]}`}>
          <div className="flex items-start gap-4">
            <div className="mt-1 flex-shrink-0">{variantIcons[variant]}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-400 mt-2">{message}</p>
              {countdown > 0 && (
                <p className="text-xs text-gray-500 mt-2">Cerrando en {countdown} segundos...</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-gray-800">
          <button onClick={onClose} disabled={isLoading} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            disabled={isLoading || countdown > 0}
            className={`${confirmBtnClasses[variant]} text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
