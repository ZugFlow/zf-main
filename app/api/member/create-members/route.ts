// app/api/member/create-members/route.ts
// 
// ARCHITETTURA DATI:
// - profiles: Solo MANAGER (titolari dei saloni)
// - team: COLLABORATORI collegati al salon_id del manager
// 
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 🔐 Client Admin: solo backend!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // chiave segreta (env server)
);

export async function POST(req: Request) {
  try {
    const { email, password, name, salon_id } = await req.json();
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password e nome sono obbligatori." },
        { status: 400 }
      );
    }

    // 1. Crea utente in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        salon_id,
        role: 'member'
      }
    });

    if (error || !data?.user) {
      console.error("❌ Errore creazione utente Auth:", error);
      return NextResponse.json({ error: error?.message }, { status: 500 });
    }

    const user_id = data.user.id;
    console.log("✅ Utente Auth creato:", user_id);

    // 2. Inserisci il collaboratore SOLO nella tabella `team` (collegato al salon_id del manager)
    const { error: teamError } = await supabaseAdmin
      .from('team')
      .insert({
        user_id,
        email,
        name,
        salon_id,
        ColorMember: '#ff00ff', // eventualmente da randomizzare
        visible_users: true,
        order_column: 0,
        avatar_url: '',
        role: 'member', // Set default role as member
        is_active: true // Membro attivo di default
      });

    if (teamError) {
      console.error("❌ Errore inserimento team:", teamError);
      
      // Se fallisce l'inserimento nel team, elimina anche l'utente creato in Auth
      try {
        await supabaseAdmin.auth.admin.deleteUser(user_id);
        console.log("🔄 Rollback: utente Auth eliminato dopo errore team");
      } catch (rollbackError) {
        console.error("❌ Errore durante rollback utente Auth:", rollbackError);
      }
      
      return NextResponse.json({ error: teamError.message }, { status: 500 });
    }

    console.log("✅ Collaboratore creato nella tabella team con salon_id:", salon_id);

    // 2.5. Verifica che il record sia stato inserito correttamente
    const { data: verifyTeam, error: verifyError } = await supabaseAdmin
      .from('team')
      .select('id, salon_id, user_id, is_active, name, email, role')
      .eq('user_id', user_id)
      .single();

    if (verifyError || !verifyTeam) {
      console.error("❌ Errore verifica inserimento team:", verifyError);
      console.error("🔍 [DEBUG] User ID cercato:", user_id);
      
      // Query di debug per vedere tutti i record team
      const { data: allTeamRecords } = await supabaseAdmin
        .from('team')
        .select('*')
        .eq('email', email);
      
      console.error("🔍 [DEBUG] Tutti i record team con questa email:", allTeamRecords);
      
      return NextResponse.json({ error: "Errore durante la verifica del collaboratore creato" }, { status: 500 });
    }

    console.log("✅ [DEBUG] Verifica completata - Team record inserito correttamente:", {
      team_id: verifyTeam.id,
      salon_id: verifyTeam.salon_id,
      user_id: verifyTeam.user_id,
      name: verifyTeam.name,
      email: verifyTeam.email,
      is_active: verifyTeam.is_active,
      role: verifyTeam.role
    });

    // 3. Crea i permessi di default per il nuovo membro del team
    const now = new Date().toISOString();
    const defaultPermissions = [
      // Calendario e Appuntamenti - permessi base per vedere appuntamenti e calendario
      { user_id, permesso: 'canViewAppointments', valore: true, created_at: now, updated_at: now },
      { user_id, permesso: 'canCreateAppointments', valore: true, created_at: now, updated_at: now },
      { user_id, permesso: 'canEditAppointments', valore: true, created_at: now, updated_at: now },
      // Prenotazioni Online - permessi base
      { user_id, permesso: 'canViewOnlineBookings', valore: true, created_at: now, updated_at: now },
      { user_id, permesso: 'canManageOnlineBookings', valore: true, created_at: now, updated_at: now },
      // Clienti - permessi base
      { user_id, permesso: 'canViewClients', valore: true, created_at: now, updated_at: now },
      { user_id, permesso: 'canCreateClients', valore: true, created_at: now, updated_at: now },
      { user_id, permesso: 'canEditClients', valore: true, created_at: now, updated_at: now },
      // Servizi - permessi base
      { user_id, permesso: 'canViewServices', valore: true, created_at: now, updated_at: now },
      // Finanze - permessi base (solo visualizzazione)
      { user_id, permesso: 'canViewFinance', valore: true, created_at: now, updated_at: now },
      // Magazzino - permessi base (solo visualizzazione)
      { user_id, permesso: 'canViewInventory', valore: true, created_at: now, updated_at: now }
    ];

    const { error: permissionsError } = await supabaseAdmin
      .from('permissions')
      .insert(defaultPermissions);

    if (permissionsError) {
      console.error("❌ Errore creazione permessi di default:", permissionsError);
      // Non blocchiamo la creazione del membro se i permessi falliscono
      console.log("⚠️ Membro creato ma permessi non assegnati. I permessi dovranno essere assegnati manualmente.");
    } else {
      console.log("✅ Permessi di default creati per il nuovo membro");
    }

    return NextResponse.json({ 
      success: true, 
      user_id,
      message: "Collaboratore creato con successo e collegato al salone con permessi di base" 
    });
  } catch (err: any) {
    console.error("❌ Errore nella creazione del membro:", err);
    return NextResponse.json(
      { error: err.message || 'Errore generico durante la creazione.' },
      { status: 500 }
    );
  }
}
