import { useState, useEffect, useRef } from 'react';

interface InitializationState {
  sessionLoaded: boolean;
  permissionsLoaded: boolean;
  sidebarDataLoaded: boolean;
  isFullyLoaded: boolean;
  hasInitialized: boolean;
}

interface UseInitializationProps {
  session: any;
  permissionsLoading: boolean;
  hasPermission: (permission: string) => boolean;
  onInitializationComplete?: () => void;
}

export function useInitialization({
  session,
  permissionsLoading,
  hasPermission,
  onInitializationComplete
}: UseInitializationProps) {
  const [state, setState] = useState<InitializationState>({
    sessionLoaded: false,
    permissionsLoaded: false,
    sidebarDataLoaded: false,
    isFullyLoaded: false,
    hasInitialized: false
  });

  const initializationTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredComplete = useRef(false);

  // Update session loaded state
  useEffect(() => {
    if (session?.user?.id && !state.sessionLoaded) {
      setState(prev => ({ ...prev, sessionLoaded: true }));
    }
  }, [session?.user?.id, state.sessionLoaded]);

  // Update permissions loaded state
  useEffect(() => {
    if (!permissionsLoading && state.sessionLoaded && !state.permissionsLoaded) {
      setState(prev => ({ ...prev, permissionsLoaded: true }));
    }
  }, [permissionsLoading, state.sessionLoaded, state.permissionsLoaded]);

  // Update sidebar data loaded state
  useEffect(() => {
    if (state.permissionsLoaded && hasPermission('canViewAppointments') && !state.sidebarDataLoaded) {
      setState(prev => ({ ...prev, sidebarDataLoaded: true }));
    }
  }, [state.permissionsLoaded, hasPermission, state.sidebarDataLoaded]);

  // Check if everything is loaded
  useEffect(() => {
    const allLoaded = state.sessionLoaded && state.permissionsLoaded && state.sidebarDataLoaded;
    
    if (allLoaded && !state.isFullyLoaded) {
      setState(prev => ({ ...prev, isFullyLoaded: true }));
    }
  }, [state.sessionLoaded, state.permissionsLoaded, state.sidebarDataLoaded, state.isFullyLoaded]);

  // Trigger initialization complete callback
  useEffect(() => {
    if (state.isFullyLoaded && !state.hasInitialized && !hasTriggeredComplete.current) {
      hasTriggeredComplete.current = true;
      setState(prev => ({ ...prev, hasInitialized: true }));
      
      // Clear any existing timeout
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
      
      // Add a small delay to ensure all state updates are complete
      initializationTimeout.current = setTimeout(() => {
        console.log('✅ [useInitialization] All components initialized successfully');
        onInitializationComplete?.();
      }, 100);
    }
  }, [state.isFullyLoaded, state.hasInitialized, onInitializationComplete]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
    };
  }, []);

  // Force initialization complete after a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!state.isFullyLoaded && !hasTriggeredComplete.current) {
        console.warn('⚠️ [useInitialization] Forcing initialization complete after timeout');
        hasTriggeredComplete.current = true;
        setState(prev => ({ 
          ...prev, 
          isFullyLoaded: true, 
          hasInitialized: true 
        }));
        onInitializationComplete?.();
      }
    }, 15000); // Increased to 15 seconds to allow for reconnection attempts

    return () => clearTimeout(timeout);
  }, [state.isFullyLoaded, onInitializationComplete]);

  // Reset initialization state when session becomes invalid
  useEffect(() => {
    if (!session?.user?.id && state.sessionLoaded) {
      console.log('🔄 [useInitialization] Session became invalid, resetting state');
      setState({
        sessionLoaded: false,
        permissionsLoaded: false,
        sidebarDataLoaded: false,
        isFullyLoaded: false,
        hasInitialized: false
      });
      hasTriggeredComplete.current = false;
    }
  }, [session?.user?.id, state.sessionLoaded]);

  return {
    ...state,
    isLoading: !state.isFullyLoaded || permissionsLoading,
    canRender: state.isFullyLoaded && !permissionsLoading
  };
} 