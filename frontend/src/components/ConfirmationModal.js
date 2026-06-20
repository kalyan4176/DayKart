import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'Do you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'success' | 'info'
}) {
  if (!isOpen) return null;

  const getThemeColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-rose-500" />,
          iconBg: 'bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30',
          btnConfirm: 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-500/20',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30',
          btnConfirm: 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500/20',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-6 h-6 text-secondary" />,
          iconBg: 'bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30',
          btnConfirm: 'bg-secondary hover:bg-cyan-600 focus:ring-cyan-500/20',
        };
    }
  };

  const theme = getThemeColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-xl transform scale-100 opacity-100 transition-all duration-300 animate-[fadeIn_0.2s_ease-out] space-y-4">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex gap-4">
          <div className={`p-3 rounded-2xl flex-shrink-0 ${theme.iconBg}`}>
            {theme.icon}
          </div>

          <div className="space-y-1.5 flex-1 pr-6">
            <h3 className="font-extrabold text-base text-black dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition focus:outline-none"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition focus:outline-none focus:ring-4 ${theme.btnConfirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
