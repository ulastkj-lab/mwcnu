import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  successToast: (message: string, duration?: number) => void;
  errorToast: (message: string, duration?: number) => void;
  infoToast: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, message, type, duration };
      
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const successToast = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const errorToast = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const infoToast = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, successToast, errorToast, infoToast }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed top-6 right-6 z-[99999] flex flex-col gap-3 w-full max-w-[380px] pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => {
            let icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
            let bgClass = 'bg-white border-emerald-100 text-slate-800 shadow-emerald-50';
            let progressBg = 'bg-emerald-500';

            if (toast.type === 'error') {
              icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
              bgClass = 'bg-white border-rose-100 text-slate-800 shadow-rose-50';
              progressBg = 'bg-rose-500';
            } else if (toast.type === 'info') {
              icon = <Info className="w-5 h-5 text-blue-600 shrink-0" />;
              bgClass = 'bg-white border-blue-100 text-slate-800 shadow-blue-50';
              progressBg = 'bg-blue-500';
            }

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className={`pointer-events-auto w-full border rounded-2xl p-4 flex items-start gap-3.5 shadow-xl relative overflow-hidden backdrop-blur-sm ${bgClass}`}
              >
                {/* Visual Accent/Indicator */}
                <div className="pt-0.5">{icon}</div>

                {/* Content */}
                <div className="flex-1 space-y-0.5">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-sans">
                    {toast.type === 'success' ? 'Berhasil' : toast.type === 'error' ? 'Kesalahan' : 'Informasi'}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                    {toast.message}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Animated progress bar indicating life of the toast */}
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-[3px] ${progressBg}`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
