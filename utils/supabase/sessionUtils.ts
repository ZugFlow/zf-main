import { createClient } from '@/utils/supabase/client';

interface SessionInitOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Inizializza la sessione Supabase in modo robusto
 * Attende che la sessione sia completamente caricata prima di procedere
 */
export async function initializeSession(options: SessionInitOptions = {}) {
  const { maxRetries = 5, retryDelay = 1000, timeout = 10000 } = options;
  const supabase = createClient();
  
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    let timeoutId: NodeJS.Timeout;
    
    const checkSession = async () => {
      try {
        console.log(`🔍 [SessionInit] Checking session (attempt ${retryCount + 1}/${maxRetries})`);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn(`⚠️ [SessionInit] Session check error:`, error.message);
          
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(checkSession, retryDelay * retryCount);
            return;
          }
          
          console.error(`❌ [SessionInit] Max retries reached, session initialization failed`);
          clearTimeout(timeoutId);
          reject(new Error(`Session initialization failed after ${maxRetries} attempts: ${error.message}`));
          return;
        }
        
        if (session?.user) {
          console.log(`✅ [SessionInit] Session initialized successfully for user:`, session.user.id);
          clearTimeout(timeoutId);
          resolve(session);
          return;
        }
        
        // Se non c'è errore ma neanche sessione, potrebbe essere un utente non autenticato
        // In questo caso, risolviamo con null
        console.log(`ℹ️ [SessionInit] No active session found (user not authenticated)`);
        clearTimeout(timeoutId);
        resolve(null);
        
      } catch (error) {
        console.error(`❌ [SessionInit] Unexpected error:`, error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkSession, retryDelay * retryCount);
          return;
        }
        
        clearTimeout(timeoutId);
        reject(error);
      }
    };
    
    // Timeout di sicurezza
    timeoutId = setTimeout(() => {
      console.error(`❌ [SessionInit] Session initialization timeout after ${timeout}ms`);
      reject(new Error(`Session initialization timeout after ${timeout}ms`));
    }, timeout);
    
    // Inizia il controllo
    checkSession();
  });
}

/**
 * Wrapper per eseguire operazioni che richiedono una sessione valida
 * Aspetta che la sessione sia inizializzata prima di eseguire la funzione
 */
export async function withSession<T>(
  operation: (session: any) => Promise<T>,
  options: SessionInitOptions = {}
): Promise<T> {
  try {
    const session = await initializeSession(options);
    
    if (!session) {
      throw new Error('User not authenticated');
    }
    
    return await operation(session);
  } catch (error) {
    console.error('❌ [withSession] Operation failed:', error);
    throw error;
  }
}

/**
 * Controlla se la sessione è valida e la refresha se necessario
 */
export async function ensureValidSession() {
  const supabase = createClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('⚠️ [ensureValidSession] Session check error:', error.message);
      
      // Prova a refreshare la sessione
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ [ensureValidSession] Session refresh failed:', refreshError.message);
        throw refreshError;
      }
      
      if (refreshData.session) {
        console.log('✅ [ensureValidSession] Session refreshed successfully');
        return refreshData.session;
      }
      
      throw new Error('Session refresh returned no session');
    }
    
    if (!session) {
      throw new Error('No active session');
    }
    
    // Controlla se il token sta per scadere (entro 5 minuti)
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    if (expiresAt && (expiresAt - now) < fiveMinutes) {
      console.log('🔄 [ensureValidSession] Token expiring soon, refreshing...');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ [ensureValidSession] Proactive refresh failed:', refreshError.message);
        // Non è critico, la sessione corrente è ancora valida
        return session;
      }
      
      if (refreshData.session) {
        console.log('✅ [ensureValidSession] Token refreshed proactively');
        return refreshData.session;
      }
    }
    
    return session;
    
  } catch (error) {
    console.error('❌ [ensureValidSession] Failed to ensure valid session:', error);
    throw error;
  }
}
