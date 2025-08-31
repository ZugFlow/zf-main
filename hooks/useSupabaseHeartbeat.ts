import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface HeartbeatConfig {
  interval?: number; // Interval in milliseconds (default: 30 seconds)
  timeout?: number; // Request timeout in milliseconds (default: 5 seconds)
  enabled?: boolean; // Whether heartbeat is enabled (default: true)
  onHeartbeatSuccess?: () => void;
  onHeartbeatError?: (error: any) => void;
  onConnectionLost?: () => void;
}

interface UseSupabaseHeartbeatReturn {
  isActive: boolean;
  lastHeartbeat: Date | null;
  heartbeatCount: number;
  lastError: string | null;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  forceHeartbeat: () => Promise<boolean>;
}

export function useSupabaseHeartbeat(config: HeartbeatConfig = {}): UseSupabaseHeartbeatReturn {
  const {
    interval = 60000, // 60 seconds (1 minute)
    timeout = 5000, // 5 seconds
    enabled = true,
    onHeartbeatSuccess,
    onHeartbeatError,
    onConnectionLost
  } = config;

  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);
  const isPerformingHeartbeatRef = useRef(false);
  const heartbeatCountRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);
  const maxConsecutiveFailures = 3;
  const lastHeartbeatTimeRef = useRef<number>(0);
  const minIntervalBetweenHeartbeats = 10000; // Minimum 10 seconds between heartbeats

  const [isActive, setIsActive] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [heartbeatCount, setHeartbeatCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // Function to perform a heartbeat request
  const performHeartbeat = useCallback(async (): Promise<boolean> => {
    if (!isActiveRef.current || isPerformingHeartbeatRef.current) {
      console.log('💓 [Heartbeat] Skipping heartbeat - already performing or not active');
      return false;
    }

    const now = Date.now();
    const timeSinceLastHeartbeat = now - lastHeartbeatTimeRef.current;
    
    if (timeSinceLastHeartbeat < minIntervalBetweenHeartbeats) {
      console.log(`💓 [Heartbeat] Skipping heartbeat - too soon (${timeSinceLastHeartbeat}ms < ${minIntervalBetweenHeartbeats}ms)`);
      return false;
    }

    try {
      isPerformingHeartbeatRef.current = true;
      console.log('💓 [Heartbeat] Sending heartbeat request...');
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Heartbeat timeout'));
        }, timeout);
      });

      // Perform a simple query to test the connection
      const heartbeatPromise = supabase
        .from('orders')
        .select('id')
        .limit(1)
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        });

      // Race between the heartbeat and timeout
      const result = await Promise.race([heartbeatPromise, timeoutPromise]);

      // Clear timeout if it was set
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Success
      const now = new Date();
      setLastHeartbeat(now);
      setHeartbeatCount(prev => prev + 1);
      heartbeatCountRef.current++;
      consecutiveFailuresRef.current = 0;
      setLastError(null);
      lastHeartbeatTimeRef.current = Date.now();

      console.log(`✅ [Heartbeat] Success (${heartbeatCountRef.current} total)`);
      onHeartbeatSuccess?.();

      return true;
    } catch (error) {
      // Clear timeout if it was set
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Failure
      consecutiveFailuresRef.current++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown heartbeat error';
      setLastError(errorMessage);

      console.error(`❌ [Heartbeat] Failed (attempt ${consecutiveFailuresRef.current}):`, errorMessage);
      onHeartbeatError?.(error);

      // If too many consecutive failures, trigger connection lost
      if (consecutiveFailuresRef.current >= maxConsecutiveFailures) {
        console.error(`🚨 [Heartbeat] Too many consecutive failures (${consecutiveFailuresRef.current}), triggering connection lost`);
        onConnectionLost?.();
      }

      return false;
    } finally {
      isPerformingHeartbeatRef.current = false;
    }
  }, [supabase, timeout, onHeartbeatSuccess, onHeartbeatError, onConnectionLost]);

  // Function to start the heartbeat
  const startHeartbeat = useCallback(() => {
    if (isActiveRef.current) {
      console.log('💓 [Heartbeat] Already active, skipping start');
      return;
    }

    console.log('💓 [Heartbeat] Starting heartbeat with interval:', interval, 'ms');
    isActiveRef.current = true;
    setIsActive(true);

    // Perform initial heartbeat after a delay to avoid immediate execution
    setTimeout(() => {
      if (isActiveRef.current) {
        performHeartbeat();
      }
    }, 1000);

    // Set up periodic heartbeat
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current && !isPerformingHeartbeatRef.current) {
        performHeartbeat();
      }
    }, interval);
  }, [interval, performHeartbeat]);

  // Function to stop the heartbeat
  const stopHeartbeat = useCallback(() => {
    console.log('💓 [Heartbeat] Stopping heartbeat');
    isActiveRef.current = false;
    setIsActive(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Function to force a heartbeat immediately
  const forceHeartbeat = useCallback(async (): Promise<boolean> => {
    console.log('💓 [Heartbeat] Forcing immediate heartbeat');
    return await performHeartbeat();
  }, [performHeartbeat]);

  // Handle visibility changes to pause/resume heartbeat
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ [Heartbeat] Page became visible, resuming heartbeat');
      if (enabled && !isActiveRef.current) {
        // Add delay to prevent immediate execution
        setTimeout(() => {
          if (enabled && !isActiveRef.current) {
            startHeartbeat();
          }
        }, 2000);
      }
    } else {
      console.log('👁️ [Heartbeat] Page became hidden, pausing heartbeat');
      stopHeartbeat();
    }
  }, [enabled, startHeartbeat, stopHeartbeat]);

  // Setup heartbeat and visibility listener
  useEffect(() => {
    if (enabled) {
      // Add delay to prevent immediate execution on component mount
      const timer = setTimeout(() => {
        startHeartbeat();
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }, 3000);

      return () => {
        clearTimeout(timer);
        stopHeartbeat();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    return () => {
      stopHeartbeat();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startHeartbeat, stopHeartbeat, handleVisibilityChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    isActive,
    lastHeartbeat,
    heartbeatCount,
    lastError,
    startHeartbeat,
    stopHeartbeat,
    forceHeartbeat
  };
} 