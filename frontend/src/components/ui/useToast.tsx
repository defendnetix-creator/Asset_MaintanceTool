// frontend/src/components/ui/useToast.tsx
// Toast hook - re-exports react-hot-toast's toast with all methods properly typed

import { useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface ToastMethods {
  success: (message: string, options?: any) => string;
  error: (message: string, options?: any) => string;
  warning: (message: string, options?: any) => string;
  info: (message: string, options?: any) => string;
  loading: (message: string, options?: any) => string;
  dismiss: (id?: string) => void;
}

interface ToastReturnType extends ToastMethods {
  (message: string, options?: any): string;
  toast: (message: string, options?: any) => string;
}

export function useToast(): ToastReturnType {
  const success = useCallback((message: string, options?: any) => {
    return toast.success(message, options);
  }, []);

  const error = useCallback((message: string, options?: any) => {
    return toast.error(message, options);
  }, []);

  const warning = useCallback((message: string, options?: any) => {
    return toast(message, { ...options, icon: '⚠️' });
  }, []);

  const info = useCallback((message: string, options?: any) => {
    return toast(message, { ...options, icon: 'ℹ️' });
  }, []);

  const loading = useCallback((message: string, options?: any) => {
    return toast.loading(message, options);
  }, []);

  const dismiss = useCallback((id?: string) => {
    toast.dismiss(id);
  }, []);

  const baseToast = useCallback((message: string, options?: any) => {
    return toast(message, options);
  }, []);

  // Create the return object with all methods
  const returnObj = {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    toast: baseToast,
  };

  // Make it callable by assigning to the baseToast function
  const toastFn = Object.assign(baseToast, returnObj);

  return toastFn;
}

// Re-export Toaster for convenience
export { Toaster };