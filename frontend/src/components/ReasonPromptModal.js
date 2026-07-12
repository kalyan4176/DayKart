import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, X as XIcon } from 'lucide-react';

export default function ReasonPromptModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Provide Reason',
  message = 'Please enter the details below:',
  placeholder = 'Type details here...',
  confirmText = 'Submit',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'info'
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason to proceed.');
      return;
    }
    onConfirm(reason.trim());
    onClose();
  };

  const getColors = () => {
    if (type === 'danger') {
      return {
        iconBg: 'bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30',
        icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
        confirmBtn: 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-500/20',
      };
    }
    return {
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30',
      icon: <AlertCircle className="w-5 h-5 text-secondary" />,
      confirmBtn: 'bg-secondary hover:bg-cyan-600 focus:ring-cyan-500/20',
    };
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-xl transform scale-100 opacity-100 transition-all duration-300 animate-[fadeIn_0.2s_ease-out] space-y-4">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 p-1.5 rounded-xl transition"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {/* Header Block */}
        <div className="flex gap-3.5">
          <div className={`p-2.5 rounded-2xl flex-shrink-0 flex items-center justify-center ${colors.iconBg}`}>
            {colors.icon}
          </div>
          <div className="space-y-1 flex-1 pr-4 min-w-0">
            <h3 className="font-extrabold text-sm text-slate-855 dark:text-slate-100 leading-tight truncate">
              {title}
            </h3>
            <p className="text-xxs text-slate-455 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div>
            <textarea
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 focus:border-secondary px-3.5 py-3 rounded-2xl text-xs outline-none transition resize-none dark:text-slate-200"
              rows={3}
              placeholder={placeholder}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              required
              maxLength={200}
            />
            <div className="flex justify-between items-center mt-1 px-1">
              {error ? (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {error}
                </p>
              ) : (
                <span />
              )}
              <span className="text-[9px] text-slate-400 font-bold">{reason.length}/200</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition focus:outline-none"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition focus:outline-none focus:ring-4 disabled:opacity-50 ${colors.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
