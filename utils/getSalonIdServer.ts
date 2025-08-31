import { createClient } from "@/utils/supabase/server";

/**
 * Recupera il salon_id per l'utente corrente (versione server-side)
 * Funziona sia per manager (cerca in profiles) che per collaboratori (cerca in team)
 */
export const getSalonId = async (): Promise<string | null> => {
  try {
    const supabase = await createClient();
    
    // Prima recupera l'utente autenticato
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      console.error("Errore nel recupero dell'utente:", userError?.message || "Utente non autenticato");
      return null;
    }

    // Prima cerca salon_id in profiles (per manager)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('salon_id')
      .eq('id', user.id)
      .single();

    if (!profileError && profileData?.salon_id) {
      console.log("Manager found, salon_id from profiles:", profileData.salon_id);
      return profileData.salon_id;
    }

    // Se non trovato in profiles, cerca in team (per collaboratori)
    const { data: teamData, error: teamError } = await supabase
      .from('team')
      .select('salon_id')
      .eq('user_id', user.id)
      .single();

    if (!teamError && teamData?.salon_id) {
      console.log("Collaborator found, salon_id from team:", teamData.salon_id);
      return teamData.salon_id;
    }

    console.error("Salon_id not found in profiles or team for user:", user.id);
    return null;
  } catch (error) {
    console.error("Errore inaspettato nel recupero del salon_id:", error);
    return null;
  }
}; 