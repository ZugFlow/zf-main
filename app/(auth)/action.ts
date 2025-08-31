"use server";

import { createClient } from "@/utils/supabase/server";

export type FormState = {
  message: string;
  error?: string;
  redirectTo?: string;
};

export const registerAction = async (formData: FormData): Promise<FormState> => {
  const email = formData.get("email")?.toString().trim() || "";
  const password = formData.get("password")?.toString() || "";
  const confirmPassword = formData.get("confirm-password")?.toString() || "";

  if (!email || !password || !confirmPassword) {
    return { message: "", error: "Tutti i campi sono obbligatori." };
  }

  if (!email.includes("@") || !email.includes(".")) {
    return { message: "", error: "Inserisci un'email valida." };
  }

  if (password.length < 8) {
    return { message: "", error: "La password deve contenere almeno 8 caratteri." };
  }

  if (password !== confirmPassword) {
    return { message: "", error: "Le password non coincidono." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error || !data.user) {
      console.error("❌ Errore Supabase Auth:", error?.message);
      return { message: "", error: error?.message || "Errore durante la registrazione." };
    }

    const userId = data.user.id;

    // Inserimento nella tabella `profiles`
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email,
    });

    if (profileError) {
      console.error("❌ Errore inserimento profilo:", profileError.message);

      // Sicurezza: elimina l'utente Auth appena creato
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error("❌ Errore rollback utente Auth:", deleteError.message);
      }

      return { message: "", error: "Registrazione annullata per errore tecnico. Riprova." };
    }

    // Recupera il salon_id dal profilo appena creato
    const { data: profileData, error: profileFetchError } = await supabase
      .from("profiles")
      .select("salon_id")
      .eq("id", userId)
      .single();

    if (profileFetchError || !profileData?.salon_id) {
      console.error("❌ Errore recupero salon_id:", profileFetchError?.message);
      return { message: "", error: "Errore durante la configurazione del profilo. Riprova." };
    }

    // Inserimento nella tabella `team` per il manager
    const { error: teamError } = await supabase.from("team").insert({
      user_id: userId,
      email,
      name: email.split('@')[0], // Usa la parte prima della @ come nome di default
      salon_id: profileData.salon_id,
      role: 'manager',
      is_active: true,
      visible_users: true,
      order_column: 0,
      ColorMember: '#3b82f6', // Colore blu per i manager
      avatar_url: '',
      sidebar: false
    });

    if (teamError) {
      console.error("❌ Errore inserimento team:", teamError.message);
      
      // Se fallisce l'inserimento nel team, elimina anche l'utente Auth e il profilo
      try {
        await supabase.auth.admin.deleteUser(userId);
        console.log("🔄 Rollback: utente Auth eliminato dopo errore team");
      } catch (rollbackError) {
        console.error("❌ Errore durante rollback utente Auth:", rollbackError);
      }
      
      return { message: "", error: "Registrazione annullata per errore tecnico. Riprova." };
    }

    console.log("✅ Manager creato nella tabella team con salon_id:", profileData.salon_id);

    return {
      message: "Registrazione completata! Controlla la tua email.",
      redirectTo: "/registrazione_completata",
    };
  } catch (err) {
    console.error("❌ Errore interno:", err);
    return {
      message: "",
      error: "Errore interno del server. Riprova più tardi.",
    };
  }
};
