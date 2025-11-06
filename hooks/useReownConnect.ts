'use client';

import { useReownContext } from '@/contexts/ReownProvider';

/**
 * Hook simplificado que usa el contexto de Reown
 * Mantiene la misma interfaz para compatibilidad con componentes existentes
 */
export function useReownConnect() {
  const context = useReownContext();
  
  return {
    connect: context.connect,
    disconnect: context.disconnect,
    callNativeMethod: context.callNativeMethod,
    isConnected: context.isConnected,
    account: context.account,
    loading: context.loading,
  };
}
