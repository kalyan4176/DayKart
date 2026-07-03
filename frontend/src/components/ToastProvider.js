'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info', id }
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleClose = () => {
    setToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted && toast && createPortal(
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3.5 px-4.5 py-3 rounded-2xl shadow-2xl border pointer-events-auto w-auto max-w-[90vw] sm:max-w-md animate-toast-slide-in bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
          {toast.type === 'success' && (
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center flex-shrink-0 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
          {toast.type === 'error' && (
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 border border-red-100 dark:border-red-900/40 flex items-center justify-center flex-shrink-0 shadow-sm">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          {toast.type === 'info' && (
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 border border-cyan-100 dark:border-cyan-900/40 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Info className="w-5 h-5" />
            </div>
          )}
          
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notification'}
            </p>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
              {toast.message}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex-shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
