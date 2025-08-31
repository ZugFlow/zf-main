import { createClient } from '@/utils/supabase/client';

interface ConnectionTest {
  name: string;
  test: () => Promise<{ success: boolean; message: string; duration: number }>;
}

class SupabaseDebugger {
  private supabase = createClient();

  async runAllTests(): Promise<void> {
    console.log('🔍 === SUPABASE CONNECTION DIAGNOSTIC ===');
    
    const tests: ConnectionTest[] = [
      {
        name: 'Basic Connection',
        test: this.testBasicConnection.bind(this)
      },
      {
        name: 'Authentication Status',
        test: this.testAuthStatus.bind(this)
      },
      {
        name: 'Database Query',
        test: this.testDatabaseQuery.bind(this)
      },
      {
        name: 'Realtime Connection',
        test: this.testRealtimeConnection.bind(this)
      },
      {
        name: 'Session Refresh',
        test: this.testSessionRefresh.bind(this)
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${test.name}: ${result.message} (${result.duration}ms)`);
      } catch (error) {
        console.log(`❌ ${test.name}: Error - ${error}`);
      }
    }

    console.log('🔍 === END DIAGNOSTIC ===');
  }

  private async testBasicConnection(): Promise<{ success: boolean; message: string; duration: number }> {
    const startTime = Date.now();
    
    try {
      // Test se possiamo creare il client
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        return {
          success: false,
          message: 'Missing environment variables',
          duration: Date.now() - startTime
        };
      }

      return {
        success: true,
        message: 'Client created successfully',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create client: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async testAuthStatus(): Promise<{ success: boolean; message: string; duration: number }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await this.supabase.auth.getSession();
      
      if (error) {
        return {
          success: false,
          message: `Auth error: ${error.message}`,
          duration: Date.now() - startTime
        };
      }

      const hasSession = !!data.session;
      return {
        success: true,
        message: hasSession ? 'User authenticated' : 'No active session',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Auth check failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async testDatabaseQuery(): Promise<{ success: boolean; message: string; duration: number }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        return {
          success: false,
          message: `Database error: ${error.message}`,
          duration: Date.now() - startTime
        };
      }

      return {
        success: true,
        message: 'Database query successful',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Database query failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async testRealtimeConnection(): Promise<{ success: boolean; message: string; duration: number }> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        const channel = this.supabase
          .channel('test-connection')
          .on('presence', { event: 'sync' }, () => {
            // Test passed
          })
          .subscribe((status) => {
            const duration = Date.now() - startTime;
            
            if (status === 'SUBSCRIBED') {
              channel.unsubscribe();
              resolve({
                success: true,
                message: 'Realtime connection established',
                duration
              });
            } else if (status === 'CLOSED') {
              resolve({
                success: false,
                message: 'Realtime connection failed',
                duration
              });
            }
          });

        // Timeout fallback
        setTimeout(() => {
          channel.unsubscribe();
          resolve({
            success: false,
            message: 'Realtime connection timeout',
            duration: Date.now() - startTime
          });
        }, 5000);
      } catch (error) {
        resolve({
          success: false,
          message: `Realtime test failed: ${error}`,
          duration: Date.now() - startTime
        });
      }
    });
  }

  private async testSessionRefresh(): Promise<{ success: boolean; message: string; duration: number }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        return {
          success: false,
          message: `Session refresh error: ${error.message}`,
          duration: Date.now() - startTime
        };
      }

      return {
        success: true,
        message: data.session ? 'Session refreshed' : 'No session to refresh',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Session refresh failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  // Metodo per monitorare le performance delle query
  async monitorQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFunction();
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow query "${queryName}": ${duration}ms`);
      } else {
        console.log(`✅ Query "${queryName}": ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Query "${queryName}" failed after ${duration}ms:`, error);
      throw error;
    }
  }
}

// Funzione helper per il debug da console
if (typeof window !== 'undefined') {
  (window as any).debugSupabase = () => {
    new SupabaseDebugger().runAllTests();
  };
}

export const supabaseDebugger = new SupabaseDebugger();
