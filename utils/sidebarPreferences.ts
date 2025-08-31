import { createClient } from "@/utils/supabase/client";
import { getCurrentTeamMemberId } from "./getSalonId";

const supabase = createClient();

/**
 * Salva la preferenza della sidebar per l'utente corrente
 * @param showChat - true per mostrare la chat, false per mostrare gli appuntamenti
 * @returns Promise<boolean> - true se salvato con successo
 */
export const saveSidebarPreference = async (showChat: boolean): Promise<boolean> => {
  try {
    const teamMemberId = await getCurrentTeamMemberId();
    
    if (!teamMemberId) {
      console.error('Team member ID not found, cannot save sidebar preference');
      return false;
    }

    const { error } = await supabase
      .from('team')
      .update({ 
        SidebarChat: showChat 
      })
      .eq('id', teamMemberId);

    if (error) {
      console.error('Error saving sidebar preference:', error);
      return false;
    }

    console.log('✅ Sidebar preference saved successfully:', { showChat, teamMemberId });
    return true;
  } catch (error) {
    console.error('Unexpected error saving sidebar preference:', error);
    return false;
  }
};

/**
 * Carica la preferenza della sidebar per l'utente corrente
 * @returns Promise<boolean | null> - true per chat, false per appuntamenti, null se non trovato
 */
export const loadSidebarPreference = async (): Promise<boolean | null> => {
  try {
    const teamMemberId = await getCurrentTeamMemberId();
    
    if (!teamMemberId) {
      console.error('Team member ID not found, cannot load sidebar preference');
      return null;
    }

    const { data, error } = await supabase
      .from('team')
      .select('SidebarChat')
      .eq('id', teamMemberId)
      .single();

    if (error) {
      console.error('Error loading sidebar preference:', error);
      return null;
    }

    console.log('✅ Sidebar preference loaded:', { SidebarChat: data.SidebarChat, teamMemberId });
    return data.SidebarChat;
  } catch (error) {
    console.error('Unexpected error loading sidebar preference:', error);
    return null;
  }
};

/**
 * Togla la preferenza della sidebar per l'utente corrente
 * @returns Promise<boolean | null> - il nuovo valore o null se errore
 */
export const toggleSidebarPreference = async (): Promise<boolean | null> => {
  try {
    const currentPreference = await loadSidebarPreference();
    
    if (currentPreference === null) {
      // Se non esiste una preferenza, imposta come default false (appuntamenti)
      const success = await saveSidebarPreference(false);
      return success ? false : null;
    }
    
    const newPreference = !currentPreference;
    const success = await saveSidebarPreference(newPreference);
    
    return success ? newPreference : null;
  } catch (error) {
    console.error('Unexpected error toggling sidebar preference:', error);
    return null;
  }
};
