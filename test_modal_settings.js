// Test per verificare che le impostazioni del modal funzionino correttamente
// Esegui questo script per testare il sistema di impostazioni

const { createClient } = require('@supabase/supabase-js');

// Configura Supabase (sostituisci con le tue credenziali)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente Supabase non configurate');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testModalSettings() {
  console.log('🧪 Test delle impostazioni del modal...\n');

  try {
    // 1. Verifica che la tabella esista
    console.log('1. Verifica esistenza tabella...');
    const { data: tableExists, error: tableError } = await supabase
      .from('appointment_modal_settings')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ Tabella appointment_modal_settings non trovata:', tableError);
      return;
    }
    console.log('✅ Tabella appointment_modal_settings trovata\n');

    // 2. Ottieni un salon_id di test
    console.log('2. Ottieni salon_id di test...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('salon_id')
      .not('salon_id', 'is', null)
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ Nessun profilo con salon_id trovato:', profilesError);
      return;
    }

    const testSalonId = profiles[0].salon_id;
    console.log(`✅ Salon ID di test: ${testSalonId}\n`);

    // 3. Verifica impostazioni esistenti
    console.log('3. Verifica impostazioni esistenti...');
    const { data: existingSettings, error: fetchError } = await supabase
      .from('appointment_modal_settings')
      .select('*')
      .eq('salon_id', testSalonId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Errore nel recupero impostazioni:', fetchError);
      return;
    }

    if (existingSettings) {
      console.log('✅ Impostazioni esistenti trovate:');
      console.log(`   - Titolo: ${existingSettings.modal_title}`);
      console.log(`   - Sottotitolo: ${existingSettings.modal_subtitle || 'Nessuno'}`);
      console.log(`   - Sezione cliente: ${existingSettings.client_section_title}`);
    } else {
      console.log('ℹ️ Nessuna impostazione trovata, verrà creata automaticamente\n');
    }

    // 4. Test aggiornamento impostazioni
    console.log('4. Test aggiornamento impostazioni...');
    const testTitle = `Test Modal ${new Date().toISOString().slice(0, 19)}`;
    const testSubtitle = 'Sottotitolo di test';

    const { data: updatedSettings, error: updateError } = await supabase
      .from('appointment_modal_settings')
      .upsert({
        salon_id: testSalonId,
        modal_title: testTitle,
        modal_subtitle: testSubtitle,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (updateError) {
      console.error('❌ Errore nell\'aggiornamento:', updateError);
      return;
    }

    console.log('✅ Impostazioni aggiornate con successo:');
    console.log(`   - Nuovo titolo: ${updatedSettings.modal_title}`);
    console.log(`   - Nuovo sottotitolo: ${updatedSettings.modal_subtitle}`);
    console.log(`   - Aggiornato il: ${updatedSettings.updated_at}\n`);

    // 5. Test realtime (simulato)
    console.log('5. Test realtime...');
    console.log('ℹ️ Per testare il realtime, apri il modal in un\'altra finestra e modifica le impostazioni');
    console.log('ℹ️ Il modal dovrebbe aggiornarsi automaticamente\n');

    // 6. Verifica struttura dati
    console.log('6. Verifica struttura dati...');
    const requiredFields = [
      'modal_title', 'modal_subtitle', 'client_section_title', 
      'service_section_title', 'time_section_title', 'notes_section_title'
    ];

    const missingFields = requiredFields.filter(field => !(field in updatedSettings));
    
    if (missingFields.length > 0) {
      console.error('❌ Campi mancanti:', missingFields);
    } else {
      console.log('✅ Tutti i campi richiesti sono presenti\n');
    }

    // 7. Test reset impostazioni
    console.log('7. Test reset impostazioni...');
    const { error: deleteError } = await supabase
      .from('appointment_modal_settings')
      .delete()
      .eq('salon_id', testSalonId);

    if (deleteError) {
      console.error('❌ Errore nel reset:', deleteError);
    } else {
      console.log('✅ Impostazioni reset con successo');
      console.log('ℹ️ Le impostazioni di default verranno ricreate automaticamente\n');
    }

    console.log('🎉 Test completato con successo!');
    console.log('\n📋 Prossimi passi:');
    console.log('1. Esegui il file SQL per abilitare il realtime');
    console.log('2. Apri l\'applicazione e vai alle impostazioni del modal');
    console.log('3. Modifica il titolo del modal');
    console.log('4. Apri il modal di nuovo appuntamento e verifica che il titolo sia aggiornato');

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

// Esegui il test
testModalSettings();
