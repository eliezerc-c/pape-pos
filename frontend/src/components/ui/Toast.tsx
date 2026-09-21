import React from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onDismiss?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const bgColors = {
    success: 'bg-emerald-900/90 border-emerald-500/50',
    error: 'bg-red-900/90 border-red-500/50',
    warning: 'bg-amber-900/90 border-amber-500/50',
    info: 'bg-blue-900/90 border-blue-500/50',
  };

  const iconColors = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`${bgColors[type]} border rounded-lg p-4 shadow-xl animate-slide-in flex items-center gap-3 min-w-[300px]`}>
      <span className={`text-lg ${iconColors[type]}`}>{icons[type]}</span>
      <span className="text-sm text-white flex-1">{message}</span>
      <button onClick={() => onDismiss?.()} className="text-gray-400 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

export const ToasterContainer: React.FC = () => {
  return null;
};
