// frontend/src/components/ui/useToast.tsx
// Toast hook using react-hot-toast

import { useCallback } from 'react';
import toast, { Toaster, ToastOptions } from 'react-hot-toast';

export function useToast() {
  const showToast = useCallback((message: string, options?: ToastOptions) => {
    return toast(message, options);
  }, []);

  const success = useCallback((message: string, options?: ToastOptions) => {
    return toast.success(message, options);
  }, []);

  const error = useCallback((message: string, options?: ToastOptions) => {
    return toast.error(message, options);
  }, []);

  const loading = useCallback((message: string, options?: ToastOptions) => {
    return toast.loading(message, options);
  }, []);

  const dismiss = useCallback((id?: string) => {
    toast.dismiss(id);
  }, []);

  return {
    toast: showToast,
    success,
    error,
    loading,
    dismiss,
  };
}

// Re-export Toaster for convenience
export { Toaster };