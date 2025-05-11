'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastState extends ToastProps {
  id: string;
  visible: boolean;
}

export const toast = ({ 
  title, 
  description, 
  variant = 'default', 
  duration = 3000 
}: ToastProps) => {
  const id = Math.random().toString(36).substring(2, 9);
  
  // Adiciona o toast ao estado global
  const event = new CustomEvent('toast', { 
    detail: { id, title, description, variant, visible: true } 
  });
  
  window.dispatchEvent(event);
  
  // Configura o timeout para remover o toast
  setTimeout(() => {
    const removeEvent = new CustomEvent('toast-remove', { detail: { id } });
    window.dispatchEvent(removeEvent);
  }, duration);
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  
  useEffect(() => {
    const handleToast = (e: CustomEvent<ToastState>) => {
      setToasts(prev => [...prev, e.detail]);
    };
    
    const handleRemoveToast = (e: CustomEvent<{ id: string }>) => {
      setToasts(prev => 
        prev.map(toast => 
          toast.id === e.detail.id 
            ? { ...toast, visible: false } 
            : toast
        )
      );
      
      // Remover completamente após a animação
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== e.detail.id));
      }, 300);
    };
    
    window.addEventListener('toast', handleToast as EventListener);
    window.addEventListener('toast-remove', handleRemoveToast as EventListener);
    
    return () => {
      window.removeEventListener('toast', handleToast as EventListener);
      window.removeEventListener('toast-remove', handleRemoveToast as EventListener);
    };
  }, []);
  
  return (
    <div className="fixed bottom-0 right-0 p-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`
            transform transition-all duration-300 ease-in-out
            ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
            p-4 rounded-md shadow-lg max-w-md
            ${toast.variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200'}
          `}
        >
          {toast.title && (
            <h3 className={`font-semibold ${toast.variant === 'destructive' ? 'text-white' : 'text-gray-900'}`}>
              {toast.title}
            </h3>
          )}
          {toast.description && (
            <p className={`text-sm mt-1 ${toast.variant === 'destructive' ? 'text-white' : 'text-gray-700'}`}>
              {toast.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
