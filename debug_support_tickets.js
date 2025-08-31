// Script di debug per il sistema di ticket di supporto
// Eseguire questo script per verificare le connessioni e le policy

const { createClient } = require('@supabase/supabase-js');

// Configura Supabase (sostituire con le tue credenziali)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSupportTickets() {
  console.log('🔍 Debug del sistema di ticket di supporto...\n');

  try {
    // 1. Verifica autenticazione
    console.log('1. Verifica autenticazione...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Errore autenticazione:', authError);
      return;
    }
    
    if (!user) {
      console.log('⚠️  Nessun utente autenticato');
      return;
    }
    
    console.log('✅ Utente autenticato:', user.email);

    // 2. Verifica ruolo utente
    console.log('\n2. Verifica ruolo utente...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Errore recupero profilo:', profileError);
      return;
    }

    console.log('✅ Ruolo utente:', profile.role);

    // 3. Verifica esistenza tabelle
    console.log('\n3. Verifica esistenza tabelle...');
    
    // Test tabella support_tickets
    const { data: ticketsTest, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('count')
      .limit(1);

    if (ticketsError) {
      console.error('❌ Errore accesso tabella support_tickets:', ticketsError);
    } else {
      console.log('✅ Tabella support_tickets accessibile');
    }

    // Test tabella support_ticket_responses
    const { data: responsesTest, error: responsesError } = await supabase
      .from('support_ticket_responses')
      .select('count')
      .limit(1);

    if (responsesError) {
      console.error('❌ Errore accesso tabella support_ticket_responses:', responsesError);
    } else {
      console.log('✅ Tabella support_ticket_responses accessibile');

    // 4. Test funzioni RPC
    console.log('\n4. Test funzioni RPC...');
    
    // Test funzione statistiche
    const { data: statsData, error: statsError } = await supabase.rpc('get_support_ticket_stats', {
      user_uuid: profile.role === 'admin' ? null : user.id
    });

    if (statsError) {
      console.error('❌ Errore funzione get_support_ticket_stats:', statsError);
    } else {
      console.log('✅ Funzione get_support_ticket_stats funzionante');
      console.log('   Statistiche:', statsData);
    }

    // Test funzione ticket con risposte
    const { data: ticketsData, error: ticketsRpcError } = await supabase.rpc('get_tickets_with_latest_response', {
      user_uuid: profile.role === 'admin' ? null : user.id
    });

    if (ticketsRpcError) {
      console.error('❌ Errore funzione get_tickets_with_latest_response:', ticketsRpcError);
    } else {
      console.log('✅ Funzione get_tickets_with_latest_response funzionante');
      console.log('   Ticket trovati:', ticketsData?.length || 0);
    }

    // 5. Test operazioni CRUD (solo per admin)
    if (profile.role === 'admin') {
      console.log('\n5. Test operazioni CRUD (admin)...');
      
      // Test creazione ticket di test
      const testTicket = {
        user_id: user.id,
        user_email: user.email,
        user_name: 'Test User',
        subject: 'Ticket di Test Debug',
        description: 'Questo è un ticket di test per il debug',
        priority: 'low',
        category: 'general'
      };

      const { data: newTicket, error: createError } = await supabase
        .from('support_tickets')
        .insert(testTicket)
        .select()
        .single();

      if (createError) {
        console.error('❌ Errore creazione ticket:', createError);
      } else {
        console.log('✅ Ticket di test creato:', newTicket.id);

        // Test creazione risposta
        const testResponse = {
          ticket_id: newTicket.id,
          user_id: user.id,
          message: 'Risposta di test per il debug',
          is_admin: true
        };

        const { data: newResponse, error: responseError } = await supabase
          .from('support_ticket_responses')
          .insert(testResponse)
          .select()
          .single();

        if (responseError) {
          console.error('❌ Errore creazione risposta:', responseError);
        } else {
          console.log('✅ Risposta di test creata:', newResponse.id);

          // Test aggiornamento ticket
          const { error: updateError } = await supabase
            .from('support_tickets')
            .update({ status: 'resolved' })
            .eq('id', newTicket.id);

          if (updateError) {
            console.error('❌ Errore aggiornamento ticket:', updateError);
          } else {
            console.log('✅ Ticket aggiornato con successo');

            // Test eliminazione (pulizia)
            const { error: deleteResponseError } = await supabase
              .from('support_ticket_responses')
              .delete()
              .eq('ticket_id', newTicket.id);

            if (deleteResponseError) {
              console.error('❌ Errore eliminazione risposte:', deleteResponseError);
            } else {
              console.log('✅ Risposte eliminate');

              const { error: deleteTicketError } = await supabase
                .from('support_tickets')
                .delete()
                .eq('id', newTicket.id);

              if (deleteTicketError) {
                console.error('❌ Errore eliminazione ticket:', deleteTicketError);
              } else {
                console.log('✅ Ticket eliminato');
              }
            }
          }
        }
      }
    }

    // 6. Verifica policy RLS
    console.log('\n6. Verifica policy RLS...');
    
    // Query per verificare le policy
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies_info');

    if (policiesError) {
      console.log('⚠️  Impossibile verificare le policy automaticamente');
      console.log('   Verifica manualmente nel dashboard Supabase:');
      console.log('   - Table Editor > support_tickets > Policies');
      console.log('   - Table Editor > support_ticket_responses > Policies');
    } else {
      console.log('✅ Policy verificate:', policies);
    }

    console.log('\n🎉 Debug completato!');

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

// Funzione helper per verificare le policy (se disponibile)
async function getPoliciesInfo() {
  const { data, error } = await supabase
    .from('information_schema.policies')
    .select('*')
    .eq('table_schema', 'public')
    .in('table_name', ['support_tickets', 'support_ticket_responses']);

  if (error) {
    console.error('Errore nel recupero delle policy:', error);
    return null;
  }

  return data;
}

// Esegui il debug se questo file viene eseguito direttamente
if (require.main === module) {
  debugSupportTickets();
}

module.exports = { debugSupportTickets };
