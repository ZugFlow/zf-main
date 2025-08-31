import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface UseSupabaseQueryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useSupabaseQuery<T = any>(options: UseSupabaseQueryOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000, onError } = options;
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: false,
    error: null
  });
  const retryCountRef = useRef(0);

  const executeQuery = useCallback(async (
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: any }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await queryFn();
      
      if (result.error) {
        // Check if it's a session/auth error
        if (result.error.message?.includes('JWT') || 
            result.error.message?.includes('expired') || 
            result.error.message?.includes('session')) {
          
          console.warn('🔄 [useSupabaseQuery] Session error detected, attempting refresh');
          
          // Try to refresh session
          const supabase = createClient();
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshData.session && !refreshError) {
            console.log('✅ [useSupabaseQuery] Session refreshed, retrying query');
            // Retry the query with fresh session
            const retryResult = await queryFn();
            if (!retryResult.error) {
              setState({ data: retryResult.data, loading: false, error: null });
              retryCountRef.current = 0;
              return retryResult;
            }
          }
        }
        
        // Handle retry logic for other errors
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.warn(`⚠️ [useSupabaseQuery] Query failed, retry ${retryCountRef.current}/${maxRetries}`);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCountRef.current));
          return executeQuery(queryFn);
        }
        
        // Max retries reached
        const error = new Error(result.error.message || 'Query failed');
        setState({ data: null, loading: false, error });
        onError?.(error);
        retryCountRef.current = 0;
        return result;
      }
      
      // Success
      setState({ data: result.data, loading: false, error: null });
      retryCountRef.current = 0;
      return result;
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: err });
      onError?.(err);
      retryCountRef.current = 0;
      return { data: null, error: err };
    }
  }, [maxRetries, retryDelay, onError]);

  const query = useCallback(async (queryFn: () => Promise<{ data: T | null; error: any }>) => {
    return executeQuery(queryFn);
  }, [executeQuery]);

  return {
    ...state,
    query,
    isRetrying: retryCountRef.current > 0
  };
}

// Hook semplificato per query con gestione automatica degli errori di sessione
export function useSupabaseWithRetry() {
  const [loading, setLoading] = useState(false);
  const retryCountRef = useRef(0);

  const executeWithRetry = useCallback(async (
    queryFn: () => Promise<any>,
    maxRetries = 3,
    retryDelay = 1000
  ) => {
    setLoading(true);
    
    try {
      const result = await queryFn();
      
      if (result.error) {
        // Check if it's a session/auth error
        if (result.error.message?.includes('JWT') || 
            result.error.message?.includes('expired') || 
            result.error.message?.includes('session')) {
          
          console.warn('🔄 [useSupabaseWithRetry] Session error detected, attempting refresh');
          
          // Try to refresh session
          const supabase = createClient();
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshData.session && !refreshError) {
            console.log('✅ [useSupabaseWithRetry] Session refreshed, retrying query');
            // Retry the query with fresh session
            const retryResult = await queryFn();
            setLoading(false);
            retryCountRef.current = 0;
            return retryResult;
          }
        }
        
        // Handle retry logic for other errors
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.warn(`⚠️ [useSupabaseWithRetry] Query failed, retry ${retryCountRef.current}/${maxRetries}`);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCountRef.current));
          return executeWithRetry(queryFn, maxRetries, retryDelay);
        }
      }
      
      setLoading(false);
      retryCountRef.current = 0;
      return result;
      
    } catch (error) {
      setLoading(false);
      retryCountRef.current = 0;
      throw error;
    }
  }, []);

  return {
    executeWithRetry,
    loading,
    isRetrying: retryCountRef.current > 0
  };
}
