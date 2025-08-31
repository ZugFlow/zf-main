import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Client admin per operazioni privilegiate
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verifica autenticazione
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Se non c'è sessione dai cookie, prova con l'header Authorization
    if (!session?.user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (user && !userError) {
          session = { user, access_token: token } as any;
        }
      }
    }
    
    console.log('🔍 Session check:', { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      userId: session?.user?.id,
      error: sessionError 
    });
    
    if (!session?.user) {
      console.log('❌ No session or user found');
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Ottieni il salon_id dell'utente
    console.log('🔍 Fetching profile for user:', session.user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('salon_id')
      .eq('id', session.user.id)
      .single();

    console.log('🔍 Profile result:', { 
      profile, 
      error: profileError 
    });

    if (profileError || !profile?.salon_id) {
      console.log('❌ Profile error or missing salon_id:', { profileError, salonId: profile?.salon_id });
      return NextResponse.json(
        { error: 'Profilo non trovato o salon_id mancante' },
        { status: 404 }
      );
    }

    const salonId = profile.salon_id;

    // Inizia la transazione per eliminare tutti i dati collegati al salon_id usando il client admin
    console.log('🗑️ Inizio eliminazione dati per salon_id:', salonId);
    const deleteOperations = [
      // 1. Elimina notifiche appuntamenti
      supabaseAdmin.from('appointment_notifications').delete().eq('salon_id', salonId),
      
      // 2. Elimina team members
      supabaseAdmin.from('team').delete().eq('salon_id', salonId),
      
      // 3. Elimina fatture
      supabaseAdmin.from('fatture').delete().eq('salon_id', salonId),
      
      // 4. Elimina schedule extra
      supabaseAdmin.from('extra_schedules').delete().eq('salon_id', salonId),
      
      // 5. Elimina orari lavorativi
      supabaseAdmin.from('working_hours').delete().eq('salon_id', salonId),
      
      // 6. Elimina testi personalizzati
      supabaseAdmin.from('custom_texts').delete().eq('salon_id', salonId),
      
      // 7. Elimina analytics web
      supabaseAdmin.from('web_analytics').delete().eq('salon_id', salonId),
      
      // 8. Elimina messaggi di contatto web
      supabaseAdmin.from('web_contact_messages').delete().eq('salon_id', salonId),
      
      // 9. Elimina prenotazioni web
      supabaseAdmin.from('web_bookings').delete().eq('salon_id', salonId),
      
      // 10. Elimina testimonianze salon
      supabaseAdmin.from('salon_testimonials').delete().eq('salon_id', salonId),
      
      // 11. Elimina gallerie salon
      supabaseAdmin.from('salon_galleries').delete().eq('salon_id', salonId),
      
      // 12. Elimina impostazioni web salon
      supabaseAdmin.from('salon_web_settings').delete().eq('salon_id', salonId),
      
      // 13. Elimina impostazioni prenotazioni online
      supabaseAdmin.from('online_booking_settings').delete().eq('salon_id', salonId),
      
      // 14. Elimina servizi
      supabaseAdmin.from('services').delete().eq('salon_id', salonId),
      
      // 15. Elimina ordini
      supabaseAdmin.from('orders').delete().eq('salon_id', salonId),
      
      // 16. Elimina prenotazioni online
      supabaseAdmin.from('online_bookings').delete().eq('salon_id', salonId),
      
      // 17. Elimina variabili personalizzate
      supabaseAdmin.from('custom_variables').delete().eq('salon_id', salonId),
      
      // 18. Elimina permessi ferie
      supabaseAdmin.from('permessiferie').delete().eq('salon_id', salonId),
      
      // 19. Elimina saldi ferie
      supabaseAdmin.from('holiday_balances').delete().eq('salon_id', salonId),
      
      // 20. Elimina impostazioni orari
      supabaseAdmin.from('hoursettings').delete().eq('salon_id', salonId),
    ];

    // Esegui tutte le operazioni di eliminazione
    const results = await Promise.allSettled(deleteOperations);
    
    // Controlla se ci sono stati errori
    const errors = results
      .filter((result, index) => result.status === 'rejected')
      .map((result, index) => ({
        operation: index + 1,
        error: result.status === 'rejected' ? result.reason : null
      }));

    if (errors.length > 0) {
      console.error('Errori durante l\'eliminazione:', errors);
      return NextResponse.json(
        { 
          error: 'Errore durante l\'eliminazione di alcuni dati',
          details: errors
        },
        { status: 500 }
      );
    }

    // Infine, elimina il profilo dell'utente
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', session.user.id);

    if (profileDeleteError) {
      console.error('Errore eliminazione profilo:', profileDeleteError);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione del profilo' },
        { status: 500 }
      );
    }

    // Elimina l'utente dall'autenticazione di Supabase usando il client admin
    console.log('🗑️ Eliminazione utente dall\'autenticazione:', session.user.id);
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(session.user.id);

    if (authDeleteError) {
      console.error('Errore eliminazione utente dall\'autenticazione:', authDeleteError);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione dell\'account dall\'autenticazione' },
        { status: 500 }
      );
    }

    console.log('✅ Utente eliminato dall\'autenticazione con successo');

    // Disconnetti l'utente (anche se sarà già disconnesso dopo l'eliminazione)
    await supabase.auth.signOut();

    return NextResponse.json(
      { 
        success: true,
        message: 'Account eliminato completamente con successo'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Errore generale:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
