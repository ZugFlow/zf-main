import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Session } from '@supabase/auth-helpers-nextjs';

interface SessionManagerState {
  isActive: boolean;
  isReconnecting: boolean;
  lastActivity: number;
  sessionValid: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

interface UseOptimizedSessionManagerProps {
  session: Session | null;
  onSessionExpired?: () => void;
  onReconnected?: () => void;
  idleTimeout?: number; // Default 5 minutes
  reconnectAttempts?: number; // Default 3 attempts
}

export function useOptimizedSessionManager({
  session,
  onSessionExpired,
  onReconnected,
  idleTimeout = 5 * 60 * 1000, // 5 minutes
  reconnectAttempts = 3
}: UseOptimizedSessionManagerProps) {
  const [state, setState] = useState<SessionManagerState>({
    isActive: true,
    isReconnecting: false,
    lastActivity: Date.now(),
    sessionValid: !!session?.user,
    connectionStatus: 'connected'
  });

  const supabase = createClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isReconnectingRef = useRef(false);
  const lastActivityRef = useRef(Date.now());

  // Memoized state to prevent unnecessary re-renders
  const memoizedState = useMemo(() => ({
    ...state,
    // Only expose connection status changes that matter for UI
    connectionStatus: state.connectionStatus,
    isReconnecting: state.isReconnecting
  }), [state.connectionStatus, state.isReconnecting]);

  // Track user activity with heavy throttling
  const updateActivity = useCallback(() => {
    const now = Date.now();
    // Only update if more than 60 seconds have passed since last activity
    if (now - lastActivityRef.current > 60000) {
      lastActivityRef.current = now;
      setState(prev => ({ ...prev, lastActivity: now }));
    }
  }, []);

  // Check if session is still valid with minimal state updates
  const checkSessionValidity = useCallback(async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        // Gestione più specifica degli errori
        if (error.message?.includes('JWT') || error.message?.includes('expired')) {
          console.warn('⚠️ [OptimizedSessionManager] JWT expired, attempting refresh');
          // Prova a fare un refresh automatico
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshData.session && !refreshError) {
            console.log('✅ [OptimizedSessionManager] Session refreshed successfully');
            setState(prev => ({
              ...prev,
              sessionValid: true,
              connectionStatus: 'connected'
            }));
            return true;
          }
        }
        
        console.warn('⚠️ [OptimizedSessionManager] Error checking session:', error);
        setState(prev => {
          if (prev.sessionValid || prev.connectionStatus !== 'disconnected') {
            return { 
              ...prev, 
              sessionValid: false, 
              connectionStatus: 'disconnected' 
            };
          }
          return prev;
        });
        return false;
      }

      const isValid = !!currentSession?.user;
      setState(prev => {
        // Only update state if it actually changed
        if (prev.sessionValid !== isValid || 
            (isValid && prev.connectionStatus !== 'connected') ||
            (!isValid && prev.connectionStatus !== 'disconnected')) {
          return { 
            ...prev, 
            sessionValid: isValid,
            connectionStatus: isValid ? 'connected' : 'disconnected'
          };
        }
        return prev;
      });

      return isValid;
    } catch (error) {
      console.error('❌ [OptimizedSessionManager] Error checking session validity:', error);
      // Non impostare automaticamente come disconnesso per errori di rete temporanei
      return state.sessionValid; // Mantieni lo stato corrente
    }
  }, [supabase.auth, state.sessionValid]);

  // Attempt to reconnect
  const attemptReconnect = useCallback(async () => {
    if (isReconnectingRef.current || reconnectAttemptsRef.current >= reconnectAttempts) {
      console.warn('⚠️ [OptimizedSessionManager] Max reconnection attempts reached or already reconnecting');
      return;
    }

    isReconnectingRef.current = true;
    reconnectAttemptsRef.current++;
    
    console.log(`🔄 [OptimizedSessionManager] Attempting reconnection (${reconnectAttemptsRef.current}/${reconnectAttempts})`);
    setState(prev => ({ ...prev, isReconnecting: true, connectionStatus: 'reconnecting' }));

    try {
      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ [OptimizedSessionManager] Error refreshing session:', error);
        throw error;
      }

      if (data.session) {
        console.log('✅ [OptimizedSessionManager] Session refreshed successfully');
        setState(prev => ({ 
          ...prev, 
          isReconnecting: false, 
          sessionValid: true, 
          connectionStatus: 'connected',
          lastActivity: Date.now()
        }));
        reconnectAttemptsRef.current = 0;
        onReconnected?.();
        return true;
      } else {
        throw new Error('No session returned from refresh');
      }
    } catch (error) {
      console.error('❌ [OptimizedSessionManager] Reconnection failed:', error);
      setState(prev => ({ 
        ...prev, 
        isReconnecting: false, 
        connectionStatus: 'disconnected' 
      }));

      // Schedule next attempt
      if (reconnectAttemptsRef.current < reconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          isReconnectingRef.current = false;
          attemptReconnect();
        }, 2000 * reconnectAttemptsRef.current); // Exponential backoff
      } else {
        console.error('❌ [OptimizedSessionManager] All reconnection attempts failed');
        onSessionExpired?.();
      }
    }
  }, [supabase.auth, reconnectAttempts, onReconnected, onSessionExpired]);

  // Handle visibility change (tab becomes active/inactive) with throttling
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout | null = null;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [OptimizedSessionManager] Tab became visible, checking session');
        setState(prev => ({ ...prev, isActive: true }));
        
        // Debounce the session check to prevent rapid calls
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
        }
        
        visibilityTimeout = setTimeout(() => {
          // Check if we've been idle for too long
          const timeSinceLastActivity = Date.now() - state.lastActivity;
          if (timeSinceLastActivity > idleTimeout) {
            console.log('⏰ [OptimizedSessionManager] App was idle, checking session validity');
            checkSessionValidity().then(isValid => {
              if (!isValid) {
                console.log('🔄 [OptimizedSessionManager] Session invalid after idle, attempting reconnect');
                attemptReconnect();
              }
            });
          }
        }, 1000); // 1 second debounce
      } else {
        console.log('👁️ [OptimizedSessionManager] Tab became hidden');
        setState(prev => ({ ...prev, isActive: false }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
    };
  }, [state.lastActivity, idleTimeout, checkSessionValidity, attemptReconnect]);

  // Handle focus/blur events with throttling
  useEffect(() => {
    let focusTimeout: NodeJS.Timeout | null = null;
    
    const handleFocus = () => {
      console.log('🎯 [OptimizedSessionManager] Window gained focus');
      updateActivity();
      
      // Debounce the session check
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
      
      focusTimeout = setTimeout(() => {
        checkSessionValidity().then(isValid => {
          if (!isValid && !isReconnectingRef.current) {
            console.log('🔄 [OptimizedSessionManager] Session invalid on focus, attempting reconnect');
            attemptReconnect();
          }
        });
      }, 500); // 500ms debounce
    };

    const handleBlur = () => {
      console.log('🎯 [OptimizedSessionManager] Window lost focus');
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
    };
  }, [updateActivity, checkSessionValidity, attemptReconnect]);

  // Track user activity with heavy throttling and specific events only
  useEffect(() => {
    let lastActivityUpdate = 0;
    const THROTTLE_DELAY = 60000; // Update activity at most once per minute

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityUpdate > THROTTLE_DELAY) {
        lastActivityUpdate = now;
        updateActivity();
      }
    };

    // Aggiungi più eventi per tracciare l'attività
    const events = ['click', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [updateActivity]);

  // Gestione eventi di connettività di rete
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [OptimizedSessionManager] Network back online, checking session');
      setState(prev => ({ ...prev, connectionStatus: 'reconnecting' }));
      
      // Verifica la sessione quando torna la connessione
      setTimeout(() => {
        checkSessionValidity().then(isValid => {
          if (isValid) {
            setState(prev => ({ ...prev, connectionStatus: 'connected' }));
          } else {
            attemptReconnect();
          }
        });
      }, 1000);
    };

    const handleOffline = () => {
      console.log('🌐 [OptimizedSessionManager] Network went offline');
      setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkSessionValidity, attemptReconnect]);

  // Periodic session validity check with reduced frequency
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isActive && !isReconnectingRef.current && state.sessionValid) {
        // Solo se la sessione è attualmente valida, fai un controllo leggero
        checkSessionValidity().then(isValid => {
          if (!isValid && !isReconnectingRef.current) {
            console.log('🔄 [OptimizedSessionManager] Periodic check found invalid session, attempting reconnect');
            attemptReconnect();
          }
        }).catch(error => {
          console.warn('⚠️ [OptimizedSessionManager] Error during periodic check:', error);
        });
      }
    }, 600000); // Check ogni 10 minuti invece di 5 per ridurre il carico

    return () => clearInterval(interval);
  }, [state.isActive, state.sessionValid, checkSessionValidity, attemptReconnect]);

  // Update session validity when session prop changes with optimization
  useEffect(() => {
    const isValid = !!session?.user;
    setState(prev => {
      // Only update if the state actually changed
      if (prev.sessionValid !== isValid || 
          (isValid && prev.connectionStatus !== 'connected') ||
          (!isValid && prev.connectionStatus !== 'disconnected')) {
        return { 
          ...prev, 
          sessionValid: isValid,
          connectionStatus: isValid ? 'connected' : 'disconnected'
        };
      }
      return prev;
    });
  }, [session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...memoizedState,
    checkSessionValidity,
    attemptReconnect,
    updateActivity
  };
} 