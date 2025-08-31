import { useEffect, useRef, useCallback } from 'react';
import { useInactivityManager } from './useInactivityManager';

interface UsePageChangeRefreshConfig {
  enableAutoRefresh?: boolean;
  refreshOnPageChange?: boolean;
  inactivityThreshold?: number;
  debugMode?: boolean;
}

export function usePageChangeRefresh({
  enableAutoRefresh = true,
  refreshOnPageChange = true,
  inactivityThreshold = 3 * 60 * 1000, // 3 minutes
  debugMode = false
}: UsePageChangeRefreshConfig = {}) {
  
  const currentPageRef = useRef<string>('');
  const lastPageChangeRef = useRef<number>(Date.now());
  
  // Use inactivity manager
  const { isInactive, lastActivity, forceRefresh, resetInactivity } = useInactivityManager({
    inactivityThreshold,
    enableAutoRefresh,
    onInactivityDetected: () => {
      if (debugMode) {
        console.log('😴 [PageChangeRefresh] User is now inactive');
      }
    },
    onRefreshTriggered: () => {
      if (debugMode) {
        console.log('🔄 [PageChangeRefresh] Auto-refresh triggered');
      }
    }
  });

  // Track page changes via hash or custom events
  const handlePageChange = useCallback((newPage: string) => {
    const now = Date.now();
    const timeSinceLastPageChange = now - lastPageChangeRef.current;
    const timeSinceLastActivity = now - lastActivity;
    
    if (debugMode) {
      console.log('📄 [PageChangeRefresh] Page change detected:', {
        from: currentPageRef.current,
        to: newPage,
        timeSinceLastActivity: Math.round(timeSinceLastActivity / 1000) + 's',
        isInactive,
        shouldRefresh: timeSinceLastActivity > inactivityThreshold
      });
    }
    
    // If user was inactive and now changing pages, trigger refresh
    if (refreshOnPageChange && 
        timeSinceLastActivity > inactivityThreshold && 
        timeSinceLastPageChange > 5000 && // Prevent rapid page changes
        currentPageRef.current !== newPage) {
      
      if (debugMode) {
        console.log('🔄 [PageChangeRefresh] Triggering refresh due to page change after inactivity');
      }
      
      // Small delay to let the page change complete
      setTimeout(() => {
        forceRefresh();
      }, 100);
    }
    
    currentPageRef.current = newPage;
    lastPageChangeRef.current = now;
    resetInactivity(); // Reset since user is now active
  }, [lastActivity, isInactive, inactivityThreshold, refreshOnPageChange, debugMode, forceRefresh, resetInactivity]);

  // Listen for custom page change events
  useEffect(() => {
    const handleCustomPageChange = (event: CustomEvent) => {
      if (event.detail && event.detail.page) {
        handlePageChange(event.detail.page);
      }
    };

    // Listen for various navigation events
    const handleHashChange = () => {
      handlePageChange(window.location.hash);
    };

    const handlePopState = () => {
      handlePageChange(window.location.pathname + window.location.search);
    };

    // Custom events from your navigation system
    window.addEventListener('navigation:pageChange', handleCustomPageChange as EventListener);
    window.addEventListener('dashboard:viewChange', handleCustomPageChange as EventListener);
    
    // Browser navigation events
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);

    // Set initial page
    handlePageChange(window.location.pathname + window.location.search + window.location.hash);

    return () => {
      window.removeEventListener('navigation:pageChange', handleCustomPageChange as EventListener);
      window.removeEventListener('dashboard:viewChange', handleCustomPageChange as EventListener);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePageChange]);

  // Provide manual trigger functions
  const triggerRefresh = useCallback(() => {
    if (debugMode) {
      console.log('🔄 [PageChangeRefresh] Manual refresh triggered');
    }
    forceRefresh();
  }, [forceRefresh, debugMode]);

  const notifyPageChange = useCallback((pageName: string) => {
    if (debugMode) {
      console.log('📄 [PageChangeRefresh] Manual page change notification:', pageName);
    }
    handlePageChange(pageName);
  }, [handlePageChange, debugMode]);

  return {
    isInactive,
    lastActivity,
    triggerRefresh,
    notifyPageChange,
    currentPage: currentPageRef.current
  };
}
