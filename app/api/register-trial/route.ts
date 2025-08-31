import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const { email, password, plan } = await req.json();

  if (!email || !password || !plan) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Errore durante la creazione dell'utente." }, { status: 400 });
    }    console.log("👤 Utente creato in Auth:", userId);

    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + 90); // esattamente 90 giorni dopo

    // ✅ Inserimento diretto del profilo con UPSERT per evitare conflitti
    console.log("📝 Creazione profilo con UPSERT...");
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        email,
        plan: "trial",
        role: "manager",
        is_active: true,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (profileError) {
      console.error("❌ Errore UPSERT profilo:", profileError);
      return NextResponse.json({ 
        error: "Errore nella creazione del profilo utente: " + profileError.message 
      }, { status: 500 });
    }

    console.log("✅ Profilo creato/aggiornato con successo:", profileData);

    // Verifica finale che il profilo esista
    const { data: finalProfile, error: finalError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (finalError || !finalProfile) {
      console.error("❌ Verifica finale fallita - profilo non trovato:", finalError?.message);
      return NextResponse.json({ 
        error: "Errore nella verifica del profilo utente" 
      }, { status: 500 });
    }
    
    console.log("✅ Verifica finale superata - profilo confermato:", finalProfile);

    // Inserimento nella tabella `team` per il manager trial
    if (!finalProfile.salon_id) {
      console.error("❌ Errore: salon_id non trovato nel profilo");
      return NextResponse.json({ 
        error: "Errore: salon_id non trovato nel profilo utente" 
      }, { status: 500 });
    }

    const { error: teamError } = await supabase.from("team").insert({
      user_id: userId,
      email,
      name: email.split('@')[0], // Usa la parte prima della @ come nome di default
      salon_id: finalProfile.salon_id,
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
      return NextResponse.json({ 
        error: "Errore nella creazione del record team: " + teamError.message 
      }, { status: 500 });
    }

    console.log("✅ Manager trial creato nella tabella team con salon_id:", finalProfile.salon_id);

    await fetch("http://49.12.192.81:5678/webhook/trial-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        email,
        plan: "trial",
        is_active: true,
        created_at: now.toISOString(),
        expires_at: expires.toISOString(),
        vincolo_attivo: expires.toISOString(),
      }),
    });

    await fetch("http://49.12.192.81:5678/webhook/send-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        login_url: "https://zugflow.com/login",
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Registrazione completata. Controlla la tua email per le credenziali.",
    });
  } catch (err) {
    console.error("Errore:", err);
    return NextResponse.json({ error: "Errore durante la registrazione" }, { status: 500 });
  }
}
