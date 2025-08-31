import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface UseInactivityManagerConfig {
  inactivityThreshold?: number; // Default: 3 minutes
  refreshThreshold?: number; // Default: 5 minutes
  onInactivityDetected?: () => void;
  onRefreshTriggered?: () => void;
  enableAutoRefresh?: boolean; // Default: true
}

interface UseInactivityManagerReturn {
  isInactive: boolean;
  lastActivity: number;
  forceRefresh: () => void;
  resetInactivity: () => void;
}

export function useInactivityManager({
  inactivityThreshold = 3 * 60 * 1000, // 3 minutes
  refreshThreshold = 5 * 60 * 1000, // 5 minutes
  onInactivityDetected,
  onRefreshTriggered,
  enableAutoRefresh = true
}: UseInactivityManagerConfig = {}): UseInactivityManagerReturn {
  
  const lastActivityRef = useRef<number>(Date.now());
  const isInactiveRef = useRef<boolean>(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRefreshRef = useRef<boolean>(false);
  
  const supabase = createClient();

  // Reset inactivity state
  const resetInactivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    isInactiveRef.current = false;
    hasTriggeredRefreshRef.current = false;
    
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    console.log('🔄 [InactivityManager] Forcing refresh after inactivity');
    
    try {
      // 1. Test and refresh Supabase connection
      const { data, error } = await supabase.from('orders').select('id').limit(1);
      if (error) {
        console.warn('⚠️ [InactivityManager] Supabase connection error, attempting refresh');
        await supabase.auth.refreshSession();
      }

      // 2. Clear relevant caches
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('zugflow_') || 
        key.includes('appointments') || 
        key.includes('calendar') ||
        key.includes('sidebar')
      );
      
      cacheKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to clear cache key: ${key}`, error);
        }
      });

      // 3. Dispatch refresh events
      window.dispatchEvent(new CustomEvent('inactivity:refresh'));
      window.dispatchEvent(new CustomEvent('appointment:refresh'));
      window.dispatchEvent(new CustomEvent('calendar:refresh'));
      
      // 4. Call callback if provided
      onRefreshTriggered?.();
      
      console.log('✅ [InactivityManager] Refresh completed successfully');
      
    } catch (error) {
      console.error('❌ [InactivityManager] Error during refresh:', error);
    }
    
    resetInactivity();
  }, [supabase, onRefreshTriggered, resetInactivity]);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only update if enough time has passed (throttling)
    if (timeSinceLastActivity > 30000) { // 30 seconds
      lastActivityRef.current = now;
      
      // If we were inactive and user is now active, check if we need to refresh
      if (isInactiveRef.current && timeSinceLastActivity > refreshThreshold && enableAutoRefresh) {
        if (!hasTriggeredRefreshRef.current) {
          hasTriggeredRefreshRef.current = true;
          console.log('🎯 [InactivityManager] User returned after long inactivity, triggering refresh');
          forceRefresh();
        }
      }
      
      isInactiveRef.current = false;
    }
  }, [refreshThreshold, enableAutoRefresh, forceRefresh]);

  // Check inactivity periodically
  const checkInactivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    if (timeSinceLastActivity > inactivityThreshold && !isInactiveRef.current) {
      console.log('😴 [InactivityManager] Inactivity detected');
      isInactiveRef.current = true;
      onInactivityDetected?.();
    }
  }, [inactivityThreshold, onInactivityDetected]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ [InactivityManager] Page became visible');
      updateActivity();
    } else {
      console.log('👁️ [InactivityManager] Page became hidden');
    }
  }, [updateActivity]);

  // Handle focus events
  const handleFocus = useCallback(() => {
    console.log('🎯 [InactivityManager] Window gained focus');
    updateActivity();
  }, [updateActivity]);

  // Setup event listeners and intervals
  useEffect(() => {
    // Activity events (throttled)
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Visibility and focus events
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Periodic inactivity check
    checkIntervalRef.current = setInterval(checkInactivity, 60000); // Check every minute

    // Initial activity update
    updateActivity();

    return () => {
      // Cleanup
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [updateActivity, handleVisibilityChange, handleFocus, checkInactivity]);

  return {
    isInactive: isInactiveRef.current,
    lastActivity: lastActivityRef.current,
    forceRefresh,
    resetInactivity
  };
}
