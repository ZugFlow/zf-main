import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected: Date | null;
  connectionErrors: number;
  retryAttempts: number;
}

interface UseSupabaseConnectionProps {
  maxRetryAttempts?: number;
  retryInterval?: number;
  onConnectionLost?: () => void;
  onConnectionRestored?: () => void;
}

export function useSupabaseConnection({
  maxRetryAttempts = 3,
  retryInterval = 5000,
  onConnectionLost,
  onConnectionRestored
}: UseSupabaseConnectionProps = {}) {
  const [state, setState] = useState<ConnectionState>({
    isConnected: true,
    isReconnecting: false,
    lastConnected: new Date(),
    connectionErrors: 0,
    retryAttempts: 0
  });

  const supabase = createClient();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionCheckRef = useRef<boolean>(false);

  // Test della connessione con una query leggera
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Usa una query molto semplice per testare la connessione
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (error) {
        // Alcuni errori non indicano problemi di connessione
        if (error.code === 'PGRST116' || error.message.includes('No rows')) {
          return true; // La connessione funziona, semplicemente non ci sono dati
        }
        console.error('🔍 [SupabaseConnection] Connection test failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('🔍 [SupabaseConnection] Connection test error:', error);
      return false;
    }
  }, [supabase]);

  // Gestione della riconnessione
  const attemptReconnection = useCallback(async () => {
    if (connectionCheckRef.current || state.retryAttempts >= maxRetryAttempts) {
      return;
    }

    connectionCheckRef.current = true;
    const newRetryAttempts = state.retryAttempts + 1;

    console.log(`🔄 [SupabaseConnection] Attempting reconnection ${newRetryAttempts}/${maxRetryAttempts}`);
    
    setState(prev => ({
      ...prev,
      isReconnecting: true,
      retryAttempts: newRetryAttempts
    }));

    const isConnected = await testConnection();

    if (isConnected) {
      console.log('✅ [SupabaseConnection] Connection restored');
      setState(prev => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        lastConnected: new Date(),
        connectionErrors: 0,
        retryAttempts: 0
      }));
      onConnectionRestored?.();
    } else {
      console.warn(`❌ [SupabaseConnection] Reconnection attempt ${newRetryAttempts} failed`);
      setState(prev => ({
        ...prev,
        isReconnecting: false,
        connectionErrors: prev.connectionErrors + 1
      }));

      if (newRetryAttempts < maxRetryAttempts) {
        // Exponential backoff
        const delay = retryInterval * Math.pow(2, newRetryAttempts - 1);
        retryTimeoutRef.current = setTimeout(() => {
          connectionCheckRef.current = false;
          attemptReconnection();
        }, delay);
      } else {
        console.error('❌ [SupabaseConnection] Max retry attempts reached');
        onConnectionLost?.();
      }
    }

    connectionCheckRef.current = false;
  }, [state.retryAttempts, maxRetryAttempts, retryInterval, testConnection, onConnectionLost, onConnectionRestored]);

  // Controllo periodico della connessione
  useEffect(() => {
    const checkInterval = setInterval(async () => {
      if (!connectionCheckRef.current && state.isConnected) {
        const isConnected = await testConnection();
        
        if (!isConnected && state.isConnected) {
          console.warn('⚠️ [SupabaseConnection] Connection lost detected');
          setState(prev => ({
            ...prev,
            isConnected: false,
            retryAttempts: 0
          }));
          attemptReconnection();
        }
      }
    }, 30000); // Controlla ogni 30 secondi

    return () => clearInterval(checkInterval);
  }, [state.isConnected, testConnection, attemptReconnection]);

  // Gestione eventi di rete
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [SupabaseConnection] Network back online');
      if (!state.isConnected) {
        setState(prev => ({ ...prev, retryAttempts: 0 }));
        attemptReconnection();
      }
    };

    const handleOffline = () => {
      console.log('🌐 [SupabaseConnection] Network went offline');
      setState(prev => ({
        ...prev,
        isConnected: false,
        isReconnecting: false
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.isConnected, attemptReconnection]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Test iniziale della connessione
  useEffect(() => {
    testConnection().then(isConnected => {
      if (!isConnected) {
        setState(prev => ({ ...prev, isConnected: false }));
        attemptReconnection();
      }
    });
  }, [testConnection, attemptReconnection]);

  const forceReconnect = useCallback(() => {
    setState(prev => ({ ...prev, retryAttempts: 0 }));
    attemptReconnection();
  }, [attemptReconnection]);

  return {
    ...state,
    testConnection,
    forceReconnect
  };
}
