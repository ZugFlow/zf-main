import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// Helper per eseguire query con retry automatico per errori di sessione
async function executeWithSessionRetry(queryFn: () => Promise<any>, maxRetries = 3) {
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      const result = await queryFn();
      
      if (result.error) {
        // Log dell'errore per debug
        console.warn(`🔍 [DEBUG] Query error:`, {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint
        });
        
        // Check if it's a session/auth error
        if (result.error.message?.includes('JWT') || 
            result.error.message?.includes('expired') || 
            result.error.message?.includes('session') ||
            result.error.message?.includes('Auth session missing')) {
          
          console.warn('🔄 [getSalonId] Session error detected, attempting refresh');
          
          // Try to refresh session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshData.session && !refreshError) {
            console.log('✅ [getSalonId] Session refreshed, retrying query');
            // Retry the query with fresh session
            return await queryFn();
          }
        }
        
        // Se è un errore PGRST116 (no rows), non è un errore fatale per maybeSingle
        if (result.error.code === 'PGRST116') {
          console.log('🔍 [DEBUG] No rows found (expected with maybeSingle)');
          return { data: null, error: null };
        }
        
        // Se è un errore 406, prova a fare retry
        if (result.error.message?.includes('406') || result.error.message?.includes('Not Acceptable')) {
          console.warn('🔄 [DEBUG] 406 error detected, will retry...');
          throw result.error;
        }
        
        // If it's not a session error or refresh failed, throw the error
        throw result.error;
      }
      
      return result;
      
    } catch (error) {
      if (retryCount === maxRetries) {
        throw error;
      }
      
      retryCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ [getSalonId] Query failed, retry ${retryCount}/${maxRetries}`, errorMessage);
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
}

/**
 * Recupera il salon_id per l'utente corrente
 * Funziona sia per manager (cerca in profiles) che per collaboratori (cerca in team)
 */
export const getSalonId = async (): Promise<string | null> => {
  try {
    // Prima recupera l'utente autenticato con retry automatico
    const userResult = await executeWithSessionRetry(async () => 
      await supabase.auth.getUser()
    );
    
    const user = userResult?.data?.user;

    if (!user) {
      console.error("Errore nel recupero dell'utente: Utente non autenticato");
      return null;
    }

    // Prima cerca salon_id in profiles (per manager) con retry automatico
    console.log(`🔍 [DEBUG] Searching in profiles for user: ${user.id}`);
    
    let profileResult;
    try {
      profileResult = await executeWithSessionRetry(async () =>
        await supabase
          .from('profiles')
          .select('salon_id')
          .eq('id', user.id)
          .maybeSingle() // Usa maybeSingle invece di single per evitare errori se non trova record
      );
      
      console.log(`🔍 [DEBUG] Profiles query result:`, {
        data: profileResult.data,
        error: profileResult.error
      });
      
    } catch (profileError) {
      console.warn(`⚠️ [DEBUG] Profiles query failed:`, profileError);
      profileResult = { data: null, error: profileError };
    }

    if (profileResult.data?.salon_id) {
      console.log("✅ [DEBUG] Manager found, salon_id from profiles:", profileResult.data.salon_id);
      return profileResult.data.salon_id;
    }

    // Se non trovato in profiles, cerca in team (per collaboratori) con retry automatico e più tentativi
    let teamResult = null;
    let retryCount = 0;
    const maxRetries = 5;
    
    console.log(`🔍 [DEBUG] Starting team search for user: ${user.id}`);
    console.log(`🔍 [DEBUG] User email: ${user.email}`);
    
    // Prima, facciamo una query di debug per vedere tutti i record team per questo utente
    let debugResult;
    try {
      debugResult = await executeWithSessionRetry(async () =>
        await supabase
          .from('team')
          .select('*')
          .eq('user_id', user.id)
      );
      
      console.log(`🔍 [DEBUG] All team records for user ${user.id}:`, debugResult.data);
      console.log(`🔍 [DEBUG] Team query error:`, debugResult.error);
    } catch (debugError) {
      console.warn(`⚠️ [DEBUG] Debug team query failed:`, debugError);
    }
    
    while (retryCount < maxRetries) {
      console.log(`🔄 [DEBUG] Attempt ${retryCount + 1}/${maxRetries} - Searching team for user: ${user.id}`);
      
      try {
        teamResult = await executeWithSessionRetry(async () =>
          await supabase
            .from('team')
            .select('salon_id, user_id, is_active, name, email, role')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle() // Usa maybeSingle invece di single
        );

        console.log(`🔍 [DEBUG] Team query result on attempt ${retryCount + 1}:`, {
          data: teamResult.data,
          error: teamResult.error,
          userId: user.id
        });

        if (teamResult.data?.salon_id) {
          console.log(`✅ [DEBUG] Collaborator found on attempt ${retryCount + 1}:`, {
            salon_id: teamResult.data.salon_id,
            name: teamResult.data.name,
            email: teamResult.data.email,
            role: teamResult.data.role,
            is_active: teamResult.data.is_active
          });
          return teamResult.data.salon_id;
        }

        // Se non troviamo nulla, proviamo senza il filtro is_active per vedere se esiste il record
        if (!teamResult.data) {
          try {
            const debugNoActiveFilter = await executeWithSessionRetry(async () =>
              await supabase
                .from('team')
                .select('salon_id, user_id, is_active, name, email, role')
                .eq('user_id', user.id)
                .maybeSingle() // Usa maybeSingle invece di single
            );
            
            console.log(`🔍 [DEBUG] Team query WITHOUT is_active filter:`, {
              data: debugNoActiveFilter.data,
              error: debugNoActiveFilter.error
            });
          } catch (debugError) {
            console.warn(`⚠️ [DEBUG] Debug no-active-filter query failed:`, debugError);
          }
        }
      } catch (teamError) {
        console.warn(`⚠️ [DEBUG] Team query attempt ${retryCount + 1} failed:`, teamError);
        teamResult = { data: null, error: teamError };
      }

      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`🔄 [DEBUG] Team record not found for user ${user.id}, retry ${retryCount}/${maxRetries}...`);
        // Aspetta progressivamente di più ad ogni tentativo
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    console.error("❌ [DEBUG] Salon_id not found in profiles or team for user after retries:", user.id);
    console.error("🔍 [DEBUG] Final team query result:", teamResult);
    console.error("🔍 [DEBUG] User details:", {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata
    });
    
    // Ultimo tentativo: verifica se esistono ALTRI record per lo stesso email
    try {
      const emailDebugResult = await executeWithSessionRetry(async () =>
        await supabase
          .from('team')
          .select('*')
          .eq('email', user.email)
      );
      
      console.error("🔍 [DEBUG] Team records with same email:", emailDebugResult.data);
    } catch (emailError) {
      console.error("⚠️ [DEBUG] Email debug query failed:", emailError);
    }
    
    return null;
  } catch (error) {
    console.error("Errore inaspettato nel recupero del salon_id:", error);
    return null;
  }
};

/**
 * Recupera l'ID del team member per l'utente corrente
 * @returns Promise<string | null> - L'ID del team member o null se non trovato
 */
export const getCurrentTeamMemberId = async (): Promise<string | null> => {
  try {
    const userResult = await executeWithSessionRetry(async () =>
      await supabase.auth.getUser()
    );
    
    const user = userResult?.data?.user;
    
    if (!user) {
      console.error("Errore nel recupero dell'utente: Utente non autenticato");
      return null;
    }

    // Cerca l'utente nella tabella team con retry automatico
    const teamResult = await executeWithSessionRetry(async () =>
      await supabase
        .from('team')
        .select('id')
        .eq('user_id', user.id)
        .single()
    );

    if (teamResult.data?.id) {
      console.log("Team member ID found:", teamResult.data.id);
      return teamResult.data.id;
    }

    console.error("Team member ID not found for user:", user.id);
    return null;
  } catch (error) {
    console.error("Errore inaspettato nel recupero del team member ID:", error);
    return null;
  }
};

/**
 * Aggiorna lo stato della sidebar per un team member
 * @param teamMemberId - L'ID del team member
 * @param sidebarOpen - Lo stato della sidebar (true = aperta, false = chiusa)
 * @returns Promise<boolean> - true se l'aggiornamento è riuscito
 */
export const updateTeamMemberSidebarState = async (
  teamMemberId: string,
  sidebarOpen: boolean
): Promise<boolean> => {
  try {
    const updateResult = await executeWithSessionRetry(async () =>
      await supabase
        .from('team')
        .update({ sidebar: sidebarOpen })
        .eq('id', teamMemberId)
    );

    if (updateResult.error) {
      console.error("Errore nell'aggiornamento dello stato sidebar:", updateResult.error);
      return false;
    }

    console.log(`Sidebar state updated for team member ${teamMemberId}: ${sidebarOpen}`);
    return true;
  } catch (error) {
    console.error("Errore inaspettato nell'aggiornamento dello stato sidebar:", error);
    return false;
  }
};

/**
 * Controlla se l'utente corrente può modificare un appuntamento specifico
 * @param appointmentTeamId - Il team_id dell'appuntamento
 * @param hasPermission - Funzione per controllare i permessi
 * @returns Promise<boolean> - true se l'utente può modificare l'appuntamento
 */
export const canEditAppointment = async (
  appointmentTeamId: string,
  hasPermission: (permission: string) => boolean
): Promise<boolean> => {
  try {
    // Controlla se l'utente ha i permessi base per modificare appuntamenti
    if (!hasPermission || !hasPermission('canEditAppointments')) {
      return false;
    }

    // Se l'utente ha permesso per gestire appuntamenti altrui, può modificare qualsiasi appuntamento
    if (hasPermission('canManageOthersAppointments')) {
      return true;
    }

    // Altrimenti, controlla se l'utente è il proprietario dell'appuntamento
    const userResult = await executeWithSessionRetry(async () =>
      await supabase.auth.getUser()
    );
    
    const user = userResult?.data?.user;
    
    if (!user) {
      return false;
    }

    // Controlla se l'utente è nel team con retry automatico
    const teamResult = await executeWithSessionRetry(async () =>
      await supabase
        .from('team')
        .select('id')
        .eq('user_id', user.id)
        .single()
    );

    if (teamResult.data && teamResult.data.id === appointmentTeamId) {
      return true; // L'utente è il proprietario dell'appuntamento
    }

    return false; // L'utente non è il proprietario e non ha permesso per gestire appuntamenti altrui
  } catch (error) {
    console.error('Error checking appointment edit permission:', error);
    return false;
  }
}; 