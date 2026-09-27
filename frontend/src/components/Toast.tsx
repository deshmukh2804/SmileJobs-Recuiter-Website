import React from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#2C1B57] text-white px-5 py-3 rounded-xl shadow-2xl border border-white/10 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
      <CheckCircle2 className="w-4 h-4 text-[#7CE0B0] shrink-0" />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/50 hover:text-white p-0.5 rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
