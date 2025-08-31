import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { timerManager } from '@/utils/timerManager';
import { initializeSession } from '@/utils/supabase/sessionUtils';

interface DashboardData {
  session: any;
  teamMembers: any[];
  sidebarData: any;
  appointments: any[];
  services: any[];
  clients: any[];
  groups: any[];
  settings: any;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

interface UseDashboardDataOptions {
  enableRealtime?: boolean;
  autoRefreshInterval?: number;
  userId?: string;
}

export function useDashboardData(options: UseDashboardDataOptions = {}) {
  const {
    enableRealtime = true,
    autoRefreshInterval = 300000, // 5 minutes
    userId
  } = options;

  const supabase = createClient();
  const mountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const subscriptionsRef = useRef<any[]>([]);

  const [state, setState] = useState<DashboardData>({
    session: null,
    teamMembers: [],
    sidebarData: null,
    appointments: [],
    services: [],
    clients: [],
    groups: [],
    settings: null,
    isLoading: true,
    error: null,
    lastUpdated: 0
  });

  /**
   * Update state safely (only if component is mounted)
   */
  const updateState = useCallback((updates: Partial<DashboardData>) => {
    if (!mountedRef.current) return;
    
    setState(prevState => ({
      ...prevState,
      ...updates,
      lastUpdated: Date.now()
    }));
  }, []);

  /**
   * Fetch fresh data from database
   */
  const fetchFreshData = useCallback(async (userId: string): Promise<Partial<DashboardData>> => {
    try {
      console.log('🔄 Fetching fresh dashboard data...');

      // Fetch all data in parallel
      const [
        teamMembersResponse,
        appointmentsResponse,
        servicesResponse,
        clientsResponse,
        groupsResponse,
        settingsResponse
      ] = await Promise.all([
        supabase
          .from('team_members')
          .select('*')
          .eq('salon_id', userId)
          .order('nome'),
        
        supabase
          .from('orders')
          .select(`
            *,
            order_services (
              *,
              services (*)
            )
          `)
          .eq('salon_id', userId)
          .neq('status', 'Eliminato')
          .gte('data', new Date().toISOString().split('T')[0])
          .order('data', { ascending: true })
          .limit(100),
        
        supabase
          .from('services')
          .select('*')
          .eq('salon_id', userId)
          .order('nome'),
        
        supabase
          .from('customers')
          .select('nome, customer_uuid')
          .eq('salon_id', userId)
          .order('nome')
          .limit(500),
        
        supabase
          .from('team_groups')
          .select('*')
          .eq('salon_id', userId)
          .order('nome'),
        
        supabase
          .from('salon_settings')
          .select('*')
          .eq('salon_id', userId)
          .single()
      ]);

      // Process appointments to include services
      const processedAppointments = appointmentsResponse.data?.map(appointment => ({
        ...appointment,
        services: appointment.order_services?.map((os: any) => os.services) || []
      })) || [];

      // Process clients
      const processedClients = clientsResponse.data?.map((client, index) => ({
        id: index,
        nome: client.nome,
        customer_uuid: client.customer_uuid,
      })) || [];

      const freshData: Partial<DashboardData> = {
        teamMembers: teamMembersResponse.data || [],
        appointments: processedAppointments,
        services: servicesResponse.data || [],
        clients: processedClients,
        groups: groupsResponse.data || [],
        settings: settingsResponse.data || null
      };

      console.log('✅ Fresh dashboard data fetched');
      return freshData;

    } catch (error) {
      console.error('❌ Error fetching fresh dashboard data:', error);
      throw error;
    }
  }, [supabase]);

  /**
   * Load dashboard data
   */
  const loadDashboardData = useCallback(async (userId: string, forceRefresh: boolean = false) => {
    if (!mountedRef.current) return;

    const now = Date.now();
    
    // Prevent too frequent fetches (minimum 30 seconds)
    if (!forceRefresh && (now - lastFetchRef.current < 30000)) {
      console.log('🔄 Dashboard fetch throttled (too soon)');
      return;
    }

    try {
      updateState({ isLoading: true, error: null });

      // Always fetch fresh data
      const freshData = await fetchFreshData(userId);
      
      if (!mountedRef.current) return;

      // Update state with fresh data
      updateState({ ...freshData, isLoading: false });

      lastFetchRef.current = now;

    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error('❌ Dashboard data loading failed:', error);
      updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [fetchFreshData, updateState]);

  /**
   * Setup realtime subscriptions
   */
  const setupRealtimeSubscriptions = useCallback((userId: string) => {
    if (!enableRealtime || !userId) return;

    console.log('🔄 Setting up dashboard realtime subscriptions...');

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach(sub => {
      supabase.removeChannel(sub);
    });
    subscriptionsRef.current = [];

    // Orders subscription
    const ordersSubscription = supabase
      .channel('dashboard-orders')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'orders', filter: `salon_id=eq.${userId}` },
        async (payload) => {
          console.log('🔄 Orders realtime update:', payload.eventType);
          
          // Refresh appointments
          timerManager.debounceTimeout(
            'refresh-appointments',
            () => loadDashboardData(userId, false),
            1000,
            'realtime'
          );
        }
      )
      .subscribe();

    // Team members subscription
    const teamSubscription = supabase
      .channel('dashboard-team')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'team_members', filter: `salon_id=eq.${userId}` },
        async (payload) => {
          console.log('🔄 Team members realtime update:', payload.eventType);
          
          // Refresh team members
          timerManager.debounceTimeout(
            'refresh-team',
            () => loadDashboardData(userId, false),
            1000,
            'realtime'
          );
        }
      )
      .subscribe();

    // Services subscription
    const servicesSubscription = supabase
      .channel('dashboard-services')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'services', filter: `salon_id=eq.${userId}` },
        async (payload) => {
          console.log('🔄 Services realtime update:', payload.eventType);
          
          // Refresh services
          timerManager.debounceTimeout(
            'refresh-services',
            () => loadDashboardData(userId, false),
            1000,
            'realtime'
          );
        }
      )
      .subscribe();

    subscriptionsRef.current = [ordersSubscription, teamSubscription, servicesSubscription];

  }, [enableRealtime, supabase, loadDashboardData]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback((forceRefresh: boolean = true) => {
    if (state.session?.user?.id) {
      loadDashboardData(state.session.user.id, forceRefresh);
    }
  }, [state.session?.user?.id, loadDashboardData]);

  // Main effect - load initial data and setup subscriptions
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;

    const initializeDashboard = async () => {
      try {
        // Initialize session first
        const session = await initializeSession({ maxRetries: 3, timeout: 10000 });
        
        if (!mounted) return;

        if (session && (session as any)?.user) {
          updateState({ session, isLoading: true });
          
          const userId = (session as any).user.id;
          
          // Load dashboard data
          await loadDashboardData(userId, false);
          
          // Setup realtime subscriptions
          if (mounted) {
            setupRealtimeSubscriptions(userId);
          }
          
          // Setup auto-refresh
          if (autoRefreshInterval > 0) {
            timerManager.setInterval(
              'dashboard-auto-refresh',
              () => {
                if (document.visibilityState === 'visible') {
                  loadDashboardData(userId, false);
                }
              },
              autoRefreshInterval,
              'dashboard'
            );
          }
          
        } else {
          if (mounted) {
            updateState({
              session: null,
              isLoading: false,
              error: 'No authenticated session'
            });
          }
        }

      } catch (error) {
        if (mounted) {
          console.error('❌ Dashboard initialization failed:', error);
          updateState({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Initialization failed'
          });
        }
      }
    };

    initializeDashboard();

    // Cleanup function
    return () => {
      mounted = false;
      mountedRef.current = false;
      
      // Clean up subscriptions
      subscriptionsRef.current.forEach(sub => {
        supabase.removeChannel(sub);
      });
      subscriptionsRef.current = [];
      
      // Clean up timers
      timerManager.clearCategory('dashboard');
      timerManager.clearCategory('realtime');
    };
  }, [userId]); // Re-run if userId changes

  // Visibility change effect - refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.session?.user?.id) {
        timerManager.debounceTimeout(
          'visibility-refresh',
          () => loadDashboardData(state.session.user.id, false),
          2000,
          'visibility'
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      timerManager.clearCategory('visibility');
    };
  }, [state.session?.user?.id, loadDashboardData]);

  return {
    ...state,
    refresh,
    isConnected: subscriptionsRef.current.length > 0
  };
}
