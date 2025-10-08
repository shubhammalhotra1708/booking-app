'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      createdAt: Date.now()
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const { id, message, type } = toast;

  const getToastStyles = () => {
    const baseStyles = "flex items-center p-4 rounded-lg shadow-lg backdrop-blur-sm border min-w-72 max-w-96";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
    }
  };

  const getIcon = () => {
    const iconProps = { className: "w-5 h-5 mr-3 flex-shrink-0" };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 mr-3 flex-shrink-0 text-green-600" />;
      case 'error':
        return <XCircle {...iconProps} className="w-5 h-5 mr-3 flex-shrink-0 text-red-600" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="w-5 h-5 mr-3 flex-shrink-0 text-yellow-600" />;
      case 'info':
      default:
        return <Info {...iconProps} className="w-5 h-5 mr-3 flex-shrink-0 text-blue-600" />;
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <div className="flex-grow">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}