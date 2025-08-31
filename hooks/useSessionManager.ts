import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Session } from '@supabase/auth-helpers-nextjs';

interface SessionManagerState {
  isActive: boolean;
  isReconnecting: boolean;
  lastActivity: number;
  sessionValid: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

interface UseSessionManagerProps {
  session: Session | null;
  onSessionExpired?: () => void;
  onReconnected?: () => void;
  idleTimeout?: number; // Default 5 minutes
  reconnectAttempts?: number; // Default 3 attempts
}

export function useSessionManager({
  session,
  onSessionExpired,
  onReconnected,
  idleTimeout = 5 * 60 * 1000, // 5 minutes
  reconnectAttempts = 3
}: UseSessionManagerProps) {
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

  // Track user activity with debouncing
  const updateActivity = useCallback(() => {
    // Only update if the state actually needs to change
    setState(prev => {
      const now = Date.now();
      // Only update if more than 30 seconds have passed since last activity
      if (now - prev.lastActivity > 30000) {
        return { ...prev, lastActivity: now };
      }
      return prev;
    });
  }, []);

  // Check if session is still valid with state optimization
  const checkSessionValidity = useCallback(async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('⚠️ [SessionManager] Error checking session:', error);
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
      console.error('❌ [SessionManager] Error checking session validity:', error);
      return false;
    }
  }, [supabase.auth]);

  // Attempt to reconnect
  const attemptReconnect = useCallback(async () => {
    if (isReconnectingRef.current || reconnectAttemptsRef.current >= reconnectAttempts) {
      console.warn('⚠️ [SessionManager] Max reconnection attempts reached or already reconnecting');
      return;
    }

    isReconnectingRef.current = true;
    reconnectAttemptsRef.current++;
    
    console.log(`🔄 [SessionManager] Attempting reconnection (${reconnectAttemptsRef.current}/${reconnectAttempts})`);
    setState(prev => ({ ...prev, isReconnecting: true, connectionStatus: 'reconnecting' }));

    try {
      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ [SessionManager] Error refreshing session:', error);
        throw error;
      }

      if (data.session) {
        console.log('✅ [SessionManager] Session refreshed successfully');
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
      console.error('❌ [SessionManager] Reconnection failed:', error);
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
        console.error('❌ [SessionManager] All reconnection attempts failed');
        onSessionExpired?.();
      }
    }
  }, [supabase.auth, reconnectAttempts, onReconnected, onSessionExpired]);

  // Handle visibility change (tab becomes active/inactive)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [SessionManager] Tab became visible, checking session');
        setState(prev => ({ ...prev, isActive: true }));
        
        // Check if we've been idle for too long
        const timeSinceLastActivity = Date.now() - state.lastActivity;
        if (timeSinceLastActivity > idleTimeout) {
          console.log('⏰ [SessionManager] App was idle, checking session validity');
          checkSessionValidity().then(isValid => {
            if (!isValid) {
              console.log('🔄 [SessionManager] Session invalid after idle, attempting reconnect');
              attemptReconnect();
            }
          });
        }
      } else {
        console.log('👁️ [SessionManager] Tab became hidden');
        setState(prev => ({ ...prev, isActive: false }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.lastActivity, idleTimeout, checkSessionValidity, attemptReconnect]);

  // Handle focus/blur events
  useEffect(() => {
    const handleFocus = () => {
      console.log('🎯 [SessionManager] Window gained focus');
      updateActivity();
      
      // Check session validity when window gains focus
      checkSessionValidity().then(isValid => {
        if (!isValid && !isReconnectingRef.current) {
          console.log('🔄 [SessionManager] Session invalid on focus, attempting reconnect');
          attemptReconnect();
        }
      });
    };

    const handleBlur = () => {
      console.log('🎯 [SessionManager] Window lost focus');
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [updateActivity, checkSessionValidity, attemptReconnect]);

  // Track user activity (mouse, keyboard, touch) with throttling
  useEffect(() => {
    let activityTimeout: NodeJS.Timeout | null = null;
    let lastActivityUpdate = 0;
    const THROTTLE_DELAY = 1000; // Update activity at most once per second

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityUpdate > THROTTLE_DELAY) {
        lastActivityUpdate = now;
        updateActivity();
      }
    };

    // Use more specific events to reduce noise
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [updateActivity]);

  // Periodic session validity check with reduced frequency
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isActive && !isReconnectingRef.current) {
        checkSessionValidity().then(isValid => {
          if (!isValid && !isReconnectingRef.current) {
            console.log('🔄 [SessionManager] Periodic check found invalid session, attempting reconnect');
            attemptReconnect();
          }
        });
      }
    }, 60000); // Check every 60 seconds instead of 30

    return () => clearInterval(interval);
  }, [state.isActive, checkSessionValidity, attemptReconnect]);

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
    ...state,
    checkSessionValidity,
    attemptReconnect,
    updateActivity
  };
} 