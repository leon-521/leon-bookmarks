'use client';

import * as React from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const variantConfig = {
  success: {
    icon: CheckCircle2,
    className: 'border-l-success',
    iconClassName: 'text-success',
  },
  error: {
    icon: AlertCircle,
    className: 'border-l-danger',
    iconClassName: 'text-danger',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-l-warning',
    iconClassName: 'text-warning',
  },
  info: {
    icon: Info,
    className: 'border-l-accent',
    iconClassName: 'text-accent',
  },
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = React.useState(false);
  const duration = toast.duration || 5000;
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  return (
    <div
      className={cn(
        'relative flex w-80 items-start gap-3 overflow-hidden rounded-lg border border-border bg-bg-primary p-4 shadow-lg',
        'border-l-4',
        config.className,
        isExiting ? 'animate-toast-out' : 'animate-toast-in'
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClassName)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs text-text-secondary">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="shrink-0 rounded-md p-0.5 text-text-tertiary transition-colors hover:text-text-primary hover:bg-bg-secondary"
      >
        <X className="h-4 w-4" />
      </button>
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20"
        style={{
          animation: `shrinkWidth ${duration}ms linear forwards`,
        }}
      />
      <style jsx>{`
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
