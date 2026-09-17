import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      id="toast-notification"
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#081f3d] border border-cyan-400/70 text-white text-sm font-medium shadow-[0_10px_35px_rgba(0,210,255,0.25)] transition-all animate-bounce"
    >
      {message}
    </div>
  );
};
